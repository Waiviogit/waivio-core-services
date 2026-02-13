import { z } from 'zod';

const createObjectOp = z.object({
  method: z.literal('createObject'),
  params: z.object({
    author: z.string(),
    permlink: z.string(),
    defaultName: z.string(),
  }),
});

const updateObjectOp = z.object({
  method: z.literal('updateObject'),
  params: z.object({
    author: z.string(),
    permlink: z.string(),
    name: z.string(),
    locale: z.string(),
    body: z.string(),
  }),
});

export const waivioOperationSchema = z.discriminatedUnion('method', [
  createObjectOp,
  updateObjectOp,
]);

export type WaivioOperation = z.infer<typeof waivioOperationSchema>;
export type WaivioMethod = WaivioOperation['method'];
