import { Schema, Model, Connection, Document } from 'mongoose';

export interface UserShopDeselectDocument extends Document {
  userName: string;
  authorPermlink: string;
}

export const UserShopDeselectSchema = new Schema<UserShopDeselectDocument>(
  {
    userName: { type: String, required: true, index: true },
    authorPermlink: { type: String, required: true },
  },
  { versionKey: false },
);

UserShopDeselectSchema.index(
  { userName: 1, authorPermlink: 1 },
  { unique: true },
);

export const userShopDeselectModel = (
  conn: Connection,
): Model<UserShopDeselectDocument> =>
  conn.model<UserShopDeselectDocument>(
    'UserShopDeselect',
    UserShopDeselectSchema,
    'user_shop_deselect',
  );
