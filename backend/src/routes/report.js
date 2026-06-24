import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { generateWeeklyReport } from '../controllers/reportController.js';

const router = Router();

router.use(requireAuth);
router.get('/weekly', generateWeeklyReport);

export default router;
