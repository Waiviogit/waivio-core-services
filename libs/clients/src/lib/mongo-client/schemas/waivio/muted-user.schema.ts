import { Schema, Model, Connection, Document } from 'mongoose';

export interface MutedUserDocument extends Document {
  userName: string;
  mutedBy: string;
  mutedForApps: string[];
}

export const MutedUserSchema = new Schema<MutedUserDocument>(
  {
    userName: { type: String, required: true },
    mutedBy: { type: String, required: true },
    mutedForApps: {
      type: [String],
      required: true,
      index: true,
    },
  },
  { versionKey: false },
);

MutedUserSchema.index({ userName: 1, mutedBy: 1 }, { unique: true });

export const mutedUserModel = (conn: Connection): Model<MutedUserDocument> =>
  conn.model<MutedUserDocument>('MutedUser', MutedUserSchema, 'muted_user');
