import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order } from '../checkout/entities/order.entity';
import { OrderItem } from '../checkout/entities/order-item.entity';
import { GetOrdersFilterDto, UpdateOrderStatusDto } from './dto/orders.dto';
import { EOrderStatus } from '../checkout/enums/EOrderStatus.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  async getOrdersByStatus(filterDto: GetOrdersFilterDto): Promise<Order[]> {
    const { status } = filterDto;
    const query = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items');

    if (status) {
      query.andWhere('order.status = :status', { status });
      query.orderBy('order.createdAt', 'DESC');
    } else {
      // Mặc định: lọc PENDING, PREPARING, SHIPPING
      query.andWhere('order.status IN (:...statuses)', { 
        statuses: [EOrderStatus.PENDING, EOrderStatus.PREPARING, EOrderStatus.SHIPPING] 
      });
      // Order: PENDING -> PREPARING -> SHIPPING, sau đó DESC theo createdAt
      query.orderBy(
        `FIELD(order.status, '${EOrderStatus.PENDING}', '${EOrderStatus.PREPARING}', '${EOrderStatus.SHIPPING}')`, 
        'ASC'
      );
      query.addOrderBy('order.createdAt', 'DESC');
    }

    return query.getMany();
  }

  async getOrderStatusCounts(): Promise<any> {
    const statuses = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(order.id)', 'count')
      .groupBy('order.status')
      .getRawMany();

    const result = {
      all: 0,
      pending: 0,
      preparing: 0,
      shipping: 0,
      success: 0,
      cancelled: 0,
      returned: 0
    };

    statuses.forEach(item => {
      const statusKey = item.status.toLowerCase();
      if (result[statusKey] !== undefined) {
        result[statusKey] = Number(item.count);
      }
    });

    result.all = result.pending + result.preparing + result.shipping;
    return result;
  }

  async getOrderDetailById(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ 
      where: { id },
      relations: ['items', 'address']
    });
    
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID ${id}`);
    }
    
    return order;
  }

  async updateOrderStatus(id: string, updateDto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.getOrderDetailById(id);
    order.status = updateDto.status;
    // Nếu có 'note', bạn có thể cần lưu vào một bảng OrderHistory hoặc tương tự
    // Tạm thời ở đây chỉ cập nhật trạng thái đơn hàng
    return this.orderRepository.save(order);
  }
}
