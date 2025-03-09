import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface ISchedule extends Document {
  userId: IUser['_id'];
  date: Date;
  shiftType: 'day' | 'night';
  status: 'pending' | 'confirmed' | 'cancelled';
  assignedBy: IUser['_id'];
  notes?: string;
  user: IUser;
  assignedByUser: IUser;
}

const scheduleSchema = new Schema<ISchedule>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    shiftType: {
      type: String,
      enum: ['day', 'night'],
      required: [true, 'Shift type is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned by user ID is required'],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
scheduleSchema.index({ userId: 1, date: 1 });
scheduleSchema.index({ date: 1, shiftType: 1 });

const Schedule = mongoose.model<ISchedule>('Schedule', scheduleSchema);

export default Schedule; 