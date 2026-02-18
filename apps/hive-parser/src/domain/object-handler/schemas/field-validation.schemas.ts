import { z } from 'zod';
import {
  WEIGHT_UNITS,
  DIMENSION_UNITS,
  VALID_AFFILIATE_GEO,
} from '@waivio-core-services/common';

export const optionsSchema = z.object({
  category: z.string(),
  value: z.string(),
  position: z.number().default(1),
  image: z.string().optional(),
});

export const weightSchema = z.object({
  value: z.number().min(0),
  unit: z.enum(WEIGHT_UNITS),
});

export const dimensionsSchema = z.object({
  length: z.number().min(0),
  width: z.number().min(0),
  depth: z.number().min(0),
  unit: z.enum(DIMENSION_UNITS),
});

export const featuresSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const namePermlinkSchema = z
  .object({
    name: z.string().optional(),
    authorPermlink: z.string().optional(),
  })
  .refine((data) => data.name || data.authorPermlink, {
    message: 'Either name or authorPermlink must be provided',
  });

export const widgetSchema = z.object({
  column: z.string(),
  type: z.string(),
  content: z.string(),
});

export const newsFeedSchema = z.object({
  allowList: z.array(z.array(z.string())).optional(),
  ignoreList: z.array(z.string()).optional(),
  typeList: z.array(z.string()).optional(),
  authors: z.array(z.string()).optional(),
});

export const departmentsSchema = z.object({
  department: z.string(),
});

export const shopFilterSchema = z
  .object({
    type: z.string().optional(),
    departments: z.array(z.array(z.string())).optional(),
    tags: z.array(z.string()).optional(),
    authorities: z.array(z.string()).optional(),
  })
  .refine(
    (data) => data.type || data.departments || data.tags || data.authorities,
    {
      message:
        'At least one of type, departments, tags, or authorities must be provided',
    },
  );

export const menuItemSchema = z
  .object({
    title: z.string().optional(),
    style: z.string(),
    image: z.string().optional(),
    linkToObject: z.string().optional(),
    objectType: z.string().optional(),
    linkToWeb: z.string().url().optional(),
  })
  .refine((data) => data.linkToObject || data.linkToWeb, {
    message: 'Either linkToObject or linkToWeb must be provided',
  })
  .refine((data) => !data.linkToObject || data.objectType, {
    message: 'objectType is required when linkToObject is provided',
    path: ['objectType'],
  });

export const validUrlSchema = z.string().url();

export const affiliateProductIdTypesSchema = z.string().toLowerCase();

export const affiliateCodeSchema = z.array(z.string()).min(2);

export const affiliateGeoSchema = z.enum(VALID_AFFILIATE_GEO);

export const mapTypesSchema = z.array(z.string()).min(1);

export const mapViewSchema = z.object({
  topPoint: z.tuple([
    z.number().min(-180).max(180),
    z.number().min(-90).max(90),
  ]),
  bottomPoint: z.tuple([
    z.number().min(-180).max(180),
    z.number().min(-90).max(90),
  ]),
  center: z.tuple([z.number(), z.number()]),
  zoom: z.number().min(1).max(18).optional(),
});

export const mapRectanglesSchema = z.array(
  z.object({
    topPoint: z.tuple([
      z.number().min(-180).max(180),
      z.number().min(-90).max(90),
    ]),
    bottomPoint: z.tuple([
      z.number().min(-180).max(180),
      z.number().min(-90).max(90),
    ]),
  }),
);

export const walletAddressSchema = z.object({
  title: z.string().optional(),
  symbol: z.string(),
  address: z.string(),
});

export const timeLimitedSchema = z
  .object({
    startDate: z.number().int().min(0).optional(),
    endDate: z.number().int().min(0).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && !data.endDate) return false;
      if (data.endDate && !data.startDate) return false;
      if (data.startDate && data.endDate && data.endDate <= data.startDate)
        return false;
      return true;
    },
    {
      message:
        'endDate is required when startDate is present, and endDate must be greater than startDate',
    },
  );
