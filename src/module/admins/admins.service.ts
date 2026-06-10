import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Admin } from './entities/admin.entity';
import { EUserRole } from '../users/enums/user.enum';
import { ENV_VARS } from '../../constants/env.constants';

@Injectable()
export class AdminsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const adminMail = this.configService.get<string>(ENV_VARS.ADMIN_MAIL);
    const adminPassword = this.configService.get<string>(ENV_VARS.ADMIN_PASSWORD);
    
    if (!adminMail || !adminPassword) {
      this.logger.warn('ADMIN_MAIL or ADMIN_PASSWORD is not set in .env. Skipping admin seeding.');
      return;
    }

    let adminUser = await this.userRepository.findOne({ where: { email: adminMail } });

    if (!adminUser) {
      this.logger.log('Admin user not found. Creating default admin...');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      const adminFullName = this.configService.get<string>(ENV_VARS.ADMIN_FULL_NAME) || 'Admin';
      const adminAvatarUrl = this.configService.get<string>(ENV_VARS.ADMIN_AVATAR_URL) || '';

      adminUser = this.userRepository.create({
        email: adminMail,
        password: hashedPassword,
        fullName: adminFullName,
        avatarUrl: adminAvatarUrl,
        role: EUserRole.ADMIN,
      });

      adminUser = await this.userRepository.save(adminUser);

      const adminProfile = this.adminRepository.create({
        user: adminUser,
        department: 'Management',
      });
      await this.adminRepository.save(adminProfile);
      
      this.logger.log('Default admin created successfully.');
    } else {
      
      const adminProfile = await this.adminRepository.findOne({ where: { user: { id: adminUser.id } } });
      if (!adminProfile) {
        const newProfile = this.adminRepository.create({
          user: adminUser,
          department: 'Management',
        });
        await this.adminRepository.save(newProfile);
        this.logger.log('Admin profile created for existing admin user.');
      }
      this.logger.log('Default admin already exists. Skipping creation.');
    }
  }
}
