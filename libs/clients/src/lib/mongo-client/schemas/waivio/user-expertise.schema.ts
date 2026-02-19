import { Schema, Model, Connection, Document } from 'mongoose';

export interface UserExpertiseDocument extends Document {
  user_name: string;
  author_permlink: string;
  weight: number;
}

export const UserExpertiseSchema = new Schema<UserExpertiseDocument>(
  {
    user_name: { type: String, required: true },
    author_permlink: { type: String, required: true },
    weight: { type: Number, default: 0 },
  },
  { timestamps: false, versionKey: false },
);

UserExpertiseSchema.index({ user_name: 1 });
UserExpertiseSchema.index(
  { author_permlink: 1, user_name: 1 },
  { unique: true },
);
UserExpertiseSchema.index({ weight: -1 });
UserExpertiseSchema.index({ author_permlink: 1, _id: 1 });

export const userExpertiseModel = (
  conn: Connection,
): Model<UserExpertiseDocument> =>
  conn.model<UserExpertiseDocument>(
    'user_expertise',
    UserExpertiseSchema,
    'user_expertises',
  );
