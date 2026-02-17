import { Injectable, Logger } from '@nestjs/common';
import {
  Model,
  PipelineStage,
  QueryFilter,
  QueryOptions,
  UpdateQuery,
  UpdateWithAggregationPipeline,
  UpdateWriteOpResult,
} from 'mongoose';

export type AggregateType = {
  pipeline: PipelineStage[];
};

export type DeleteResultType = {
  acknowledged: boolean;
  deletedCount: number;
};

export type FindType<T> = {
  filter: QueryFilter<T>;
  projection?: object | string | string[];
  options?: QueryOptions<T> | null;
};

export type UpdateType<T> = {
  filter: QueryFilter<T>;
  update: UpdateWithAggregationPipeline | UpdateQuery<T>;
  options?: QueryOptions<T> | null;
};

export type FindOneAndDeleteType<T> = {
  filter: QueryFilter<T>;
  options?: QueryOptions<T> | null;
};

export interface MongoRepositoryInterface<
  TDocument,
  TCreate = Partial<TDocument>,
> {
  find(params: FindType<TDocument>): Promise<TDocument[]>;
  findOne(params: FindType<TDocument>): Promise<TDocument | null>;
  create(params: TCreate): Promise<TDocument | null>;
  findOneAndUpdate(params: UpdateType<TDocument>): Promise<TDocument | null>;
  updateOne(params: UpdateType<TDocument>): Promise<UpdateWriteOpResult | null>;
  updateMany(
    params: UpdateType<TDocument>,
  ): Promise<UpdateWriteOpResult | null>;
  findOneAndDelete(
    params: FindOneAndDeleteType<TDocument>,
  ): Promise<TDocument | null>;
  aggregate<TResult = unknown>(params: AggregateType): Promise<TResult[]>;
  deleteOne(params: FindOneAndDeleteType<TDocument>): Promise<DeleteResultType>;
  deleteMany(
    params: FindOneAndDeleteType<TDocument>,
  ): Promise<DeleteResultType>;
}

const EMPTY_DELETE_RESULT: DeleteResultType = {
  acknowledged: false,
  deletedCount: 0,
};

@Injectable()
export abstract class MongoRepository<
  TDocument,
  TCreate = Partial<TDocument>,
> implements MongoRepositoryInterface<TDocument, TCreate> {
  protected constructor(
    protected readonly model: Model<TDocument>,
    protected readonly logger: Logger,
  ) {}

  async find(params: FindType<TDocument>): Promise<TDocument[]> {
    try {
      return this.model
        .find(params.filter as any, params.projection, params.options as any)
        .lean();
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  async findOne(params: FindType<TDocument>): Promise<TDocument | null> {
    try {
      return this.model
        .findOne(params.filter, params.projection, params.options)
        .lean() as Promise<TDocument | null>;
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  async findOneAndUpdate(
    params: UpdateType<TDocument>,
  ): Promise<TDocument | null> {
    try {
      return this.model
        .findOneAndUpdate(params.filter, params.update, params.options)
        .lean() as Promise<TDocument | null>;
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  async updateOne(
    params: UpdateType<TDocument>,
  ): Promise<UpdateWriteOpResult | null> {
    try {
      return this.model.updateOne(
        params.filter,
        params.update,
        params.options as any,
      );
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  async updateMany(
    params: UpdateType<TDocument>,
  ): Promise<UpdateWriteOpResult | null> {
    try {
      return this.model.updateMany(
        params.filter,
        params.update,
        params.options as any,
      );
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  async findOneAndDelete(
    params: FindOneAndDeleteType<TDocument>,
  ): Promise<TDocument | null> {
    try {
      return this.model
        .findOneAndDelete(params.filter, params.options)
        .lean() as Promise<TDocument | null>;
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  async deleteOne(
    params: FindOneAndDeleteType<TDocument>,
  ): Promise<DeleteResultType> {
    try {
      return this.model.deleteOne(params.filter, params.options as any);
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
      return EMPTY_DELETE_RESULT;
    }
  }

  async deleteMany(
    params: FindOneAndDeleteType<TDocument>,
  ): Promise<DeleteResultType> {
    try {
      return this.model.deleteMany(params.filter, params.options as any);
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
      return EMPTY_DELETE_RESULT;
    }
  }

  async create(data: TCreate): Promise<TDocument | null> {
    try {
      return await this.model.create(data as Partial<TDocument>);
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  async aggregate<TResult = unknown>({
    pipeline,
  }: AggregateType): Promise<TResult[]> {
    try {
      return await this.model.aggregate<TResult>(pipeline);
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
      return [];
    }
  }
}
