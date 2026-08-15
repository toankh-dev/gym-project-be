"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePackage = exports.updatePackage = exports.createPackage = exports.getPackageById = exports.getPackages = void 0;
const Subscription_model_1 = require("@/models/Subscription.model");
const error_middleware_1 = require("@/middlewares/error.middleware");
// Get all packages
exports.getPackages = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const packages = await Subscription_model_1.MembershipPackage.findAll({
        // allow all packages to be visible to admin, if not admin maybe filter ACTIVE
        order: [['price', 'ASC']]
    });
    res.status(200).json({
        success: true,
        data: {
            packages
        }
    });
});
// Get package by ID
exports.getPackageById = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const pkg = await Subscription_model_1.MembershipPackage.findByPk(id);
    if (!pkg) {
        res.status(404).json({
            success: false,
            message: 'Package not found'
        });
        return;
    }
    res.status(200).json({
        success: true,
        data: {
            package: pkg
        }
    });
});
// Create new package
exports.createPackage = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { name, durationMonths, price, description, benefits, maxSessions, allowTrainer, status } = req.body;
    const newPackage = await Subscription_model_1.MembershipPackage.create({
        name,
        durationMonths,
        price,
        description,
        benefits,
        maxSessions: maxSessions === '' ? null : maxSessions,
        allowTrainer,
        status: status || 'ACTIVE'
    });
    res.status(201).json({
        success: true,
        message: 'Package created successfully',
        data: {
            package: newPackage
        }
    });
});
// Update package
exports.updatePackage = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const { name, durationMonths, price, description, benefits, maxSessions, allowTrainer, status } = req.body;
    const pkg = await Subscription_model_1.MembershipPackage.findByPk(id);
    if (!pkg) {
        res.status(404).json({
            success: false,
            message: 'Package not found'
        });
        return;
    }
    await pkg.update({
        name,
        durationMonths,
        price,
        description,
        benefits,
        maxSessions: maxSessions === '' ? null : maxSessions,
        allowTrainer,
        status
    });
    res.status(200).json({
        success: true,
        message: 'Package updated successfully',
        data: {
            package: pkg
        }
    });
});
// Delete package
exports.deletePackage = (0, error_middleware_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const pkg = await Subscription_model_1.MembershipPackage.findByPk(id);
    if (!pkg) {
        res.status(404).json({
            success: false,
            message: 'Package not found'
        });
        return;
    }
    await pkg.destroy();
    res.status(200).json({
        success: true,
        message: 'Package deleted successfully'
    });
});
//# sourceMappingURL=package.controller.js.map