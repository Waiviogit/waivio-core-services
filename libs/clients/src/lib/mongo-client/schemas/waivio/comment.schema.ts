import { Schema, Model, Connection, Document } from 'mongoose';

export interface CommentActiveVote {
  voter: string;
  percent: number;
}

export interface CommentGuestInfo {
  userId: string;
  social: string;
}

export interface CommentDocument extends Document {
  author: string;
  permlink: string;
  root_author: string;
  root_permlink: string;
  parent_author: string;
  parent_permlink: string;
  active_votes: CommentActiveVote[];
  guestInfo: CommentGuestInfo | null;
}

export const CommentSchema = new Schema<CommentDocument>(
  {
    author: { type: String, required: true },
    permlink: { type: String, required: true },
    root_author: { type: String, required: true },
    root_permlink: { type: String, required: true },
    parent_author: { type: String, required: true },
    parent_permlink: { type: String, required: true },
    active_votes: {
      type: [
        {
          voter: { type: String },
          percent: { type: Number },
        },
      ],
      default: [],
      required: true,
    },
    guestInfo: {
      type: {
        userId: { type: String },
        social: { type: String },
      },
      default: null,
    },
  },
  { timestamps: false, versionKey: false },
);

CommentSchema.index({ author: 1, permlink: 1 }, { unique: true });
CommentSchema.index({ root_author: 1, root_permlink: 1 });
CommentSchema.index({ parent_author: 1, parent_permlink: 1 });
CommentSchema.index({ 'guestInfo.userId': 1 });

export const commentModel = (conn: Connection): Model<CommentDocument> =>
  conn.model<CommentDocument>('Comments', CommentSchema, 'comments');
