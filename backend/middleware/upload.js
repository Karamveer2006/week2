const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Storage for Excel/CSV (local)
const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const localUpload = multer({
    storage: diskStorage,
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype === 'application/vnd.ms-excel' || 
            file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'text/csv'
        ) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel and CSV files are allowed for local upload!'), false);
        }
    }
});

// Storage for PDFs (Cloudinary)
const cloudinaryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'smart_campus_assignments',
        resource_type: 'auto',
        public_id: (req, file) => `${Date.now()}-${file.originalname}`,
    },
});

const cloudUpload = multer({ 
    storage: cloudinaryStorage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDFs, Word Documents, and Presentations are allowed!'), false);
        }
    }
});

module.exports = {
    localUpload,
    cloudUpload
};
