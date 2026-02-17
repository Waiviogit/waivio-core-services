import { Schema, Model, Connection, Document } from 'mongoose';

export interface AppDocument extends Document {
  name: string;
  host: string;
  owner: string;
  parent: string;
  googleAnalyticsTag: string;
  beneficiary: {
    account: string;
    percent: number;
  };
  configuration: {
    configFlags: Record<string, boolean>;
  };
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export const AppSchema = new Schema<AppDocument>(
  {
    name: { type: String, required: true, unique: true, index: true },
    host: { type: String, default: '' },
    owner: { type: String, default: '' },
    parent: { type: String, default: '' },
    googleAnalyticsTag: { type: String, default: '' },
    beneficiary: {
      account: { type: String, default: '' },
      percent: { type: Number, default: 0 },
    },
    configuration: {
      configFlags: { type: Schema.Types.Mixed, default: {} },
    },
    status: { type: String, default: 'active' },
  },
  { timestamps: true },
);

export const appModel = (conn: Connection): Model<AppDocument> =>
  conn.model<AppDocument>('App', AppSchema, 'apps');
