import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './entities/admin.entity';
import { User } from '../users/entities/user.entity';
import { AdminsService } from './admins.service';

@Module({
  imports: [TypeOrmModule.forFeature([Admin, User])],
  controllers: [],
  providers: [AdminsService],
  exports: [AdminsService],
})
export class AdminsModule {}
