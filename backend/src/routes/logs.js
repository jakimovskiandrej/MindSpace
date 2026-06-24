import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { upsertDailyLog, getMyLogs, getTodayLog, getStreak } from '../controllers/logsController.js';

const router = Router();

router.use(requireAuth);
router.post('/', upsertDailyLog);
router.get('/me', getMyLogs);
router.get('/today', getTodayLog);
router.get('/streak', getStreak);

export default router;
