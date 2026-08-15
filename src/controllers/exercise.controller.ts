import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Exercise } from '@/models/Exercise.model';
import { asyncHandler } from '@/middlewares/error.middleware';

export const getExercises = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { search, category, muscleGroup, limit = 100 } = req.query;

  const where: any = {};
  if (search) where.name = { [Op.like]: `%${search}%` };
  if (category) where.category = category;
  if (muscleGroup) where.muscleGroup = muscleGroup;

  const exercises = await Exercise.findAll({
    where,
    limit: Math.min(500, parseInt(String(limit), 10)),
    order: [['name', 'ASC']],
  });

  res.json({ success: true, data: { exercises } });
});
