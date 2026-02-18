import { Schema, Model, Connection, Document, Types } from 'mongoose';

export interface ObjectField {
  name: string;
  body: string;
  id: string;
  tagCategory?: string;
  locale: string;
  creator: string;
  author: string;
  transactionId: string;
  weight: number;
  endDate?: number;
  startDate?: number;
}

export interface Authority {
  administrative: string[];
  ownership: string[];
}

export interface ObjectDocument extends Document {
  app: string;
  community: string;
  objectType: string;
  defaultName: string;
  creator: string;
  author: string;
  permlink: string;
  transactionId: string;
  weight: number;
  postsCount: number;
  parent: string;
  children: string[];
  authority: Authority;
  fields: ObjectField[];
  map: {
    type: string;
    coordinates: number[];
  };
  status: Record<string, unknown>;
  activeCampaigns: Types.ObjectId[];
  activeCampaignsCount: number;
  search: string[];
  metaGroupId: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuthoritySchema = new Schema(
  {
    administrative: { type: [String], default: [] },
    ownership: { type: [String], default: [] },
  },
  { _id: false },
);

const FieldsSchema = new Schema({
  name: { type: String, required: true },
  body: { type: String, required: true },
  id: { type: String },
  tagCategory: { type: String },
  locale: { type: String, default: 'en-US' },
  creator: { type: String, required: true },
  author: { type: String, required: true },
  transactionId: { type: String, required: true },
  weight: { type: Number, default: 0 },
  endDate: { type: Number },
  startDate: { type: Number },
});

export const ObjectSchema = new Schema<ObjectDocument>(
  {
    app: { type: String },
    community: { type: String },
    objectType: { type: String },
    defaultName: { type: String, required: true },
    creator: { type: String, required: true },
    author: { type: String, required: true },
    permlink: {
      type: String,
      index: true,
      unique: true,
      required: true,
    },
    weight: { type: Number, default: 1 },
    postsCount: { type: Number, default: 0 },
    parent: { type: String, default: '' },
    children: { type: [String], default: [] },
    authority: { type: AuthoritySchema, default: () => ({}) },
    fields: { type: [FieldsSchema], default: [] },
    map: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
      },
    },
    status: { type: Schema.Types.Mixed },
    activeCampaigns: { type: [Schema.Types.ObjectId], default: [] },
    activeCampaignsCount: { type: Number, default: 0 },
    search: { type: [String], default: [] },
    metaGroupId: { type: String, index: true },
    transactionId: { type: String, required: true },
  },
  { timestamps: true, strict: false, toObject: { virtuals: true } },
);

ObjectSchema.index({ map: '2dsphere' });
ObjectSchema.index({ weight: -1 });
ObjectSchema.index({ activeCampaignsCount: -1, weight: -1 });
ObjectSchema.index({ objectType: -1, weight: -1 });
ObjectSchema.index({ 'status.title': -1, 'status.link': -1 });

export const objectModel = (conn: Connection): Model<ObjectDocument> =>
  conn.model<ObjectDocument>('object', ObjectSchema, 'objects');
