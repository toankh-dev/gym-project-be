"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const validation_middleware_1 = require("@/middlewares/validation.middleware");
const router = (0, express_1.Router)();
const package_controller_1 = require("@/controllers/package.controller");
// Public route for getting active packages
router.get('/active', auth_middleware_1.optionalAuthenticate, package_controller_1.getPackages);
// Protected routes
router.use(auth_middleware_1.authenticate);
router.get('/', (0, auth_middleware_1.authorize)('ADMIN', 'STAFF'), package_controller_1.getPackages);
router.get('/:id', (0, express_validator_1.param)('id').isInt({ min: 1 }), validation_middleware_1.validateRequest, package_controller_1.getPackageById);
router.post('/', (0, auth_middleware_1.authorize)('ADMIN'), package_controller_1.createPackage);
router.put('/:id', (0, auth_middleware_1.authorize)('ADMIN'), (0, express_validator_1.param)('id').isInt({ min: 1 }), validation_middleware_1.validateRequest, package_controller_1.updatePackage);
router.delete('/:id', (0, auth_middleware_1.authorize)('ADMIN'), (0, express_validator_1.param)('id').isInt({ min: 1 }), validation_middleware_1.validateRequest, package_controller_1.deletePackage);
exports.default = router;
//# sourceMappingURL=package.routes.js.map