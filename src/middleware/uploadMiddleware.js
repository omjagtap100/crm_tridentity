import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../helper/ApiError.js';

const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '5');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tenantId = req.tenantId || 'unknown';
        const uploadPath = path.join('uploads', `tenant-${tenantId}`);
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new ApiError(400, 'Only image files are allowed'), false);
    }
};

export const uploadMiddleware = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
});
