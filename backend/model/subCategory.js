import mongoose from 'mongoose';

const subCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    subCategoryImage: {
        type: String,
        default: '/public/subcategory_images/default-subcategory.jpg'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    slug: {
        type: String,
        lowercase: true
    }
}, {
    timestamps: true
});

// Compound index for category and name uniqueness
subCategorySchema.index({ category: 1, name: 1 }, { unique: true });

// Pre-save middleware to generate slug
subCategorySchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.slug = this.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }
    next();
});

export default mongoose.model('SubCategory', subCategorySchema);
