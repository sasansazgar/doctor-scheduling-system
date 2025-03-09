const express = require('express');
const { body, validationResult } = require('express-validator');
const { Schedule, User, Availability } = require('../models');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateSchedule = [
  body('userId').isUUID().withMessage('Invalid user ID'),
  body('date').isDate().withMessage('Please enter a valid date'),
  body('shiftType').isIn(['day', 'night']).withMessage('Invalid shift type'),
];

// Get doctor's schedule
router.get('/my-schedule', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const schedules = await Schedule.findAll({
      where: {
        userId: req.user.userId,
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['date', 'ASC']],
    });

    res.json(schedules);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ message: 'Error fetching schedule' });
  }
});

// Assign shift (admin only)
router.post('/assign', authenticateToken, isAdmin, validateSchedule, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, date, shiftType, notes } = req.body;

    // Check if shift is already assigned
    const existingSchedule = await Schedule.findOne({
      where: {
        date,
        shiftType,
      },
    });

    if (existingSchedule) {
      return res.status(400).json({ message: 'Shift already assigned' });
    }

    // Check if doctor is available
    const availability = await Availability.findOne({
      where: {
        userId,
        date,
        shiftType,
        isAvailable: true,
      },
    });

    if (!availability) {
      return res.status(400).json({ message: 'Doctor is not available for this shift' });
    }

    // Create schedule
    const schedule = await Schedule.create({
      userId,
      date,
      shiftType,
      assignedBy: req.user.userId,
      notes,
    });

    res.status(201).json(schedule);
  } catch (error) {
    console.error('Error assigning shift:', error);
    res.status(500).json({ message: 'Error assigning shift' });
  }
});

// Update shift assignment (admin only)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, date, shiftType, status, notes } = req.body;

    const schedule = await Schedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // If changing doctor, check availability
    if (userId && userId !== schedule.userId) {
      const availability = await Availability.findOne({
        where: {
          userId,
          date: schedule.date,
          shiftType: schedule.shiftType,
          isAvailable: true,
        },
      });

      if (!availability) {
        return res.status(400).json({ message: 'Doctor is not available for this shift' });
      }
    }

    // Update schedule
    await schedule.update({
      userId: userId || schedule.userId,
      date: date || schedule.date,
      shiftType: shiftType || schedule.shiftType,
      status: status || schedule.status,
      notes: notes || schedule.notes,
    });

    res.json(schedule);
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ message: 'Error updating schedule' });
  }
});

// Delete shift assignment (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    await schedule.destroy();
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ message: 'Error deleting schedule' });
  }
});

// Get all schedules (admin only)
router.get('/all', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const schedules = await Schedule.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: User,
          as: 'assignedByUser',
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

    res.json(schedules);
  } catch (error) {
    console.error('Error fetching all schedules:', error);
    res.status(500).json({ message: 'Error fetching all schedules' });
  }
});

module.exports = router; 