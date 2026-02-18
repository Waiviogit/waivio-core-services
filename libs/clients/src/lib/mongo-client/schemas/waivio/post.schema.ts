import { Schema, Model, Connection, Document } from 'mongoose';

export interface Beneficiary {
  account?: string;
  weight?: number;
}

export interface ActiveVote {
  voter?: string;
  weight?: number;
  percent?: number;
  rshares?: number;
  rsharesWAIV?: number;
}

export interface Wobject {
  author_permlink?: string;
  percent?: number;
  tagged?: string;
  object_type?: string;
}

export interface ReblogTo {
  author?: string;
  permlink?: string;
}

export interface PostDocument extends Document {
  id?: number;
  author: string;
  author_reputation?: number;
  author_weight?: number;
  permlink: string;
  parent_author?: string;
  parent_permlink?: string;
  title?: string;
  body?: string;
  json_metadata?: string;
  app?: string;
  depth?: number;
  category?: string;
  last_update?: string;
  created?: string;
  active?: string;
  last_payout?: string;
  children?: number;
  net_rshares?: number;
  abs_rshares?: number;
  vote_rshares?: number;
  children_abs_rshares?: number;
  cashout_time?: string;
  reward_weight?: string;
  total_payout_value?: string;
  curator_payout_value?: string;
  author_rewards?: number;
  net_votes?: number;
  root_author?: string;
  root_permlink?: string;
  root_title?: string;
  max_accepted_payout?: string;
  percent_steem_dollars?: number;
  allow_replies?: boolean;
  allow_votes?: boolean;
  allow_curation_rewards?: boolean;
  beneficiaries?: Beneficiary[];
  url?: string;
  pending_payout_value?: string;
  total_pending_payout_value?: string;
  total_vote_weight?: number;
  promoted?: string;
  body_length?: number;
  active_votes?: ActiveVote[];
  wobjects?: Wobject[];
  language?: string;
  languages?: string[];
  reblog_to?: ReblogTo;
  reblogged_users?: string[];
  blocked_for_apps?: string[];
  net_rshares_WAIV?: number;
  total_payout_WAIV?: number;
  total_rewards_WAIV?: number;
  links?: string[];
  mentions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const BeneficiarySchema = new Schema<Beneficiary>(
  {
    account: { type: String },
    weight: { type: Number },
  },
  { _id: false },
);

const ActiveVoteSchema = new Schema<ActiveVote>(
  {
    voter: { type: String },
    weight: { type: Number },
    percent: { type: Number },
    rshares: { type: Number },
    rsharesWAIV: { type: Number },
  },
  { _id: false },
);

const WobjectSchema = new Schema<Wobject>(
  {
    author_permlink: { type: String, index: true },
    percent: { type: Number },
    tagged: { type: String },
    object_type: { type: String, index: true },
  },
  { _id: false },
);

const ReblogToSchema = new Schema<ReblogTo>(
  {
    author: { type: String },
    permlink: { type: String },
  },
  { _id: false },
);

export const PostSchema = new Schema<PostDocument>(
  {
    id: { type: Number },
    author: { type: String, required: true },
    author_reputation: { type: Number, default: 0 },
    author_weight: { type: Number, default: 0 },
    permlink: { type: String, required: true },
    parent_author: { type: String, default: '' },
    parent_permlink: { type: String, default: '' },
    title: { type: String, default: '' },
    body: { type: String, default: '' },
    json_metadata: { type: String, default: '' },
    app: { type: String },
    depth: { type: Number },
    category: { type: String },
    last_update: { type: String },
    created: { type: String },
    active: { type: String },
    last_payout: { type: String },
    children: { type: Number, default: 0 },
    net_rshares: { type: Number, default: 0 },
    abs_rshares: { type: Number, default: 0 },
    vote_rshares: { type: Number, default: 0 },
    children_abs_rshares: { type: Number },
    cashout_time: { type: String },
    reward_weight: { type: String },
    total_payout_value: { type: String, default: '0.000 HBD' },
    curator_payout_value: { type: String, default: '0.000 HBD' },
    author_rewards: { type: Number },
    net_votes: { type: Number },
    root_author: { type: String },
    root_permlink: { type: String },
    root_title: { type: String },
    max_accepted_payout: { type: String, default: '1000000.000 HBD' },
    percent_steem_dollars: { type: Number },
    allow_replies: { type: Boolean },
    allow_votes: { type: Boolean },
    allow_curation_rewards: { type: Boolean },
    beneficiaries: { type: [BeneficiarySchema], default: [] },
    url: { type: String },
    pending_payout_value: { type: String, default: '0.000 HBD' },
    total_pending_payout_value: { type: String, default: '0.000 HBD' },
    total_vote_weight: { type: Number },
    promoted: { type: String },
    body_length: { type: Number },
    active_votes: { type: [ActiveVoteSchema], default: [] },
    wobjects: { type: [WobjectSchema], default: [] },
    language: { type: String, default: 'en-US' },
    languages: { type: [String], default: ['en-US'], index: true },
    reblog_to: { type: ReblogToSchema },
    reblogged_users: { type: [String], default: [] },
    blocked_for_apps: { type: [String] },
    net_rshares_WAIV: { type: Number, default: 0 },
    total_payout_WAIV: { type: Number, default: 0 },
    total_rewards_WAIV: { type: Number, default: 0 },
    links: { type: [String], index: true },
    mentions: { type: [String], index: true },
  },
  { strict: false, timestamps: true },
);

PostSchema.index({ author: 1, permlink: 1 }, { unique: true });
PostSchema.index({ root_author: 1, permlink: 1 }, { unique: true });

PostSchema.pre('save', async function (this: PostDocument) {
  this.root_author = this.root_author || this.author;
});

export const postModel = (conn: Connection): Model<PostDocument> =>
  conn.model<PostDocument>('Post', PostSchema, 'posts');
