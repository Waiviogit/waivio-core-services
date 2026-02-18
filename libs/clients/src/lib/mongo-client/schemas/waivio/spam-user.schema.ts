import { Schema, Model, Connection, Document } from 'mongoose';

export interface SpamUserDocument extends Document {
  user: string;
  type?: string;
  isSpam?: boolean;
}

export const SpamUserSchema = new Schema<SpamUserDocument>(
  {
    user: { type: String, required: true, unique: true },
    type: { type: String, default: 'spaminator' },
    isSpam: { type: Boolean, default: true },
  },
  { timestamps: false, versionKey: false },
);

export const spamUserModel = (conn: Connection): Model<SpamUserDocument> =>
  conn.model<SpamUserDocument>('SpamUser', SpamUserSchema, 'spam_users');
