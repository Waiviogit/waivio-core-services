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
}
