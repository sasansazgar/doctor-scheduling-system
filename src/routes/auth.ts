import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator/check';
import { AppError } from '../middleware/errorHandler';
import User from '../models/User';
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Validation middleware
const validateRegistration = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('role').isIn(['doctor', 'admin']).withMessage('Invalid role'),
  body('preferredDays')
    .optional()
    .isInt({ min: 0, max: 7 })
    .withMessage('Preferred days must be between 0 and 7'),
];

const validateLogin = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Register route
router.post('/register', validateRegistration, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const { email, password, firstName, lastName, role, preferredDays } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Create new user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      preferredDays,
    });

    await user.save();

    // Generate JWT token
    const payload = {
      user: {
        id: user._id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' },
      (err: Error | null, token: string | undefined) => {
        if (err) throw err;
        const userResponse = user.toObject();
        const { password: _, ...userWithoutPassword } = userResponse;
        res.status(201).json({
          status: 'success',
          data: {
            user: userWithoutPassword,
            token,
          },
        });
      }
    );
  } catch (error) {
    next(error);
  }
});

// Login route
router.post('/login', validateLogin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate JWT token
    const payload = {
      user: {
        id: user._id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' },
      (err: Error | null, token: string | undefined) => {
        if (err) throw err;
        const userResponse = user.toObject();
        const { password: _, ...userWithoutPassword } = userResponse;
        res.json({
          status: 'success',
          data: {
            user: userWithoutPassword,
            token,
          },
        });
      }
    );
  } catch (error) {
    next(error);
  }
});

export default router; 