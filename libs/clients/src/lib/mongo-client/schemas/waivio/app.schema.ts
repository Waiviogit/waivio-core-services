import { Schema, Model, Connection, Document, Types } from 'mongoose';
import {
  APP_SUPPORTED_CURRENCIES,
  APP_LANGUAGES,
  APP_REFERRAL_TYPES,
  APP_STATUSES,
  APP_COLORS,
  APP_SHOP_SETTINGS_TYPE,
  APP_BILLING_TYPE,
} from '@waivio-core-services/common';

export interface AppHeader {
  name?: string;
  message?: string;
  startup?: string;
}

export interface ShopSettings {
  type?: string;
  value?: string;
}

export interface TopUser {
  name: string;
  weight?: number;
}

export interface TagsData {
  Ingredients?: Record<string, unknown>;
  Cuisine?: Record<string, unknown>;
  'Good For'?: Record<string, unknown>;
  Features?: Record<string, unknown>;
}

export interface ReferralTimer {
  type?: string;
  duration?: number;
  oldUserDuration?: number;
}

export interface AppCommissions {
  campaigns_server_acc: string;
  campaigns_percent: number;
  index_commission_acc: string;
  index_percent: number;
  referral_commission_acc: string;
}

export interface MapPoint {
  topPoint: [number, number]; // [longitude, latitude]
  bottomPoint: [number, number]; // [longitude, latitude]
}

export interface Colors {
  [APP_COLORS.BACKGROUND]?: string;
  [APP_COLORS.FONT]?: string;
  [APP_COLORS.HOVER]?: string;
  [APP_COLORS.HEADER]?: string;
  [APP_COLORS.BUTTON]?: string;
  [APP_COLORS.BORDER]?: string;
  [APP_COLORS.FOCUS]?: string;
  [APP_COLORS.LINKS]?: string;
}

export interface City {
  city?: string;
  route?: string;
}

export interface Configuration {
  configurationFields?: string[];
  desktopLogo?: string;
  mobileLogo?: string;
  aboutObject?: string;
  mainBanner?: string;
  defaultListImage?: string;
  desktopMap?: MapPoint;
  mobileMap?: MapPoint;
  availableCities?: City[];
  shopSettings?: ShopSettings;
  colors?: Colors;
  header?: AppHeader;
  defaultHashtag?: string;
  tabsFilter?: string[];
  siteTemplate?: string;
}

export interface AdSense {
  code?: string;
  level?: string;
  txtFile?: string;
  displayUnitCode?: string;
}

export interface ChosenPost {
  author?: string;
  permlink?: string;
  title?: string;
}

