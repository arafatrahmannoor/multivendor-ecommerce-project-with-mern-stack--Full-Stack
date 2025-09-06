import Category from '../model/category.js';
import SubCategory from '../model/subCategory.js';
import Product from '../model/product.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const categoryController = {
    // Create new category
    createCategory: async (req, res) => {
        try {
            const { name, description, serviceCharge } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Category name is required'
                });
            }

            // Check if category already exists
            const existingCategory = await Category.findOne({ 
                name: { $regex: new RegExp('^' + name + '$', 'i') } 
            });

            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'Category with this name already exists'
                });
            }

            // Handle image upload
            let categoryImage = '/public/category_images/default-category.jpg';
            if (req.file) {
                categoryImage = `/public/category_images/${req.file.filename}`;
            }

            const category = new Category({
                name,
                description,
                categoryImage,
                serviceCharge: serviceCharge ? parseFloat(serviceCharge) : 0,
                createdBy: req.user.id
            });

            await category.save();
            await category.populate('createdBy', 'name email');

            res.status(201).json({
                success: true,
                message: 'Category created successfully',
                data: category
            });
        } catch (error) {
            console.error('Error creating category:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create category',
                error: error.message
            });
        }
    },

    // Get all categories
    getAllCategories: async (req, res) => {
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

            const categories = await Category.find(filter)
                .populate('createdBy', 'name email')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Category.countDocuments(filter);

            // Get subcategories count for each category
            const categoriesWithCounts = await Promise.all(
                categories.map(async (category) => {
                    const subcategoryCount = await SubCategory.countDocuments({ 
                        category: category._id 
                    });
                    const productCount = await Product.countDocuments({ 
                        category: category._id 
                    });
                    
                    return {
                        ...category.toObject(),
                        subcategoryCount,
                        productCount
                    };
                })
            );

            res.json({
                success: true,
                data: {
                    categories: categoriesWithCounts,
                    pagination: {
                        current: parseInt(page),
                        pages: Math.ceil(total / parseInt(limit)),
                        total,
                        limit: parseInt(limit)
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch categories',
                error: error.message
            });
        }
    },

    // Get single category
    getCategory: async (req, res) => {
        try {
            const { id } = req.params;

            const category = await Category.findById(id)
                .populate('createdBy', 'name email');

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            // Get subcategories
            const subcategories = await SubCategory.find({ category: id, isActive: true })
                .select('name description slug');

            // Get products count
            const productCount = await Product.countDocuments({ category: id });

            res.json({
                success: true,
                data: {
                    ...category.toObject(),
                    subcategories,
                    productCount
                }
            });
        } catch (error) {
            console.error('Error fetching category:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch category',
                error: error.message
            });
        }
    },

    // Update category
    updateCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description, serviceCharge, isActive } = req.body;

            const category = await Category.findById(id);
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            // Check if name is being changed and if new name already exists
            if (name && name !== category.name) {
                const existingCategory = await Category.findOne({ 
                    name: { $regex: new RegExp('^' + name + '$', 'i') },
                    _id: { $ne: id }
                });

                if (existingCategory) {
                    return res.status(400).json({
                        success: false,
                        message: 'Category with this name already exists'
                    });
                }
            }

            // Handle image upload
            if (req.file) {
                // Delete old image if it's not the default
                if (category.categoryImage && !category.categoryImage.includes('default-category.jpg')) {
                    try {
                        const oldImagePath = path.join(__dirname, '..', category.categoryImage);
                        await fs.unlink(oldImagePath);
                    } catch (error) {
                        console.log('Error deleting old image:', error.message);
                    }
                }
                category.categoryImage = `/public/category_images/${req.file.filename}`;
            }

            // Update fields
            if (name) category.name = name;
            if (description !== undefined) category.description = description;
            if (serviceCharge !== undefined) category.serviceCharge = parseFloat(serviceCharge);
            if (isActive !== undefined) category.isActive = isActive === 'true';

            await category.save();
            await category.populate('createdBy', 'name email');

            res.json({
                success: true,
                message: 'Category updated successfully',
                data: category
            });
        } catch (error) {
            console.error('Error updating category:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update category',
                error: error.message
            });
        }
    },

    // Delete category
    deleteCategory: async (req, res) => {
        try {
            const { id } = req.params;

            const category = await Category.findById(id);
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            // Check if category has products
            const productCount = await Product.countDocuments({ category: id });
            if (productCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete category. It has ${productCount} products associated with it.`
                });
            }

            // Delete subcategories
            await SubCategory.deleteMany({ category: id });

            // Delete category image if it's not default
            if (category.categoryImage && !category.categoryImage.includes('default-category.jpg')) {
                try {
                    const imagePath = path.join(__dirname, '..', category.categoryImage);
                    await fs.unlink(imagePath);
                } catch (error) {
                    console.log('Error deleting image:', error.message);
                }
            }

            await Category.findByIdAndDelete(id);

            res.json({
                success: true,
                message: 'Category deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting category:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete category',
                error: error.message
            });
        }
    },

    // Create subcategory
    createSubCategory: async (req, res) => {
        try {
            const { name, description, category } = req.body;

            if (!name || !category) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and category are required'
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

            // Check if subcategory already exists in this category
            const existingSubCategory = await SubCategory.findOne({
                name: { $regex: new RegExp('^' + name + '$', 'i') },
                category
            });

            if (existingSubCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'Subcategory with this name already exists in this category'
                });
            }

            // Handle image upload
            let subCategoryImage = '/public/subcategory_images/default-subcategory.jpg';
            if (req.file) {
                subCategoryImage = `/public/subcategory_images/${req.file.filename}`;
            }

            const subCategory = new SubCategory({
                name,
                description,
                category,
                subCategoryImage,
                createdBy: req.user.id
            });

            await subCategory.save();
            await subCategory.populate([
                { path: 'category', select: 'name' },
                { path: 'createdBy', select: 'name email' }
            ]);

            res.status(201).json({
                success: true,
                message: 'Subcategory created successfully',
                data: subCategory
            });
        } catch (error) {
            console.error('Error creating subcategory:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create subcategory',
                error: error.message
            });
        }
    },

    // Get subcategories by category
    getSubCategories: async (req, res) => {
        try {
            const { categoryId } = req.params;
            const { 
                page = 1, 
                limit = 10, 
                search, 
                isActive,
                sortBy = 'name',
                sortOrder = 'asc'
            } = req.query;

            // Build filter
            const filter = { category: categoryId };
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

            const subcategories = await SubCategory.find(filter)
                .populate('category', 'name')
                .populate('createdBy', 'name email')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit));

            const total = await SubCategory.countDocuments(filter);

            // Get product counts for each subcategory
            const subcategoriesWithCounts = await Promise.all(
                subcategories.map(async (subcategory) => {
                    const productCount = await Product.countDocuments({ 
                        subCategory: subcategory._id 
                    });
                    
                    return {
                        ...subcategory.toObject(),
                        productCount
                    };
                })
            );

            res.json({
                success: true,
                data: {
                    subcategories: subcategoriesWithCounts,
                    pagination: {
                        current: parseInt(page),
                        pages: Math.ceil(total / parseInt(limit)),
                        total,
                        limit: parseInt(limit)
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching subcategories:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch subcategories',
                error: error.message
            });
        }
    },

    // Update subcategory
    updateSubCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description, category, isActive } = req.body;

            const subCategory = await SubCategory.findById(id);
            if (!subCategory) {
                return res.status(404).json({
                    success: false,
                    message: 'Subcategory not found'
                });
            }

            // Check if name is being changed and if new name already exists in the same category
            if (name && name !== subCategory.name) {
                const targetCategory = category || subCategory.category;
                const existingSubCategory = await SubCategory.findOne({
                    name: { $regex: new RegExp('^' + name + '$', 'i') },
                    category: targetCategory,
                    _id: { $ne: id }
                });

                if (existingSubCategory) {
                    return res.status(400).json({
                        success: false,
                        message: 'Subcategory with this name already exists in this category'
                    });
                }
            }

            // Verify new category if provided
            if (category && category !== subCategory.category.toString()) {
                const categoryExists = await Category.findById(category);
                if (!categoryExists) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid category'
                    });
                }
            }

            // Handle image upload
            if (req.file) {
                // Delete old image if it's not the default
                if (subCategory.subCategoryImage && !subCategory.subCategoryImage.includes('default-subcategory.jpg')) {
                    try {
                        const oldImagePath = path.join(__dirname, '..', subCategory.subCategoryImage);
                        await fs.unlink(oldImagePath);
                    } catch (error) {
                        console.log('Error deleting old image:', error.message);
                    }
                }
                subCategory.subCategoryImage = `/public/subcategory_images/${req.file.filename}`;
            }

            // Update fields
            if (name) subCategory.name = name;
            if (description !== undefined) subCategory.description = description;
            if (category) subCategory.category = category;
            if (isActive !== undefined) subCategory.isActive = isActive === 'true';

            await subCategory.save();
            await subCategory.populate([
                { path: 'category', select: 'name' },
                { path: 'createdBy', select: 'name email' }
            ]);

            res.json({
                success: true,
                message: 'Subcategory updated successfully',
                data: subCategory
            });
        } catch (error) {
            console.error('Error updating subcategory:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update subcategory',
                error: error.message
            });
        }
    },

    // Delete subcategory
    deleteSubCategory: async (req, res) => {
        try {
            const { id } = req.params;

            const subCategory = await SubCategory.findById(id);
            if (!subCategory) {
                return res.status(404).json({
                    success: false,
                    message: 'Subcategory not found'
                });
            }

            // Check if subcategory has products
            const productCount = await Product.countDocuments({ subCategory: id });
            if (productCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete subcategory. It has ${productCount} products associated with it.`
                });
            }

            // Delete subcategory image if it's not default
            if (subCategory.subCategoryImage && !subCategory.subCategoryImage.includes('default-subcategory.jpg')) {
                try {
                    const imagePath = path.join(__dirname, '..', subCategory.subCategoryImage);
                    await fs.unlink(imagePath);
                } catch (error) {
                    console.log('Error deleting image:', error.message);
                }
            }

            await SubCategory.findByIdAndDelete(id);

            res.json({
                success: true,
                message: 'Subcategory deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting subcategory:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete subcategory',
                error: error.message
            });
        }
    }
};

export default categoryController;
