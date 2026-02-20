import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../../repositories';
import { DepartmentService } from './department.service';

@Module({
  imports: [RepositoriesModule],
  providers: [DepartmentService],
  exports: [DepartmentService],
})
export class DepartmentModule {}
