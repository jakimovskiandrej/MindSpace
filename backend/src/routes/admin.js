import { Router } from 'express';
import { requireAuth, requireStaff } from '../middleware/auth.js';
import { getClassStats, listClasses, getOverview } from '../controllers/adminController.js';

const router = Router();

router.use(requireAuth, requireStaff);
router.get('/stats', getClassStats);
router.get('/classes', listClasses);
router.get('/overview', getOverview);

export default router;
