import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order } from '../checkout/entities/order.entity';
import { OrderItem } from '../checkout/entities/order-item.entity';
import { OrderListItemDto, GetOrdersFilterDto, UpdateOrderStatusDto, OrderDetailDto, OrderDetailProductItemDto, OrderStatusHistoryDto } from './dto/orders.dto';
import { EOrderStatus } from '../checkout/enums/EOrderStatus.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) { }


  async getOrdersByStatus(filterDto: GetOrdersFilterDto): Promise<OrderListItemDto[]> {
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

    const orders = await query.getMany();

    return orders.map(order => {
      let totalProductQuantity = 0;
      let firstProductImageUrl = '';

      if (order.items && order.items.length > 0) {
        totalProductQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
        firstProductImageUrl = order.items[0].productImageUrl || '';
      }

      // Address mapping from snapshotAddress
      const snapshot: any = order.snapshotAddress || {};

      return {
        id: order.id,
        createdAt: order.createdAt,
        orderStatus: order.status,
        totalAmount: Number(order.totalAmount),
        totalProductQuantity,
        firstProductImageUrl,
        buyerName: snapshot.fullName || '',
        buyerAddress: snapshot.fullAddress || '',
        buyerPhone: snapshot.phoneNumber || '',
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
      };
    });
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

  private mapToOrderDetailDto(order: Order): OrderDetailDto {
    const snapshot: any = order.snapshotAddress || {};

    const statusHistory: OrderStatusHistoryDto[] = [
      {
        status: order.status,
        timestamp: order.createdAt,
        note: 'Cập nhật trạng thái tự động'
      }
    ];

    const items: OrderDetailProductItemDto[] = (order.items || []).map(item => ({
      productId: item.productId,
      productName: item.productName || 'Sản phẩm',
      productImageUrl: item.productImageUrl || '',
      price: Number(item.price),
      originalPrice: Number(item.originalPrice || item.price),
      discountPercentage: Number(item.discountPercentage || 0),
      quantity: item.quantity,
      amount: Number(item.price) * item.quantity
    }));

    return {
      id: order.id,
      createdAt: order.createdAt,
      statusHistory,
      orderStatus: order.status,
      buyerName: snapshot.fullName || order.address?.fullName || '',
      buyerPhone: snapshot.phoneNumber || order.address?.phoneNumber || '',
      buyerAddress: snapshot.fullAddress || order.address?.fullAddress || '',
      latitude: Number(snapshot.latitude || order.address?.latitude || 0),
      longitude: Number(snapshot.longitude || order.address?.longitude || 0),
      items,
      subTotal: Number(order.subTotal),
      shippingFee: Number(order.shippingFee),
      discountAmount: 0,
      totalAmount: Number(order.totalAmount),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      cancelReason: ''
    };
  }

  async getOrderDetailById(id: string): Promise<OrderDetailDto> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'address']
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID ${id}`);
    }

    return this.mapToOrderDetailDto(order);
  }

  async updateOrderStatus(id: string, updateDto: UpdateOrderStatusDto): Promise<OrderDetailDto> {
    const order = await this.orderRepository.findOne({ where: { id }, relations: ['items', 'address'] });
    if (!order) throw new NotFoundException(`Không tìm thấy đơn hàng với ID ${id}`);
    order.status = updateDto.status;
    const saved = await this.orderRepository.save(order);
    // Reload với relations đầy đủ sau khi save
    const reloaded = await this.orderRepository.findOne({
      where: { id: saved.id },
      relations: ['items', 'address']
    });
    return this.mapToOrderDetailDto(reloaded!);
  }
}
