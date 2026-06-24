import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
    createGroup,
    joinGroup,
    getMyGroups,
    deleteOrLeaveGroup,
    getGroupLeaderboard,
} from '../controllers/groupsController.js';

const router = Router();

router.use(requireAuth);
router.post('/', createGroup);
router.post('/join', joinGroup);
router.get('/me', getMyGroups);
router.delete('/:id', deleteOrLeaveGroup);
router.get('/:id/leaderboard', getGroupLeaderboard);

export default router;