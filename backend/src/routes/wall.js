import { Router } from 'express';
import { requireAuth, requireStaff } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabaseClient.js';
import {
    listWallPosts,
    createWallPost,
    reactToPost,
    adminEditPost,
    adminDeletePost,
    adminPinPost,
    deleteOwnPost,
} from '../controllers/wallController.js';

const router = Router();

router.use(requireAuth);

router.use(async (req, res, next) => {
    try {
        const { data } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', req.user.id)
            .single();
        req.isStaff = ['teacher', 'psychologist'].includes(data?.role);
    } catch {
        req.isStaff = false;
    }
    next();
});

router.get('/', listWallPosts);
router.post('/', createWallPost);
router.post('/:postId/react', reactToPost);
router.patch('/:postId', requireStaff, adminEditPost);
router.delete('/:postId', requireStaff, adminDeletePost);
router.post('/:postId/pin', requireStaff, adminPinPost);
router.delete('/:postId/mine', deleteOwnPost);

export default router;