"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const error_middleware_1 = require("@/middlewares/error.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
const uploadFile = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    res.json({
        success: true,
        message: 'File upload endpoint - not implemented yet',
        data: { url: '/uploads/placeholder.jpg' }
    });
});
router.post('/', uploadFile);
exports.default = router;
//# sourceMappingURL=upload.routes.js.map