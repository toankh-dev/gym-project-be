import { Router } from 'express';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { SubscriptionController } from '@/controllers/subscription.controller';
import { validateSubscription, validateSubscriptionUpdate } from '@/validators/subscription.validator';

const router = Router();
const subscriptionController = new SubscriptionController();

router.use(authenticate);

// Admin/Staff routes
router.get('/', authorize('ADMIN', 'STAFF'), subscriptionController.getSubscriptions);
router.get('/statistics', authorize('ADMIN', 'STAFF'), subscriptionController.getSubscriptionStatistics);
router.get('/:id', authorize('ADMIN', 'STAFF'), subscriptionController.getSubscriptionById);
router.post('/', authorize('ADMIN', 'STAFF'), validateSubscription, subscriptionController.createSubscription);
router.put('/:id', authorize('ADMIN', 'STAFF'), validateSubscriptionUpdate, subscriptionController.updateSubscription);
router.put('/:id/cancel', authorize('ADMIN', 'STAFF'), subscriptionController.cancelSubscription);
router.post('/:id/renew', authorize('ADMIN', 'STAFF'), subscriptionController.renewSubscription);

// Member routes
router.get('/member/:memberId', authorize('ADMIN', 'STAFF', 'TRAINER'), subscriptionController.getMemberSubscriptions);
router.get('/my/current', authorize('MEMBER'), subscriptionController.getCurrentMemberSubscription);
router.post('/:id/pay', authorize('ADMIN', 'STAFF', 'MEMBER'), subscriptionController.paySubscription);

export default router;