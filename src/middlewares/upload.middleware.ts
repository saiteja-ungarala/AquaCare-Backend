import fs from 'fs';
import path from 'path';
import multer from 'multer';

const uploadsRoot = path.resolve(__dirname, '../../uploads/agent-kyc');
fs.mkdirSync(uploadsRoot, { recursive: true });

const sanitizeBaseName = (name: string): string => {
    return name
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 60) || 'document';
};

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsRoot);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname || '').replace(/[^a-zA-Z0-9.]/g, '') || '.bin';
        const base = sanitizeBaseName(path.basename(file.originalname || 'document', path.extname(file.originalname || '')));
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}-${base}${ext}`);
    },
});

export const kycUpload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 10,
    },
});

