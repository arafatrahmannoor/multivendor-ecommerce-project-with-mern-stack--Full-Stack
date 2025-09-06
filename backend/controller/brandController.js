/* eslint-env node */
/* global process */

import Brand from '../model/brand.js';
import Product from '../model/product.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const brandController = {
    // Create new brand
    createBrand: async (req, res) => {
        try {
            const { name, description, website } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Brand name is required'
                });
            }

            // Check if brand already exists
            const existingBrand = await Brand.findOne({ 
                name: { $regex: new RegExp('^' + name + '$', 'i') } 
            });

            if (existingBrand) {
                return res.status(400).json({
                    success: false,
                    message: 'Brand with this name already exists'
                });
            }

            // Handle image upload
            let brandImage = '/public/brand_images/default-brand.jpg';
            if (req.file) {
                brandImage = `/public/brand_images/${req.file.filename}`;
            }

            const brand = new Brand({
                name,
                description,
                brandImage,
                website,
                createdBy: req.user.id
            });

            await brand.save();
            await brand.populate('createdBy', 'name email');

            res.status(201).json({
                success: true,
                message: 'Brand created successfully',
                data: brand
            });
        } catch (error) {
            console.error('Error creating brand:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create brand',
                error: error.message
            });
        }
    },

    // Get all brands
    getAllBrands: async (req, res) => {
        try {
            const { 
                page = 1, 
                limit = 10, 
                search, 
                isActive,
                sortBy = 'name',
                sortOrder = 'asc'
            } = req.query;

            // Build filter
            const filter = {};
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }
            if (isActive !== undefined) {
                filter.isActive = isActive === 'true';
            }

            // Sort
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const brands = await Brand.find(filter)
                .populate('createdBy', 'name email')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Brand.countDocuments(filter);

            // Get product counts for each brand
            const brandsWithCounts = await Promise.all(
                brands.map(async (brand) => {
                    const productCount = await Product.countDocuments({ 
                        brand: brand._id 
                    });
                    
                    return {
                        ...brand.toObject(),
                        productCount
                    };
                })
            );

            res.json({
                success: true,
                data: {
                    brands: brandsWithCounts,
                    pagination: {
                        current: parseInt(page),
                        pages: Math.ceil(total / parseInt(limit)),
                        total,
                        limit: parseInt(limit)
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching brands:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch brands',
                error: error.message
            });
        }
    },

    // Get single brand
    getBrand: async (req, res) => {
        try {
            const { id } = req.params;

            const brand = await Brand.findById(id)
                .populate('createdBy', 'name email');

            if (!brand) {
                return res.status(404).json({
                    success: false,
                    message: 'Brand not found'
                });
            }

            // Get products count
            const productCount = await Product.countDocuments({ brand: id });

            // Get recent products
            const recentProducts = await Product.find({ brand: id })
                .select('name price images status')
                .sort({ createdAt: -1 })
                .limit(5);

            res.json({
                success: true,
                data: {
                    ...brand.toObject(),
                    productCount,
                    recentProducts
                }
            });
        } catch (error) {
            console.error('Error fetching brand:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch brand',
                error: error.message
            });
        }
    },

    // Update brand
    updateBrand: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description, website, isActive } = req.body;

            const brand = await Brand.findById(id);
            if (!brand) {
                return res.status(404).json({
                    success: false,
                    message: 'Brand not found'
                });
            }

            // Check if name is being changed and if new name already exists
            if (name && name !== brand.name) {
                const existingBrand = await Brand.findOne({ 
                    name: { $regex: new RegExp('^' + name + '$', 'i') },
                    _id: { $ne: id }
                });

                if (existingBrand) {
                    return res.status(400).json({
                        success: false,
                        message: 'Brand with this name already exists'
                    });
                }
            }

            // Handle image upload
            if (req.file) {
                // Delete old image if it's not the default
                if (brand.brandImage && !brand.brandImage.includes('default-brand.jpg')) {
                    try {
                        const oldImagePath = path.join(__dirname, '..', brand.brandImage);
                        await fs.unlink(oldImagePath);
                    } catch (error) {
                        console.log('Error deleting old image:', error.message);
                    }
                }
                brand.brandImage = `/public/brand_images/${req.file.filename}`;
            }

            // Update fields
            if (name) brand.name = name;
            if (description !== undefined) brand.description = description;
            if (website !== undefined) brand.website = website;
            if (isActive !== undefined) brand.isActive = isActive === 'true';

            await brand.save();
            await brand.populate('createdBy', 'name email');

            res.json({
                success: true,
                message: 'Brand updated successfully',
                data: brand
            });
        } catch (error) {
            console.error('Error updating brand:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update brand',
                error: error.message
            });
        }
    },

    // Delete brand
    deleteBrand: async (req, res) => {
        try {
            const { id } = req.params;

            const brand = await Brand.findById(id);
            if (!brand) {
                return res.status(404).json({
                    success: false,
                    message: 'Brand not found'
                });
            }

            // Check if brand has products
            const productCount = await Product.countDocuments({ brand: id });
            if (productCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete brand. It has ${productCount} products associated with it.`
                });
            }

            // Delete brand image if it's not default
            if (brand.brandImage && !brand.brandImage.includes('default-brand.jpg')) {
                try {
                    const imagePath = path.join(__dirname, '..', brand.brandImage);
                    await fs.unlink(imagePath);
                } catch (error) {
                    console.log('Error deleting image:', error.message);
                }
            }

            await Brand.findByIdAndDelete(id);

            res.json({
                success: true,
                message: 'Brand deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting brand:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete brand',
                error: error.message
            });
        }
    },

    // Get brands for dropdown/select
    getBrandsForSelect: async (req, res) => {
        try {
            const brands = await Brand.find({ isActive: true })
                .select('name slug')
                .sort({ name: 1 });

            res.json({
                success: true,
                data: brands
            });
        } catch (error) {
            console.error('Error fetching brands for select:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch brands',
                error: error.message
            });
        }
    }
};

export default brandController;
