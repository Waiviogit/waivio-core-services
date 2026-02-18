import { Schema, Model, Connection, Document } from 'mongoose';

export interface WaivStakeDocument extends Document {
  account: string;
  stake: number;
}

export const WaivStakeSchema = new Schema<WaivStakeDocument>({
  account: { type: String, required: true, unique: true, index: true },
  stake: { type: Number, required: true, default: 0 },
});

export const waivStakeModel = (conn: Connection): Model<WaivStakeDocument> =>
  conn.model<WaivStakeDocument>('WaivStake', WaivStakeSchema, 'waiv-stakes');
