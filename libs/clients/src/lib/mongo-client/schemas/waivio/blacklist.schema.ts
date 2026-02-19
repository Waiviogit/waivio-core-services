import { Schema, Model, Connection, Document } from 'mongoose';

export interface BlacklistDocument extends Document {
  user: string;
  whiteList: string[];
  blackList: string[];
  followLists: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export const BlacklistSchema = new Schema<BlacklistDocument>(
  {
    user: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    whiteList: { type: [String], default: [] },
    blackList: { type: [String], default: [] },
    followLists: { type: [String], default: [] },
  },
  { timestamps: true },
);

BlacklistSchema.pre('save', function (this: BlacklistDocument) {
  this.whiteList = [this.user];
});

// Note: post('findOne') hook replaces followLists (string[]) with lean document array.
// This hook only works when NOT using .lean() queries.
// For lean queries (used in repositories), use BlacklistRepository.findWithFollowLists() instead.
BlacklistSchema.post('findOne', async function (doc: BlacklistDocument | null) {
  if (doc && doc.followLists && doc.followLists.length > 0) {
    const Model = this.model as Model<BlacklistDocument>;
    const followListDocs = await Model.find({
      user: { $in: doc.followLists },
    }).lean();
    // Original behavior: replace string array with lean document array
    // TypeScript note: This is a type mismatch, but matches original JS behavior
    // Using Record<string, unknown>[] to represent lean documents
    (doc as unknown as { followLists: Record<string, unknown>[] }).followLists =
      followListDocs;
  }
});

export const blacklistModel = (conn: Connection): Model<BlacklistDocument> =>
  conn.model<BlacklistDocument>(
    'Blacklist',
    BlacklistSchema,
    'guide-blacklists',
  );
