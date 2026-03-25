import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { technicianKycUpload } from '../middlewares/upload.middleware';
import { validateUploadedFiles } from '../middlewares/upload-validate.middleware';
import {
    TechnicianCampaignProgressSchema,
    TechnicianJobStatusSchema,
    TechnicianJobUpdateSchema,
    TechnicianKycSchema,
    TechnicianLocationSchema,
    TechnicianOnlineSchema,
} from '../dto/technician.dto';
import * as TechnicianController from '../controllers/technician.controller';
import { ROLES } from '../config/constants';

const router = Router();

router.use(authenticate);
router.use(requireRole(ROLES.TECHNICIAN));

router.get('/me', TechnicianController.getMe);
router.post('/kyc', technicianKycUpload.any(), validateUploadedFiles, validate(TechnicianKycSchema), TechnicianController.uploadKyc);
router.patch('/location', validate(TechnicianLocationSchema), TechnicianController.patchLocation);
router.patch('/online', validate(TechnicianOnlineSchema), TechnicianController.patchOnline);
router.get('/jobs/available', TechnicianController.getAvailableJobs);
router.post('/jobs/:id/accept', TechnicianController.acceptJob);
router.post('/jobs/:id/reject', TechnicianController.rejectJob);
router.patch('/jobs/:id/status', validate(TechnicianJobStatusSchema), TechnicianController.patchJobStatus);
router.get('/jobs/:bookingId/updates', TechnicianController.getJobUpdates);
router.post('/jobs/:bookingId/updates', validate(TechnicianJobUpdateSchema), TechnicianController.postJobUpdate);
router.get('/earn/referral', TechnicianController.getReferral);
router.get('/earn/summary', TechnicianController.getEarningsSummary);
router.get('/earn/campaigns', TechnicianController.getEarningCampaigns);
router.get('/earn/products', TechnicianController.getProductCommissionPreview);
router.get('/earn/progress/:campaignId', validate(TechnicianCampaignProgressSchema), TechnicianController.getCampaignProgress);

export default router;
