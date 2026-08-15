import { Router } from 'express';
import { authenticate } from '@/middlewares/auth.middleware';
import { asyncHandler } from '@/middlewares/error.middleware';

const router = Router();

router.use(authenticate);

const uploadFile = asyncHandler(async (req: any, res: any): Promise<void> => {
  res.json({
    success: true,
    message: 'File upload endpoint - not implemented yet',
    data: { url: '/uploads/placeholder.jpg' }
  });
});

router.post('/', uploadFile);

export default router;