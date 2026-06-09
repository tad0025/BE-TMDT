import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher } from './entities/voucher.entity';
import { OrderVoucher } from '../checkout/entities/order-voucher.entity';
import { VouchersController } from './vouchers.controller';
import { ClientVouchersController } from './client-vouchers.controller';
import { VouchersService } from './vouchers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Voucher, OrderVoucher])],
  controllers: [VouchersController, ClientVouchersController],
  providers: [VouchersService],
  exports: [VouchersService],
})
export class VouchersModule {}
