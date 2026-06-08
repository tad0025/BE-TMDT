import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voucher, VoucherStatus } from './entities/voucher.entity';
import { CreateVoucherRequestDto, GetVouchersQueryDto, UpdateVoucherRequestDto, UpdateVoucherStatusRequestDto } from './dto/vouchers.dto';

@Injectable()
export class VouchersService {
  constructor(
    @InjectRepository(Voucher)
    private readonly voucherRepository: Repository<Voucher>,
  ) {}

  async getVouchers(query: GetVouchersQueryDto) {
    const { page = 1, pageSize = 10, status, distribution_type } = query;
    const qb = this.voucherRepository.createQueryBuilder('voucher');

    if (status) {
      qb.andWhere('voucher.status = :status', { status });
    }
    if (distribution_type) {
      qb.andWhere('voucher.distribution_type = :distribution_type', { distribution_type });
    }

    qb.orderBy('voucher.created_at', 'DESC');
    
    if (query.pageSize) {
       qb.skip((page - 1) * pageSize).take(pageSize);
    }
    return qb.getMany();
  }

  async getVoucherById(id: number) {
    const voucher = await this.voucherRepository.findOne({ where: { id } });
    if (!voucher) throw new NotFoundException('Voucher not found');
    return voucher;
  }

  async createVoucher(dto: CreateVoucherRequestDto) {
    const voucher = this.voucherRepository.create({
      ...dto,
      start_date: new Date(dto.start_date),
      end_date: new Date(dto.end_date),
    });
    const saved = await this.voucherRepository.save(voucher);
    return { id: saved.id, status: saved.status };
  }

  async updateVoucherStatus(id: number, dto: UpdateVoucherStatusRequestDto) {
    const voucher = await this.getVoucherById(id);
    voucher.status = dto.status;
    await this.voucherRepository.save(voucher);
    return null;
  }

  async updateVoucher(id: number, dto: UpdateVoucherRequestDto) {
    const voucher = await this.getVoucherById(id);
    
    if (dto.title !== undefined) voucher.title = dto.title;
    if (dto.discount_value !== undefined) voucher.discount_value = dto.discount_value;
    if (dto.max_discount_amount !== undefined) voucher.max_discount_amount = dto.max_discount_amount;
    if (dto.total_limit !== undefined) voucher.total_limit = dto.total_limit;
    if (dto.limit_per_user !== undefined) voucher.limit_per_user = dto.limit_per_user;
    if (dto.start_date !== undefined) voucher.start_date = new Date(dto.start_date);
    if (dto.end_date !== undefined) voucher.end_date = new Date(dto.end_date);
    if (dto.status !== undefined) voucher.status = dto.status;

    await this.voucherRepository.save(voucher);
    return null;
  }

  async deleteVoucher(id: number) {
    const voucher = await this.getVoucherById(id);
    await this.voucherRepository.remove(voucher);
    return null;
  }

  async getVoucherStats() {
    const all = await this.voucherRepository.find();
    
    const total_vouchers = all.length;
    const total_used_count = all.reduce((sum, v) => sum + v.used_count, 0);
    
    const total_discount_given = all.reduce((sum, v) => {
      if (v.voucher_type === 'CASH') return sum + (Number(v.used_count) * Number(v.discount_value));
      return sum; 
    }, 0);
    
    const active_vouchers_count = all.filter(v => v.status === VoucherStatus.ACTIVE).length;
    
    const typeCount: Record<string, number> = {};
    all.forEach(v => {
      typeCount[v.voucher_type] = (typeCount[v.voucher_type] || 0) + 1;
    });
    
    let most_popular_type: string | null = null;
    let max = 0;
    for (const type in typeCount) {
      if (typeCount[type] > max) {
        max = typeCount[type];
        most_popular_type = type;
      }
    }

    const sortedByUse = [...all].sort((a, b) => b.used_count - a.used_count);
    const top_vouchers = sortedByUse.slice(0, 5).map(v => ({
      id: v.id,
      title: v.title,
      code: v.code,
      used_count: v.used_count,
      total_discount_given: v.voucher_type === 'CASH' ? Number(v.used_count) * Number(v.discount_value) : 0,
      voucher_type: v.voucher_type
    }));

    return {
      total_vouchers,
      total_used_count,
      total_discount_given,
      most_popular_type,
      top_vouchers,
      active_vouchers_count
    };
  }
}
