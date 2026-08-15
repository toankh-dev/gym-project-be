import { Request, Response, NextFunction } from 'express';
import { MembershipPackage } from '@/models/Subscription.model';
import { asyncHandler } from '@/middlewares/error.middleware';

// Get all packages
export const getPackages = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const whereClause: any = {};
  if (req.path.includes('/active') || req.query.status === 'ACTIVE') {
    whereClause.status = 'ACTIVE';
  }

  const packages = await MembershipPackage.findAll({
    where: whereClause,
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
export const getPackageById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const pkg = await MembershipPackage.findByPk(id);

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
export const createPackage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { name, durationMonths, price, description, benefits, maxSessions, allowTrainer, status } = req.body;

  const newPackage = await MembershipPackage.create({
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
export const updatePackage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { name, durationMonths, price, description, benefits, maxSessions, allowTrainer, status } = req.body;

  const pkg = await MembershipPackage.findByPk(id);

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
export const deletePackage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const pkg = await MembershipPackage.findByPk(id);

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
