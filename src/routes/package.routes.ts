import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, authorize, optionalAuthenticate } from '@/middlewares/auth.middleware';
import { validateRequest } from '@/middlewares/validation.middleware';
import { asyncHandler } from '@/middlewares/error.middleware';

const router = Router();

import {
  getPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage
} from '@/controllers/package.controller';

// Public route for getting active packages
router.get('/active', optionalAuthenticate, getPackages);

// Protected routes
router.use(authenticate);

router.get('/', authorize('ADMIN', 'STAFF'), getPackages);
router.get('/:id', param('id').isInt({ min: 1 }), validateRequest, getPackageById);
router.post('/', authorize('ADMIN'), createPackage);
router.put('/:id', authorize('ADMIN'), param('id').isInt({ min: 1 }), validateRequest, updatePackage);
router.delete('/:id', authorize('ADMIN'), param('id').isInt({ min: 1 }), validateRequest, deletePackage);

export default router;