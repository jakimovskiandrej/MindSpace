import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listAllBadges, listMyBadges } from '../controllers/badgesController.js';

const router = Router();

router.use(requireAuth);
router.get('/', listAllBadges);
router.get('/me', listMyBadges);

export default router;