export interface AppDocument extends Document {
  name?: string;
  owner: string;
  googleAnalyticsTag?: string | null;
  googleGSCTag?: string | null;
  googleEventSnippet?: string | null;
  googleAdsConfig?: string | null;
  mainPage?: string;
  beneficiary: {
    account: string;
    percent: number;
  };
  configuration: Configuration;
  host: string;
  parent?: Types.ObjectId | null;
  admins?: string[];
  authority?: string[];
  moderators?: string[];
  supported_object_types?: string[];
  object_filters?: Record<string, unknown>;
  black_list_users?: string[];
  blacklist_apps?: string[];
  supported_hashtags?: string[];
  canBeExtended?: boolean;
  inherited?: boolean;
  status: string;
  activatedAt?: Date | null;
  deactivatedAt?: Date | null;
  supported_objects?: string[];
  top_users?: TopUser[];
  mapCoordinates?: MapPoint[];
  daily_chosen_post?: ChosenPost;
  weekly_chosen_post?: ChosenPost;
  app_commissions?: AppCommissions;
  referralsData?: ReferralTimer[];
  tagsData?: TagsData;
  parentHost?: string;
  currency?: string;
  language?: string;
  prefetches?: string[];
  objectControl?: boolean;
  advanced?: boolean;
  useForCanonical?: boolean;
  disableOwnerAuthority?: boolean;
  mapImportTag?: string;
  adSense?: AdSense;
  billingType?: string;
  trusted?: string[];
  trustedAll?: string[];
  verificationTags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AppHeaderSchema = new Schema<AppHeader>(
  {
    name: { type: String },
    message: { type: String },
    startup: { type: String },
  },
  { _id: false },
);

const ShopSettingsSchema = new Schema<ShopSettings>(
  {
    type: { type: String, enum: Object.values(APP_SHOP_SETTINGS_TYPE) },
    value: { type: String },
  },
  { _id: false },
);

const TopUserSchema = new Schema<TopUser>(
  {
    name: { type: String, required: true },
    weight: { type: Number, default: 0 },
  },
  { _id: false },
);

const TagsDataSchema = new Schema<TagsData>(
  {
    Ingredients: { type: Object, default: {} },
    Cuisine: { type: Object, default: {} },
    'Good For': { type: Object, default: {} },
    Features: { type: Object, default: {} },
  },
  { _id: false },
);

const ReferralTimersSchema = new Schema<ReferralTimer>(
  {
    type: { type: String, enum: Object.values(APP_REFERRAL_TYPES) },
    duration: { type: Number, default: 90 },
    oldUserDuration: { type: Number, default: 5 },
  },
  { _id: false },
);

const AppCommissionsSchema = new Schema<AppCommissions>(
  {
    campaigns_server_acc: { type: String, required: true },
    campaigns_percent: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    index_commission_acc: { type: String, required: true },
    index_percent: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    referral_commission_acc: { type: String, required: true },
  },
  { _id: false },
);

const MapPointsSchema = new Schema<MapPoint>(
  {
    topPoint: { type: [Number], required: true }, // [longitude, latitude]
    bottomPoint: { type: [Number], required: true }, // [longitude, latitude]
  },
  { _id: false },
);

const ColorsSchema = new Schema<Colors>(
  {
    [APP_COLORS.BACKGROUND]: { type: String, default: '' },
    [APP_COLORS.FONT]: { type: String, default: '' },
    [APP_COLORS.HOVER]: { type: String, default: '' },
    [APP_COLORS.HEADER]: { type: String, default: '' },
    [APP_COLORS.BUTTON]: { type: String, default: '' },
    [APP_COLORS.BORDER]: { type: String, default: '' },
    [APP_COLORS.FOCUS]: { type: String, default: '' },
    [APP_COLORS.LINKS]: { type: String, default: '' },
  },
  { _id: false },
);

const CitySchema = new Schema<City>(
  {
    city: { type: String },
    route: { type: String },
  },
  { _id: false },
);

const ConfigurationSchema = new Schema<Configuration>(
  {
    configurationFields: { type: [String] },
    desktopLogo: { type: String },
    mobileLogo: { type: String },
    aboutObject: { type: String },
    mainBanner: { type: String },
    defaultListImage: { type: String },
    desktopMap: { type: MapPointsSchema },
    mobileMap: { type: MapPointsSchema },
    availableCities: { type: [CitySchema], default: [] },
    shopSettings: { type: ShopSettingsSchema },
    colors: { type: ColorsSchema, default: () => ({}) },
    header: { type: AppHeaderSchema },
    defaultHashtag: { type: String },
    tabsFilter: { type: [String] },
    siteTemplate: { type: String },
  },
  { _id: false },
);

const AdSenseSchema = new Schema<AdSense>(
  {
    code: { type: String },
    level: { type: String },
    txtFile: { type: String },
    displayUnitCode: { type: String },
  },
  { _id: false },
);

export const AppSchema = new Schema<AppDocument>(
  {
    name: { type: String, index: true },
    owner: { type: String, required: true },
    googleAnalyticsTag: { type: String, default: null },
    googleGSCTag: { type: String, default: null },
    googleEventSnippet: { type: String, default: null },
    googleAdsConfig: { type: String, default: null },
    mainPage: { type: String },
    beneficiary: {
      account: { type: String, default: 'waivio' },
      percent: { type: Number, default: 500 },
    },
    configuration: { type: ConfigurationSchema, default: () => ({}) },
    host: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    parent: { type: Schema.Types.ObjectId, default: null },
    admins: { type: [String], default: [] },
    authority: { type: [String], default: [] },
    moderators: { type: [String], default: [] },
    supported_object_types: { type: [String], default: [] },
    object_filters: { type: Object, default: {} },
    black_list_users: { type: [String], default: [] },
    blacklist_apps: { type: [String], default: [] },
    supported_hashtags: { type: [String], default: [] },
    canBeExtended: { type: Boolean, default: false },
    inherited: { type: Boolean, default: true },
    status: {
      type: String,
      default: APP_STATUSES.PENDING,
      enum: Object.values(APP_STATUSES),
    },
    activatedAt: { type: Date, default: null },
    deactivatedAt: { type: Date, default: null },
    supported_objects: { type: [String], index: true, default: [] },
    top_users: { type: [TopUserSchema] },
    mapCoordinates: { type: [MapPointsSchema], default: [] },
    daily_chosen_post: {
      author: { type: String },
      permlink: { type: String },
      title: { type: String },
    },
    weekly_chosen_post: {
      author: { type: String },
      permlink: { type: String },
      title: { type: String },
    },
    app_commissions: { type: AppCommissionsSchema },
    referralsData: { type: [ReferralTimersSchema], default: [] },
    tagsData: { type: TagsDataSchema },
    parentHost: { type: String },
    currency: {
      type: String,
      enum: Object.values(APP_SUPPORTED_CURRENCIES),
      default: APP_SUPPORTED_CURRENCIES.USD,
    },
    language: {
      type: String,
      enum: APP_LANGUAGES,
      default: 'en-US',
    },
    prefetches: { type: [String] },
    objectControl: { type: Boolean, default: false },
    advanced: { type: Boolean, default: false },
    useForCanonical: { type: Boolean, default: false },
    disableOwnerAuthority: { type: Boolean, default: false },
    mapImportTag: { type: String },
    adSense: { type: AdSenseSchema, default: () => ({}) },
    billingType: { type: String, default: APP_BILLING_TYPE.CRYPTO },
    trusted: { type: [String] },
    trustedAll: { type: [String] },
    verificationTags: { type: [String] },
  },
  { timestamps: true },
);

AppSchema.pre('save', async function (this: AppDocument) {
  if (this.parent) {
    const Model = this.constructor as unknown as Model<AppDocument>;
    const parent = await Model.findOne({ _id: this.parent });
    if (!parent) {
      return;
    }
    this.supported_object_types = parent.supported_object_types;
    this.object_filters = parent.object_filters;
    this.mainPage = parent.mainPage;
    if (!this.configuration) {
      this.configuration = {};
    }
    if (parent.configuration?.configurationFields) {
      this.configuration.configurationFields =
        parent.configuration.configurationFields;
    }
  }
});

export const appModel = (conn: Connection): Model<AppDocument> =>
  conn.model<AppDocument>('App', AppSchema, 'apps');
