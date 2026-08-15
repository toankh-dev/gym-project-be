import { body, ValidationChain } from 'express-validator';
import { validateRequest } from '@/middlewares/validation.middleware';

export const validateProgressUpdate: any[] = [
  body('heightCm')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Height must be a valid number')
    .custom((value) => {
      if (value && (value < 100 || value > 250)) {
        throw new Error('Height must be between 100-250 cm');
      }
      return true;
    }),

  body('weightKg')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Weight must be a valid number')
    .custom((value) => {
      if (value && (value < 30 || value > 300)) {
        throw new Error('Weight must be between 30-300 kg');
      }
      return true;
    }),

  body('bodyFatPercent')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Body fat percentage must be a valid number')
    .custom((value) => {
      if (value && (value < 0 || value > 50)) {
        throw new Error('Body fat percentage must be between 0-50%');
      }
      return true;
    }),

  body('muscleMassKg')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Muscle mass must be a valid number')
    .custom((value) => {
      if (value && (value < 0 || value > 100)) {
        throw new Error('Muscle mass must be between 0-100 kg');
      }
      return true;
    }),

  body('fitnessGoal')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Fitness goal must not exceed 255 characters'),

  body('trainingLevel')
    .optional()
    .isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
    .withMessage('Training level must be BEGINNER, INTERMEDIATE, or ADVANCED'),

  body('healthCondition')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Health condition must not exceed 1000 characters'),

  body('medicalNote')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Medical note must not exceed 1000 characters'),

  body('emergencyContactName')
    .optional()
    .isLength({ max: 150 })
    .withMessage('Emergency contact name must not exceed 150 characters'),

  body('emergencyContactPhone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Emergency contact phone must not exceed 20 characters'),

  validateRequest
];

export const validateWorkoutLog: any[] = [
  body('exerciseId')
    .isInt({ min: 1 })
    .withMessage('Exercise ID must be a positive integer'),

  body('workoutPlanId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Workout plan ID must be a positive integer'),

  body('workoutDate')
    .isISO8601()
    .withMessage('Workout date must be a valid date')
    .custom((value) => {
      const workoutDate = new Date(value);
      const today = new Date();
      const maxPastDate = new Date();
      maxPastDate.setDate(today.getDate() - 30); // Allow up to 30 days in the past

      if (workoutDate > today) {
        throw new Error('Workout date cannot be in the future');
      }
      if (workoutDate < maxPastDate) {
        throw new Error('Workout date cannot be more than 30 days in the past');
      }
      return true;
    }),

  body('setsCompleted')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Sets completed must be between 0-50'),

  body('repsCompleted')
    .optional()
    .isInt({ min: 0, max: 500 })
    .withMessage('Reps completed must be between 0-500'),

  body('weightUsedKg')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Weight used must be a valid number')
    .custom((value) => {
      if (value && (value < 0 || value > 500)) {
        throw new Error('Weight used must be between 0-500 kg');
      }
      return true;
    }),

  body('durationMinutes')
    .optional()
    .isInt({ min: 0, max: 300 })
    .withMessage('Duration must be between 0-300 minutes'),

  body('caloriesBurned')
    .optional()
    .isInt({ min: 0, max: 2000 })
    .withMessage('Calories burned must be between 0-2000'),

  body('difficultyRating')
    .optional()
    .isIn(['1', '2', '3', '4', '5'])
    .withMessage('Difficulty rating must be 1-5'),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),

  validateRequest
];