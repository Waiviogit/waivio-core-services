import { Schema, Model, Connection, Document } from 'mongoose';

export interface FieldVoteDocument extends Document {
  objectPermlink: string;
  fieldTransactionId: string;
  voter: string;
  weight: number;
  timestamp: string;
}

export const FieldVoteSchema = new Schema<FieldVoteDocument>({
  objectPermlink: { type: String, required: true, index: true },
  fieldTransactionId: { type: String, required: true },
  voter: { type: String, required: true, index: true },
  weight: { type: Number, required: true },
  timestamp: { type: String, required: true },
});

FieldVoteSchema.index(
  { objectPermlink: 1, fieldTransactionId: 1, voter: 1 },
  { unique: true },
);

export const fieldVoteModel = (conn: Connection): Model<FieldVoteDocument> =>
  conn.model<FieldVoteDocument>('FieldVote', FieldVoteSchema, 'field-votes');
