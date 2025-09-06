import Product from '../model/product.js';
import Category from '../model/category.js';
import SubCategory from '../model/subCategory.js';
import Brand from '../model/brand.js';
import Review from '../model/review.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productController = {
    // Create new product
    createProduct: async (req, res) => {
        try {
            const {
                name,
                description,
                shortDescription,
                category,
                subCategory,
                brand,
                price,
                comparePrice,
                costPrice,
                sku,
                barcode,
                inventory,
                weight,
                dimensions,
                variants,
                seoTitle,
                seoDescription,
                tags,
                status,
                isFeature,
                visibility,
                shippingRequired,
                shippingClass
            } = req.body;

            // Validate required fields
            if (!name || !description || !category || !price) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, description, category, and price are required'
                });
            }

            // Verify category exists
            const categoryExists = await Category.findById(category);
            if (!categoryExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category'
                });
            }

            // Verify subcategory exists if provided
            if (subCategory) {
                const subCategoryExists = await SubCategory.findById(subCategory);
                if (!subCategoryExists) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid subcategory'
                    });
                }
            }

            // Verify brand exists if provided
            if (brand) {
                const brandExists = await Brand.findById(brand);
                if (!brandExists) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid brand'
                    });
                }
            }

            // Handle image uploads
            let images = [];
            if (req.files && req.files.length > 0) {
                images = req.files.map((file, index) => ({
                    // Store URL relative to static root. public/ is already served by express.static('public')
                    url: `/product_images/${file.filename}`,
                    alt: `${name} - Image ${index + 1}`,
                    isMain: index === 0
                }));
            }

            // Create product
            const product = new Product({
                name,
                description,
                shortDescription,
                category,
                subCategory,
                brand,
                vendor: req.user.id,
                price: parseFloat(price),
                comparePrice: comparePrice ? parseFloat(comparePrice) : undefined,
                costPrice: costPrice ? parseFloat(costPrice) : undefined,
                sku,
                barcode,
                inventory: inventory ? JSON.parse(inventory) : {
                    quantity: 0,
                    trackQuantity: true,
                    allowBackorders: false,
                    lowStockThreshold: 5
                },
                weight: weight ? parseFloat(weight) : undefined,
                dimensions: dimensions ? JSON.parse(dimensions) : undefined,
                variants: variants ? JSON.parse(variants) : [],
                images,
                seoTitle: seoTitle || name,
                seoDescription: seoDescription || description,
                tags: tags ? JSON.parse(tags) : [],
                status: req.user.role === 'vendor' ? 'pending' : (status || 'active'), // Vendors create pending products
                isFeature: req.user.role === 'admin' ? (isFeature === 'true') : false, // Only admin can feature
                visibility: visibility || 'public',
                shippingRequired: shippingRequired !== 'false',
                shippingClass
            });

            await product.save();

            await product.populate([
                { path: 'category', select: 'name' },
                { path: 'subCategory', select: 'name' },
                { path: 'brand', select: 'name' },
                { path: 'vendor', select: 'name email' }
            ]);

            res.status(201).json({
                success: true,
                message: 'Product created successfully',
                data: product
            });
        } catch (error) {
            console.error('Error creating product:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create product',
                error: error.message
            });
        }
    },

    // Get all products with filters and pagination
    getAllProducts: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                category,
                subCategory,
                brand,
                vendor,
                status,
                minPrice,
                maxPrice,
                search,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                isFeature
            } = req.query;

            // Build filter object
            const filter = {};
            
            if (category) filter.category = category;
            if (subCategory) filter.subCategory = subCategory;
            if (brand) filter.brand = brand;
            if (vendor) filter.vendor = vendor;
            if (status) filter.status = status;
            if (isFeature !== undefined) filter.isFeature = isFeature === 'true';
            
            // Price filter
            if (minPrice || maxPrice) {
                filter.price = {};
                if (minPrice) filter.price.$gte = parseFloat(minPrice);
                if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
            }

            // Search filter
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { tags: { $in: [new RegExp(search, 'i')] } }
                ];
            }

            // Sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Calculate pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            // Execute query
            const products = await Product.find(filter)
                .populate('category', 'name')
                .populate('subCategory', 'name')
                .populate('brand', 'name')
                .populate('vendor', 'name email')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit));

            // Get total count
            const total = await Product.countDocuments(filter);

            res.json({
                success: true,
                data: {
                    products,
                    pagination: {
                        current: parseInt(page),
                        pages: Math.ceil(total / parseInt(limit)),
                        total,
                        limit: parseInt(limit)
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch products',
                error: error.message
            });
        }
    },

    // Get single product
    getProduct: async (req, res) => {
        try {
            const { id } = req.params;

            const product = await Product.findById(id)
                .populate('category', 'name description')
                .populate('subCategory', 'name description')
                .populate('brand', 'name description')
                .populate('vendor', 'name email');

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            // Increment view count
            await Product.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

            res.json({
                success: true,
                data: product
            });
        } catch (error) {
            console.error('Error fetching product:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch product',
                error: error.message
            });
        }
    },

    // Update product
    updateProduct: async (req, res) => {
        try {
            const { id } = req.params;
            const updates = { ...req.body };

            // Find existing product
            const product = await Product.findById(id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            // Check if user owns the product or is admin
            if (product.vendor.toString() !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this product'
                });
            }

            // Handle new image uploads
            if (req.files && req.files.length > 0) {
                const newImages = req.files.map((file, index) => ({
                    url: `/product_images/${file.filename}`,
                    alt: `${updates.name || product.name} - Image ${product.images.length + index + 1}`,
                    isMain: product.images.length === 0 && index === 0
                }));
                updates.images = [...product.images, ...newImages];
            }

            // Parse JSON fields if they exist
            if (updates.inventory) updates.inventory = JSON.parse(updates.inventory);
            if (updates.dimensions) updates.dimensions = JSON.parse(updates.dimensions);
            if (updates.variants) updates.variants = JSON.parse(updates.variants);
            if (updates.tags) updates.tags = updates.tags.split(',').map(tag => tag.trim());

            // Update numeric fields
            if (updates.price) updates.price = parseFloat(updates.price);
            if (updates.comparePrice) updates.comparePrice = parseFloat(updates.comparePrice);
            if (updates.costPrice) updates.costPrice = parseFloat(updates.costPrice);
            if (updates.weight) updates.weight = parseFloat(updates.weight);

            // Update boolean fields
            if (updates.isFeature !== undefined) updates.isFeature = updates.isFeature === 'true';
            if (updates.shippingRequired !== undefined) updates.shippingRequired = updates.shippingRequired !== 'false';

            // Update product
            const updatedProduct = await Product.findByIdAndUpdate(
                id,
                updates,
                { new: true, runValidators: true }
            ).populate([
                { path: 'category', select: 'name' },
                { path: 'subCategory', select: 'name' },
                { path: 'brand', select: 'name' },
                { path: 'vendor', select: 'name email' }
            ]);

            res.json({
                success: true,
                message: 'Product updated successfully',
                data: updatedProduct
            });
        } catch (error) {
            console.error('Error updating product:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update product',
                error: error.message
            });
        }
    },

    // Delete product
    deleteProduct: async (req, res) => {
        try {
            const { id } = req.params;

            const product = await Product.findById(id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            // Check if user owns the product or is admin
            if (product.vendor.toString() !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to delete this product'
                });
            }

            // Delete product images
            if (product.images && product.images.length > 0) {
                for (const image of product.images) {
                    try {
                        // Support legacy paths starting with /public/product_images and new /product_images
                        const filename = path.basename(image.url);
                        const imagePath = path.join(__dirname, '..', 'public', 'product_images', filename);
                        await fs.unlink(imagePath);
                    } catch (error) {
                        console.log('Error deleting image:', error.message);
                    }
                }
            }

            // Delete related reviews
            await Review.deleteMany({ product: id });

            // Delete the product
            await Product.findByIdAndDelete(id);

            res.json({
                success: true,
                message: 'Product deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting product:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete product',
                error: error.message
            });
        }
    },

    // Remove product image
    removeProductImage: async (req, res) => {
        try {
            const { id } = req.params;
            const { imageUrl } = req.body;

            const product = await Product.findById(id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            // Check if user owns the product or is admin
            if (product.vendor.toString() !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to modify this product'
                });
            }

            // Remove image from array
            product.images = product.images.filter(img => img.url !== imageUrl);

            // If removed image was main, set first image as main
            if (product.images.length > 0 && !product.images.some(img => img.isMain)) {
                product.images[0].isMain = true;
            }

            await product.save();

            // Delete the physical file
            try {
                const filename = path.basename(imageUrl);
                const imagePath = path.join(__dirname, '..', 'public', 'product_images', filename);
                await fs.unlink(imagePath);
            } catch (error) {
                console.log('Error deleting image file:', error.message);
            }

            res.json({
                success: true,
                message: 'Image removed successfully',
                data: product
            });
        } catch (error) {
            console.error('Error removing product image:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove image',
                error: error.message
            });
        }
    },

    // Set main product image
    setMainImage: async (req, res) => {
        try {
            const { id } = req.params;
            const { imageUrl } = req.body;

            const product = await Product.findById(id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            // Check if user owns the product or is admin
            if (product.vendor.toString() !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to modify this product'
                });
            }

            // Update main image
            product.images.forEach(img => {
                img.isMain = img.url === imageUrl;
            });

            await product.save();

            res.json({
                success: true,
                message: 'Main image updated successfully',
                data: product
            });
        } catch (error) {
            console.error('Error setting main image:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to set main image',
                error: error.message
            });
        }
    },

    // Get vendor products
    getVendorProducts: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                search,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            // Build filter
            const filter = { vendor: req.user.id };
            if (status) filter.status = status;
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            // Sort
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const products = await Product.find(filter)
                .populate('category', 'name')
                .populate('subCategory', 'name')
                .populate('brand', 'name')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Product.countDocuments(filter);

            res.json({
                success: true,
                data: {
                    products,
                    pagination: {
                        current: parseInt(page),
                        pages: Math.ceil(total / parseInt(limit)),
                        total,
                        limit: parseInt(limit)
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching vendor products:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch vendor products',
                error: error.message
            });
        }
    },

    // Get pending products (admin only)
    getPendingProducts: async (req, res) => {
        try {
            const products = await Product.find({ status: 'pending' })
                .populate('category', 'name')
                .populate('brand', 'name')
                .populate('vendor', 'name email')
                .sort({ createdAt: -1 });

            res.json({
                success: true,
                data: products
            });
        } catch (error) {
            console.error('Error fetching pending products:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch pending products',
                error: error.message
            });
        }
    },

    // Update product status (admin only)
    updateProductStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, reason } = req.body;

            const validStatuses = ['pending', 'active', 'rejected', 'draft'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status'
                });
            }

            const product = await Product.findById(id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            product.status = status;
            if (reason) {
                product.adminNote = reason;
            }
            product.reviewedAt = new Date();
            product.reviewedBy = req.user.id;

            await product.save();

            // Populate for response
            await product.populate([
                { path: 'category', select: 'name' },
                { path: 'brand', select: 'name' },
                { path: 'vendor', select: 'name email' }
            ]);

            res.json({
                success: true,
                message: `Product ${status} successfully`,
                data: product
            });
        } catch (error) {
            console.error('Error updating product status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update product status',
                error: error.message
            });
        }
    }
};

export default productController;
