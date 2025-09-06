import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create directories if they don't exist
const createDirectories = () => {
    const dirs = [
        path.join(__dirname, '../public/profile_pictures'),
        path.join(__dirname, '../public/product_images'),
        path.join(__dirname, '../public/category_images'),
        path.join(__dirname, '../public/brand_images'),
        path.join(__dirname, '../public/review_images')
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

// Initialize directories
createDirectories();

// Configure storage for different upload types
const createStorage = (uploadType) => {
    return multer.diskStorage({
        destination: function (req, file, cb) {
            let uploadPath;
            
            switch (uploadType) {
                case 'profile':
                    uploadPath = path.join(__dirname, '../public/profile_pictures');
                    break;
                case 'product':
                    uploadPath = path.join(__dirname, '../public/product_images');
                    break;
                case 'category':
                    uploadPath = path.join(__dirname, '../public/category_images');
                    break;
                case 'brand':
                    uploadPath = path.join(__dirname, '../public/brand_images');
                    break;
                case 'review':
                    uploadPath = path.join(__dirname, '../public/review_images');
                    break;
                default: {
                    // Fallback to original dynamic folder logic
                    const folder = req.folderName || 'uploads';
                    uploadPath = path.join(__dirname, '../public', folder);
                    break;
                }
            }
            
            // Ensure directory exists
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }
            
            cb(null, uploadPath);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
            cb(null, uniqueSuffix);
        }
    });
};

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg', 'image/bmp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Only ${allowedTypes.join(', ')} are allowed`), false);
    }
}

// Create upload middlewares for different types
const createUpload = (uploadType) => {
    return multer({
        storage: createStorage(uploadType),
        fileFilter: fileFilter,
        limits: {
            fileSize: 5 * 1024 * 1024 // 5MB limit
        }
    });
};

// Default upload (for backward compatibility)
const defaultUpload = multer({ 
    storage: createStorage('default'), 
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Additional exports for specific upload types
export const profileUpload = createUpload('profile').single('profilePicture');
export const categoryUpload = createUpload('category').single('categoryImage');
export const brandUpload = createUpload('brand').single('brandImage');
export const productUpload = createUpload('product').array('productImages', 10);
export const reviewUpload = createUpload('review').array('reviewImages', 5);

export default defaultUpload;