"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const subscription_controller_1 = require("@/controllers/subscription.controller");
const subscription_validator_1 = require("@/validators/subscription.validator");
const router = (0, express_1.Router)();
const subscriptionController = new subscription_controller_1.SubscriptionController();
router.use(auth_middleware_1.authenticate);
// Admin/Staff routes
router.get('/', (0, auth_middleware_1.authorize)('ADMIN', 'STAFF'), subscriptionController.getSubscriptions);
router.get('/statistics', (0, auth_middleware_1.authorize)('ADMIN', 'STAFF'), subscriptionController.getSubscriptionStatistics);
router.get('/:id', (0, auth_middleware_1.authorize)('ADMIN', 'STAFF'), subscriptionController.getSubscriptionById);
router.post('/', (0, auth_middleware_1.authorize)('ADMIN', 'STAFF'), subscription_validator_1.validateSubscription, subscriptionController.createSubscription);
router.put('/:id', (0, auth_middleware_1.authorize)('ADMIN', 'STAFF'), subscription_validator_1.validateSubscriptionUpdate, subscriptionController.updateSubscription);
router.put('/:id/cancel', (0, auth_middleware_1.authorize)('ADMIN', 'STAFF'), subscriptionController.cancelSubscription);
router.post('/:id/renew', (0, auth_middleware_1.authorize)('ADMIN', 'STAFF'), subscriptionController.renewSubscription);
// Member routes
router.get('/member/:memberId', (0, auth_middleware_1.authorize)('ADMIN', 'STAFF', 'TRAINER'), subscriptionController.getMemberSubscriptions);
router.get('/my/current', (0, auth_middleware_1.authorize)('MEMBER'), subscriptionController.getCurrentMemberSubscription);
exports.default = router;
//# sourceMappingURL=subscription.routes.js.map