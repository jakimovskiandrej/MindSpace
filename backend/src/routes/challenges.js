import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  listChallenges,
  listMyChallenges,
  generateChallenge,
  completeChallenge,
} from '../controllers/challengesController.js';

const router = Router();

router.use(requireAuth);
router.get('/', listChallenges);
router.get('/me', listMyChallenges);
router.post('/generate', generateChallenge);
router.post('/complete', completeChallenge);

export default router;
