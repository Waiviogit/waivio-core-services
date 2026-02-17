import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

const createObjectOp = z
  .object({
    method: z.literal('createObject'),
    params: z.object({
      permlink: z
        .string()
        .openapi({ description: 'Unique permlink identifier for the object' }),
      defaultName: z
        .string()
        .openapi({ description: 'Default display name of the object' }),
      creator: z
        .string()
        .openapi({ description: 'Hive account that initiates the creation' }),
      objectType: z.string().openapi({
        description: 'Type classification (e.g. restaurant, book, person)',
      }),
    }),
  })
  .openapi('CreateObject', { description: 'Creates a new Waivio object' });

const updateObjectOp = z
  .object({
    method: z.literal('updateObject'),
    params: z.object({
      objectPermlink: z
        .string()
        .openapi({ description: 'Permlink of the target object' }),
      name: z.string().openapi({ description: 'Field name to add or update' }),
      locale: z
        .string()
        .optional()
        .openapi({ description: 'Locale code (e.g. en-US)' }),
      body: z.string().openapi({ description: 'Field value / content body' }),
      creator: z
        .string()
        .openapi({ description: 'Hive account that initiates the update' }),
    }),
  })
  .openapi('UpdateObject', {
    description: 'Adds a field to an existing Waivio object',
  });

const voteObjectFieldOp = z
  .object({
    method: z.literal('voteObjectField'),
    params: z.object({
      objectPermlink: z
        .string()
        .openapi({ description: 'Permlink of the target object' }),
      fieldTransactionId: z
        .string()
        .openapi({ description: 'Transaction ID of the field to vote on' }),
      weight: z.number().min(-10000).max(10000).openapi({
        description: 'Vote weight (-10000 to 10000, like Hive percent)',
      }),
    }),
  })
  .openapi('VoteObjectField', {
    description: 'Vote for or against an object field update',
  });

export const waivioOperationSchema = z.discriminatedUnion('method', [
  createObjectOp,
  updateObjectOp,
  voteObjectFieldOp,
]);

export type WaivioOperation = z.infer<typeof waivioOperationSchema>;
export type WaivioMethod = WaivioOperation['method'];
