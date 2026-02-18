import { Schema, Model, Connection, Document } from 'mongoose';
import {
  APP_REFERRAL_TYPES,
  USER_REFERRAL_STATUSES,
  USER_SUPPORTED_CURRENCIES,
  USER_LANGUAGES,
} from '@waivio-core-services/common';

export interface UserNotifications {
  activationCampaign?: boolean;
  deactivationCampaign?: boolean;
  follow?: boolean;
  fillOrder?: boolean;
  mention?: boolean;
  minimalTransfer?: number;
  reblog?: boolean;
  reply?: boolean;
  statusChange?: boolean;
  transfer?: boolean;
  powerUp?: boolean;
  witness_vote?: boolean;
  myPost?: boolean;
  myComment?: boolean;
  myLike?: boolean;
  like?: boolean;
  downvote?: boolean;
  claimReward?: boolean;
}

export interface UserSettings {
  exitPageSetting?: boolean;
  locale?: string;
  postLocales?: string[];
  nightmode?: boolean;
  rewardSetting?: 'SP' | '50' | 'STEEM';
  rewriteLinks?: boolean;
  showNSFWPosts?: boolean;
  upvoteSetting?: boolean;
  votePercent?: number;
  votingPower?: boolean;
  userNotifications?: UserNotifications;
  currency?: string;
}

export interface Draft {
  title?: string;
  author?: string;
  beneficiary?: boolean;
  body?: string;
  jsonMetadata?: Record<string, unknown>;
  lastUpdated?: number;
  parentAuthor?: string;
  parentPermlink?: string;
  permlink?: string;
  reward?: string;
}

export interface UserMetadata {
  notifications_last_timestamp?: number;
  settings?: UserSettings;
  bookmarks?: string[];
  drafts?: Draft[];
}

export interface Referral {
  agent?: string;
  startedAt?: Date;
  endedAt?: Date;
  type?: string;
}

export interface UserDocument extends Document {
  name: string;
  alias?: string;
  profile_image?: string;
  objects_follow?: string[];
  users_follow?: string[];
  json_metadata?: string;
  posting_json_metadata?: string;
  wobjects_weight?: number;
  count_posts?: number;
  last_posts_count?: number;
  last_posts_counts_by_hours?: number[];
  user_metadata?: UserMetadata;
  last_root_post?: string | null;
  users_following_count?: number;
  followers_count?: number;
  stage_version: number;
  privateEmail?: string | null;
  referralStatus?: string;
  referral?: Referral[];
  lastActivity?: Date;
  processed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserNotificationsSchema = new Schema<UserNotifications>(
  {
    activationCampaign: { type: Boolean, default: true },
    deactivationCampaign: { type: Boolean, default: true },
    follow: { type: Boolean, default: true },
    fillOrder: { type: Boolean, default: true },
    mention: { type: Boolean, default: true },
    minimalTransfer: { type: Number, default: 0 },
    reblog: { type: Boolean, default: true },
    reply: { type: Boolean, default: true },
    statusChange: { type: Boolean, default: true },
    transfer: { type: Boolean, default: true },
    powerUp: { type: Boolean, default: true },
    witness_vote: { type: Boolean, default: true },
    myPost: { type: Boolean, default: false },
    myComment: { type: Boolean, default: false },
    myLike: { type: Boolean, default: false },
    like: { type: Boolean, default: true },
    downvote: { type: Boolean, default: false },
    claimReward: { type: Boolean, default: false },
  },
  { _id: false },
);

const UserSettingsSchema = new Schema<UserSettings>(
  {
    exitPageSetting: { type: Boolean, default: true },
    locale: {
      type: String,
      enum: USER_LANGUAGES,
      default: 'auto',
    },
    postLocales: {
      type: [{ type: String, enum: USER_LANGUAGES }],
      default: [],
    },
    nightmode: { type: Boolean, default: false },
    rewardSetting: {
      type: String,
      enum: ['SP', '50', 'STEEM'],
      default: '50',
    },
    rewriteLinks: { type: Boolean, default: false },
    showNSFWPosts: { type: Boolean, default: false },
    upvoteSetting: { type: Boolean, default: false },
    votePercent: {
      type: Number,
      min: 1,
      max: 10000,
      default: 5000,
    },
    votingPower: { type: Boolean, default: true },
    userNotifications: {
      type: UserNotificationsSchema,
      default: () => ({}),
    },
    currency: {
      type: String,
      enum: Object.values(USER_SUPPORTED_CURRENCIES),
      default: USER_SUPPORTED_CURRENCIES.USD,
    },
  },
  { _id: false },
);

const DraftSchema = new Schema<Draft>(
  {
    title: { type: String },
    author: { type: String },
    beneficiary: { type: Boolean, default: true },
    body: { type: String },
    jsonMetadata: { type: Object },
    lastUpdated: { type: Number },
    parentAuthor: { type: String },
    parentPermlink: { type: String },
    permlink: { type: String },
    reward: { type: String },
  },
  { _id: false },
);

const UserMetadataSchema = new Schema<UserMetadata>(
  {
    notifications_last_timestamp: { type: Number, default: 0 },
    settings: { type: UserSettingsSchema, default: () => ({}) },
    bookmarks: { type: [String], default: [] },
    drafts: { type: [DraftSchema], default: [] },
  },
  { _id: false },
);

const ReferralsSchema = new Schema<Referral>(
  {
    agent: { type: String, index: true },
    startedAt: { type: Date },
    endedAt: { type: Date },
    type: {
      type: String,
      enum: Object.values(APP_REFERRAL_TYPES),
    },
  },
  { _id: false },
);

export const UserSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      index: true,
      unique: true,
      required: true,
    },
    alias: { type: String, default: '' },
    profile_image: { type: String },
    objects_follow: { type: [String], default: [] },
    users_follow: { type: [String], default: [] },
    json_metadata: { type: String, default: '' },
    posting_json_metadata: { type: String, default: '' },
    wobjects_weight: { type: Number, default: 0 },
    count_posts: { type: Number, default: 0, index: true },
    last_posts_count: { type: Number, default: 0 },
    last_posts_counts_by_hours: { type: [Number], default: [] },
    user_metadata: {
      type: UserMetadataSchema,
      default: () => ({}),
      select: false,
    },
    last_root_post: { type: String, default: null },
    users_following_count: { type: Number, default: 0 },
    followers_count: { type: Number, default: 0 },
    stage_version: { type: Number, default: 0, required: true },
    privateEmail: { type: String, default: null, select: false },
    referralStatus: {
      type: String,
      enum: Object.values(USER_REFERRAL_STATUSES),
      default: USER_REFERRAL_STATUSES.NOT_ACTIVATED,
    },
    referral: { type: [ReferralsSchema], default: [] },
    lastActivity: { type: Date, index: true },
    processed: { type: Boolean },
  },
  { timestamps: true },
);

UserSchema.index({ wobjects_weight: -1 });

export const userModel = (conn: Connection): Model<UserDocument> =>
  conn.model<UserDocument>('User', UserSchema, 'users');
