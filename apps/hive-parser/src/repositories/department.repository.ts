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

  async findOneOrCreateByName(params: {
    name: string;
    search: string;
  }): Promise<DepartmentDocument> {
    let department = await this.findOne({
      filter: { name: params.name },
    });

    if (!department) {
      department = await this.create({
        name: params.name,
        search: params.search,
      });
    }

    return department;
  }

  async updateDepartmentOne(params: {
    filter: { name: string };
    update: {
      $pull?: { related?: string | { $each?: string[] } };
      $addToSet?: { related?: string | { $each?: string[] } };
      $set?: Partial<DepartmentDocument>;
    };
  }): Promise<void> {
    await this.model.updateOne(params.filter, params.update as any);
  }

  async updateDepartmentMany(params: {
    filter: { name?: { $in: string[] } };
    update: {
      $addToSet?: { related?: string };
    };
  }): Promise<void> {
    await this.model.updateMany(params.filter, params.update as any);
  }
}
