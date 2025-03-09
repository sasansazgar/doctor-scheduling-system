import express from 'express';
import { AppError } from '../middleware/errorHandler';
import User from '../models/User';

const router = express.Router();

// Get all doctors (admin only)
router.get('/doctors', async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }

    const doctors = await User.find({ role: 'doctor' }).select('-password');

    res.json({
      status: 'success',
      data: doctors,
    });
  } catch (error) {
    next(error);
  }
});

// Get user profile
router.get('/profile', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    res.json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', async (req, res, next) => {
  try {
    const { firstName, lastName, preferredDays } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (preferredDays !== undefined) user.preferredDays = preferredDays;

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      status: 'success',
      data: userResponse,
    });
  } catch (error) {
    next(error);
  }
});

// Update user status (admin only)
router.put('/:id/status', async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }

    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.isActive = isActive;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      status: 'success',
      data: userResponse,
    });
  } catch (error) {
    next(error);
  }
});

export default router; 