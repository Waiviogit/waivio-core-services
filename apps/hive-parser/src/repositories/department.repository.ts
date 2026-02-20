import { Injectable, Logger } from '@nestjs/common';
import {
  MongoRepository,
  MongoClientFactory,
  MONGO_CONNECTION,
  departmentModel,
} from '@waivio-core-services/clients';
import type { DepartmentDocument } from '@waivio-core-services/clients';

@Injectable()
export class DepartmentRepository extends MongoRepository<DepartmentDocument> {
  constructor(mongoFactory: MongoClientFactory) {
    super(
      departmentModel(mongoFactory.getConnection(MONGO_CONNECTION.WAIVIO)),
      new Logger(DepartmentRepository.name),
    );
  }

  async findOneByName(name: string): Promise<DepartmentDocument | null> {
    return this.findOne({
      filter: { name },
    });
  }

  async updateDepartmentOne(params: {
    filter: { name: string };
    update: {
      $pull?: { related?: string | { $each?: string[] } };
      $addToSet?: { related?: string | { $each?: string[] } };
      $set?: Partial<DepartmentDocument>;
    };
  }): Promise<void> {
    await this.updateOne({
      filter: params.filter,
      update: params.update,
    });
  }

  async updateDepartmentMany(params: {
    filter: { name?: { $in: string[] } };
    update: {
      $addToSet?: { related?: string };
    };
  }): Promise<void> {
    await this.updateMany({
      filter: params.filter,
      update: params.update,
    });
  }
}
