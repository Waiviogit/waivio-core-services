import { Schema, Model, Connection, Document } from 'mongoose';

export interface DepartmentDocument extends Document {
  name: string;
  search: string;
  related?: string[];
  objectsCount?: number;
  level?: number;
  sortScore?: number;
}

export const DepartmentSchema = new Schema<DepartmentDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      maxlength: 150,
    },
    search: { type: String, required: true },
    related: { type: [String], index: true, default: [] },
    objectsCount: { type: Number, default: 0 },
    level: { type: Number, index: true },
    sortScore: { type: Number },
  },
  { versionKey: false },
);

DepartmentSchema.index({ search: 'text' });

export const departmentModel = (conn: Connection): Model<DepartmentDocument> =>
  conn.model<DepartmentDocument>('Department', DepartmentSchema, 'departments');
