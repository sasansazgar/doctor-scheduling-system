const express = require('express');
const { body, validationResult } = require('express-validator');
const { Availability, User } = require('../models');
const { authenticateToken, isDoctor } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateAvailability = [
  body('date').isDate().withMessage('Please enter a valid date'),
  body('shiftType').isIn(['day', 'night']).withMessage('Invalid shift type'),
  body('isAvailable').isBoolean().withMessage('isAvailable must be a boolean'),
];

// Get doctor's availability for a date range
router.get('/my-availability', authenticateToken, isDoctor, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const availabilities = await Availability.findAll({
      where: {
        userId: req.user.userId,
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['date', 'ASC']],
    });

    res.json(availabilities);
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ message: 'Error fetching availability' });
  }
});

// Update doctor's availability
router.post('/update', authenticateToken, isDoctor, validateAvailability, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, shiftType, isAvailable, notes } = req.body;

    // Check if availability already exists
    const existingAvailability = await Availability.findOne({
      where: {
        userId: req.user.userId,
        date,
        shiftType,
      },
    });

    if (existingAvailability) {
      // Update existing availability
      await existingAvailability.update({
        isAvailable,
        notes,
      });
    } else {
      // Create new availability
      await Availability.create({
        userId: req.user.userId,
        date,
        shiftType,
        isAvailable,
        notes,
      });
    }

    res.json({ message: 'Availability updated successfully' });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ message: 'Error updating availability' });
  }
});

// Bulk update availability
router.post('/bulk-update', authenticateToken, isDoctor, async (req, res) => {
  try {
    const { availabilities } = req.body;

    // Validate all entries
    for (const availability of availabilities) {
      const errors = validationResult({
        body: availability,
      });
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
    }

    // Update or create each availability
    await Promise.all(
      availabilities.map(async (availability) => {
        const { date, shiftType, isAvailable, notes } = availability;

        const existingAvailability = await Availability.findOne({
          where: {
            userId: req.user.userId,
            date,
            shiftType,
          },
        });

        if (existingAvailability) {
          await existingAvailability.update({
            isAvailable,
            notes,
          });
        } else {
          await Availability.create({
            userId: req.user.userId,
            date,
            shiftType,
            isAvailable,
            notes,
          });
        }
      })
    );

    res.json({ message: 'Bulk availability update successful' });
  } catch (error) {
    console.error('Error updating bulk availability:', error);
    res.status(500).json({ message: 'Error updating bulk availability' });
  }
});

// Get all doctors' availability (admin only)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { startDate, endDate } = req.query;

    const availabilities = await Availability.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      where: {
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['date', 'ASC']],
    });

    res.json(availabilities);
  } catch (error) {
    console.error('Error fetching all availability:', error);
    res.status(500).json({ message: 'Error fetching all availability' });
  }
});

module.exports = router; 