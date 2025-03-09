import express from 'express';
import { body, validationResult } from 'express-validator';
import { AppError } from '../middleware/errorHandler';
import Availability from '../models/Availability';
import { Request, Response, NextFunction } from 'express';

const router = express.Router();

// Validation middleware
const validateAvailability = [
  body('date').isISO8601().withMessage('Invalid date format'),
  body('shiftType').isIn(['day', 'night']).withMessage('Invalid shift type'),
  body('isAvailable').isBoolean().withMessage('isAvailable must be a boolean'),
  body('notes').optional().isString(),
];

// Get my availability
router.get('/my-availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const availabilities = await Availability.find({ userId: req.user._id })
      .sort({ date: 1 });

    res.json({
      status: 'success',
      data: availabilities,
    });
  } catch (error) {
    next(error);
  }
});

// Get all availability (admin only)
router.get('/all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }

    const availabilities = await Availability.find()
      .populate('user', 'firstName lastName')
      .sort({ date: 1 });

    res.json({
      status: 'success',
      data: availabilities,
    });
  } catch (error) {
    next(error);
  }
});

// Update availability
router.post('/update', validateAvailability, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const { date, shiftType, isAvailable, notes } = req.body;

    // Check for existing availability
    let availability = await Availability.findOne({
      userId: req.user._id,
      date,
      shiftType,
    });

    if (availability) {
      // Update existing availability
      availability.isAvailable = isAvailable;
      availability.notes = notes;
      await availability.save();
    } else {
      // Create new availability
      availability = await Availability.create({
        userId: req.user._id,
        date,
        shiftType,
        isAvailable,
        notes,
      });
    }

    await availability.populate('user', 'firstName lastName');

    res.json({
      status: 'success',
      data: availability,
    });
  } catch (error) {
    next(error);
  }
});

// Bulk update availability
router.post('/bulk-update', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { availabilities } = req.body;

    if (!Array.isArray(availabilities)) {
      throw new AppError('Availabilities must be an array', 400);
    }

    const results = await Promise.all(
      availabilities.map(async (availability) => {
        const { date, shiftType, isAvailable, notes } = availability;

        const existingAvailability = await Availability.findOne({
          userId: req.user._id,
          date,
          shiftType,
        });

        if (existingAvailability) {
          existingAvailability.isAvailable = isAvailable;
          existingAvailability.notes = notes;
          await existingAvailability.save();
          return existingAvailability;
        }

        return await Availability.create({
          userId: req.user._id,
          date,
          shiftType,
          isAvailable,
          notes,
        });
      })
    );

    await Promise.all(
      results.map((availability) =>
        availability.populate('user', 'firstName lastName')
      )
    );

    res.json({
      status: 'success',
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

export default router; 