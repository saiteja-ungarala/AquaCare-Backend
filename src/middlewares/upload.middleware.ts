import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { randomUUID } from 'crypto';

const createDiskUpload = (relativeFolder: string) => {
    const uploadFolder = path.resolve(__dirname, `../../uploads/${relativeFolder}`);
    fs.mkdirSync(uploadFolder, { recursive: true });

    const storage = multer.diskStorage({
        destination: (_req, _file, cb) => {
            cb(null, uploadFolder);
        },
        filename: (_req, _file, cb) => {
            cb(null, `${randomUUID()}.upload`);
        },
    });

    return multer({
        storage,
        limits: {
            // Must match MAX_FILE_SIZE_BYTES in upload-validate.middleware.ts (5 MB).
            // Keeping both aligned prevents files being written to disk only to be rejected.
            fileSize: 5 * 1024 * 1024,
            files: 10,
        },
    });
};

export const technicianKycUpload = createDiskUpload('technician-kyc');
export const kycUpload = technicianKycUpload;
export const dealerKycUpload = createDiskUpload('dealer-kyc');
export const bannerUpload = createDiskUpload('banners');
