import { Schema, Document, Model, Connection } from 'mongoose';

export interface WobjectPendingUpdateDocument extends Document {
  name: string;
  body: string;
  locale: string;
  creator: string;
  author: string;
  transactionId: string;
  id: string;
  authorPermlink: string;
  partNumber: number;
  totalParts: number;
  createdAt: Date;
  updatedAt: Date;
}

const WobjectPendingUpdateSchema = new Schema<WobjectPendingUpdateDocument>(
  {
    name: { type: String },
    body: { type: String },
    locale: { type: String, default: 'en-US' },
    creator: { type: String },
    author: { type: String },
    transactionId: { type: String, required: true },
    id: { type: String },
    authorPermlink: { type: String },
    partNumber: { type: Number },
    totalParts: { type: Number },
  },
  { timestamps: true, versionKey: false },
);

WobjectPendingUpdateSchema.index(
  { id: 1, authorPermlink: 1, partNumber: 1 },
  { unique: true },
);

WobjectPendingUpdateSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 },
);

export const wobjectPendingUpdateModel = (
  conn: Connection,
): Model<WobjectPendingUpdateDocument> =>
  conn.model<WobjectPendingUpdateDocument>(
    'wobject_pending_updates',
    WobjectPendingUpdateSchema,
    'wobject_pending_updates',
  );
