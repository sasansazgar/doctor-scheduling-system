import express from 'express';
import { body, validationResult } from 'express-validator';
import { AppError } from '../middleware/errorHandler';
import Schedule from '../models/Schedule';
import User from '../models/User';

const router = express.Router();

// Validation middleware
const validateSchedule = [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('date').isISO8601().withMessage('Invalid date format'),
  body('shiftType').isIn(['day', 'night']).withMessage('Invalid shift type'),
  body('notes').optional().isString(),
];

// Get my schedule
router.get('/my-schedule', async (req, res, next) => {
  try {
    const schedules = await Schedule.find({ userId: req.user._id })
      .populate('assignedByUser', 'firstName lastName')
      .sort({ date: 1 });

    res.json({
      status: 'success',
      data: schedules,
    });
  } catch (error) {
    next(error);
  }
});

// Get all schedules (admin only)
router.get('/all', async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }

    const schedules = await Schedule.find()
      .populate('user', 'firstName lastName')
      .populate('assignedByUser', 'firstName lastName')
      .sort({ date: 1 });

    res.json({
      status: 'success',
      data: schedules,
    });
  } catch (error) {
    next(error);
  }
});

// Assign shift (admin only)
router.post('/assign', validateSchedule, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const { userId, date, shiftType, notes } = req.body;

    // Check if user exists and is a doctor
    const user = await User.findById(userId);
    if (!user || user.role !== 'doctor') {
      throw new AppError('Invalid user or user is not a doctor', 400);
    }

    // Check for existing schedule on the same date and shift
    const existingSchedule = await Schedule.findOne({
      date,
      shiftType,
      status: { $ne: 'cancelled' },
    });

    if (existingSchedule) {
      throw new AppError('Shift already assigned for this date and time', 400);
    }

    // Create new schedule
    const schedule = await Schedule.create({
      userId,
      date,
      shiftType,
      assignedBy: req.user._id,
      notes,
    });

    await schedule.populate('user', 'firstName lastName');
    await schedule.populate('assignedByUser', 'firstName lastName');

    res.status(201).json({
      status: 'success',
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
});

// Update schedule (admin only)
router.put('/:id', async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      throw new AppError('Schedule not found', 404);
    }

    if (status) schedule.status = status;
    if (notes) schedule.notes = notes;

    await schedule.save();
    await schedule.populate('user', 'firstName lastName');
    await schedule.populate('assignedByUser', 'firstName lastName');

    res.json({
      status: 'success',
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
});

// Delete schedule (admin only)
router.delete('/:id', async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }

    const { id } = req.params;

    const schedule = await Schedule.findByIdAndDelete(id);
    if (!schedule) {
      throw new AppError('Schedule not found', 404);
    }

    res.json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
});

export default router; 