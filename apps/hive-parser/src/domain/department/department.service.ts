import { Injectable } from '@nestjs/common';
import type { DepartmentDocument } from '@waivio-core-services/clients';
import { DepartmentRepository } from '../../repositories';

@Injectable()
export class DepartmentService {
  constructor(private readonly departmentRepository: DepartmentRepository) {}

  /**
   * Domain: find existing department by name or create it.
   * Repository only does data access; this service owns the decision.
   */
  async findOrCreateByName(params: {
    name: string;
    search: string;
  }): Promise<DepartmentDocument> {
    const existing = await this.departmentRepository.findOneByName(params.name);
    if (existing) {
      return existing;
    }
    const created = await this.departmentRepository.create({
      name: params.name,
      search: params.search,
    });
    if (!created) {
      throw new Error(
        `DepartmentRepository.create returned null for name=${params.name}`,
      );
    }
    return created;
  }
}
