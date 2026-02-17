import fs from 'fs';
import path from 'path';
import multer from 'multer';

const sanitizeBaseName = (name: string): string => {
    return name
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 60) || 'document';
};

const createDiskUpload = (relativeFolder: string) => {
    const uploadFolder = path.resolve(__dirname, `../../uploads/${relativeFolder}`);
    fs.mkdirSync(uploadFolder, { recursive: true });

    const storage = multer.diskStorage({
        destination: (_req, _file, cb) => {
            cb(null, uploadFolder);
        },
        filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname || '').replace(/[^a-zA-Z0-9.]/g, '') || '.bin';
            const base = sanitizeBaseName(path.basename(file.originalname || 'document', path.extname(file.originalname || '')));
            const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            cb(null, `${unique}-${base}${ext}`);
        },
    });

    return multer({
        storage,
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB per file
            files: 10,
        },
    });
};

export const kycUpload = createDiskUpload('agent-kyc');
export const dealerKycUpload = createDiskUpload('dealer-kyc');
