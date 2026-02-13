import { z } from 'zod';

const createObjectOp = z.object({
  method: z.literal('createObject'),
  params: z.object({
    id: z.string(),
    author: z.string(),
    data: z.record(z.unknown()),
  }),
});

const updateObjectOp = z.object({
  method: z.literal('updateObject'),
  params: z.object({
    id: z.string(),
    patch: z.record(z.unknown()),
  }),
});

export const waivioOperationSchema = z.discriminatedUnion('method', [
  createObjectOp,
  updateObjectOp,
]);

export type WaivioOperation = z.infer<typeof waivioOperationSchema>;
export type WaivioMethod = WaivioOperation['method'];
