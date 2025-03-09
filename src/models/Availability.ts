import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface IAvailability extends Document {
  userId: IUser['_id'];
  date: Date;
  shiftType: 'day' | 'night';
  isAvailable: boolean;
  notes?: string;
  user: IUser;
}

const availabilitySchema = new Schema<IAvailability>(
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
    isAvailable: {
      type: Boolean,
      default: true,
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
availabilitySchema.index({ userId: 1, date: 1 });
availabilitySchema.index({ date: 1, shiftType: 1 });

const Availability = mongoose.model<IAvailability>('Availability', availabilitySchema);

export default Availability; 