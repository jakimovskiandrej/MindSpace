import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { analyzeSentiment } from '../controllers/sentimentController.js';

const router = Router();

router.use(requireAuth);
router.post('/analyze', analyzeSentiment);

export default router;
