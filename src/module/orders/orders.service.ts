import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order } from '../checkout/entities/order.entity';
import { OrderItem } from '../checkout/entities/order-item.entity';
import { OrderListItemDto, GetOrdersFilterDto, UpdateOrderStatusDto, OrderDetailDto, OrderDetailProductItemDto, OrderStatusHistoryDto, UserUpdateOrderStatusDto } from './dto/orders.dto';
import { EOrderStatus } from '../checkout/enums/EOrderStatus.enum';
import { MailService } from '../mails/mail.service';
import { User } from '../users/entities/user.entity';
import { EPaymentMethod } from '../checkout/enums/EPaymentMethod.enum';
import { EPaymentStatus } from '../checkout/enums/EPaymentStatus.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mailService: MailService,
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
        firstProductName: order.items && order.items.length > 0 ? order.items[0].productName : '',
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

    const statusHistory: OrderStatusHistoryDto[] = Array.isArray(order.statusHistory)
      ? order.statusHistory
      : [
        {
          status: order.status,
          timestamp: order.createdAt,
          note: 'Cập nhật trạng thái tự động'
        }
      ];

    const items: OrderDetailProductItemDto[] = (order.items || []).map(item => ({
      orderItemId: item.id,
      productId: item.productId,
      productName: item.productName || 'Sản phẩm',
      productImageUrl: item.productImageUrl || '',
      price: Number(item.price),
      originalPrice: Number(item.originalPrice || item.price),
      discountPercentage: Number(item.discountPercentage || 0),
      quantity: item.quantity,
      amount: Number(item.price) * item.quantity,
      isReviewed: item.isReviewed || false
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
      cancelReason: order.cancelReason || order.returnReason || ''
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

    if (updateDto.note) {
      order.note = updateDto.note;
    }

    const history = Array.isArray(order.statusHistory) ? order.statusHistory : [
      {
        status: EOrderStatus.PENDING,
        timestamp: order.createdAt,
        note: 'Đơn hàng đã được tạo'
      }
    ];

    let defaultNote = 'Admin cập nhật trạng thái';
    switch (updateDto.status) {
      case EOrderStatus.PREPARING:
        defaultNote = 'Shop đang chuẩn bị hàng';
        break;
      case EOrderStatus.SHIPPING:
        defaultNote = 'Đơn hàng đang được giao';
        break;
      case EOrderStatus.DELIVERED:
        defaultNote = 'Đơn hàng đã được giao thành công';
        break;
      case EOrderStatus.SUCCESS:
        defaultNote = 'Đơn hàng đã hoàn tất';
        break;
      case EOrderStatus.CANCELLED:
        defaultNote = 'Đơn hàng đã bị hủy';
        break;
      case EOrderStatus.RETURNED:
        defaultNote = 'Yêu cầu trả hàng/hoàn tiền';
        break;
    }

    history.push({
      status: updateDto.status,
      timestamp: new Date(),
      note: updateDto.note || defaultNote
    });

    order.statusHistory = history;
    if (updateDto.status === EOrderStatus.SUCCESS) {
      order.paymentStatus = EPaymentStatus.PAID;
    }
    const saved = await this.orderRepository.save(order);

    let newStatusStr = '';
    switch (updateDto.status) {
      case EOrderStatus.PREPARING: newStatusStr = 'Đơn hàng đang được chuẩn bị'; break;
      case EOrderStatus.SHIPPING: newStatusStr = 'Đơn hàng đang được giao, vui lòng chú ý điện thoại'; break;
      case EOrderStatus.DELIVERED: newStatusStr = 'Giao hàng thành công'; break;
      case EOrderStatus.SUCCESS: newStatusStr = 'Đơn hàng đã hoàn tất'; break;
      case EOrderStatus.CANCELLED: newStatusStr = 'Đơn hàng của bạn đã bị hủy'; break;
      case EOrderStatus.RETURNED: newStatusStr = 'Yêu cầu trả hàng/hoàn tiền'; break;
      default: newStatusStr = 'Đã cập nhật'; break;
    }
    this.sendStatusUpdateEmail(saved, newStatusStr, updateDto.status === EOrderStatus.CANCELLED ? updateDto.note : undefined);

    /**
     * Send billing if order is COD and delivery success
     */
    if (updateDto.status === EOrderStatus.SUCCESS && saved.paymentMethod === EPaymentMethod.COD) {
      console.log('Send billing email to user');
      this.sendBillingEmail(saved);
    }

    return this.mapToOrderDetailDto(saved);
  }

  /**
   * Send email when update order status
   */
  private async sendStatusUpdateEmail(order: Order, newStatusStr: string, cancelReason?: string) {
    const user = await this.userRepository.findOne({ where: { id: order.userId } });
    if (!user) return;

    let snapshotAddress: any = order.snapshotAddress;
    if (typeof snapshotAddress === 'string') {
      try { snapshotAddress = JSON.parse(snapshotAddress); } catch (e) { }
    }

    const orderItems = order.items?.map(item => ({
      productName: item.productName,
      productImageUrl: item.productImageUrl,
      price: item.price,
      quantity: item.quantity
    })) || [];

    this.mailService.sendOrderStatusUpdateEmail(user.email, {
      orderCode: order.id,
      customerName: snapshotAddress?.fullName || user.fullName,
      newStatus: newStatusStr,
      cancelReason,
      updatedAt: new Date().toLocaleString('vi-VN'),
      orderItems
    });
  }

  private async sendBillingEmail(order: Order) {
    const user = await this.userRepository.findOne({ where: { id: order.userId } });
    if (!user) return;

    let snapshotAddress: any = order.snapshotAddress;
    if (typeof snapshotAddress === 'string') {
      try { snapshotAddress = JSON.parse(snapshotAddress); } catch (e) { }
    }

    const orderItems = order.items?.map(item => ({
      productName: item.productName,
      productImageUrl: item.productImageUrl,
      price: item.price,
      quantity: item.quantity,
      originalPrice: item.originalPrice,
      discountPercentage: item.discountPercentage,
      totalAmount: item.price * item.quantity
    })) || [];

    this.mailService.sendBillingEmail(user.email, {
      orderCode: order.id,
      customerName: snapshotAddress?.fullName || user.fullName,
      customerEmail: user.email,
      orderItems,
      subTotal: order.subTotal,
      shippingFee: order.shippingFee,
      discount: 0,
      total: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: 'Đã thanh toán (Thu hộ)',
      createdAt: order.createdAt.toLocaleString('vi-VN')
    });
  }

  // --- USER TRACKING METHODS ---

  async getTrackingOrders(userId: string, status?: EOrderStatus): Promise<OrderListItemDto[]> {
    const query = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.userId = :userId', { userId });

    if (status) {
      if (status === EOrderStatus.SUCCESS) {
        query.andWhere('order.status IN (:...statuses)', { statuses: [EOrderStatus.SUCCESS, EOrderStatus.DELIVERED] });
      } else if (status === EOrderStatus.CANCELLED) {
        query.andWhere('order.status IN (:...statuses)', { statuses: [EOrderStatus.CANCELLED] });
      } else if (status === EOrderStatus.RETURNED) {
        query.andWhere('order.status IN (:...statuses)', { statuses: [EOrderStatus.RETURNED] });
      } else {
        query.andWhere('order.status = :status', { status });
      }
      query.orderBy('order.createdAt', 'DESC');
    } else {
      // Default tracking (active orders)
      query.andWhere('order.status IN (:...statuses)', {
        statuses: [EOrderStatus.PENDING, EOrderStatus.PREPARING, EOrderStatus.SHIPPING]
      });
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
      let firstProductName = '';

      if (order.items && order.items.length > 0) {
        totalProductQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
        firstProductImageUrl = order.items[0].productImageUrl || '';
        firstProductName = order.items[0].productName || '';
      }

      const snapshot: any = order.snapshotAddress || {};

      return {
        id: order.id,
        createdAt: order.createdAt,
        orderStatus: order.status,
        totalAmount: Number(order.totalAmount),
        totalProductQuantity,
        firstProductImageUrl,
        firstProductName,
        buyerName: snapshot.fullName || '',
        buyerAddress: snapshot.fullAddress || '',
        buyerPhone: snapshot.phoneNumber || '',
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
      };
    });
  }

  async getTrackingStatusCount(userId: string): Promise<any> {
    const statuses = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(order.id)', 'count')
      .where('order.userId = :userId', { userId })
      .groupBy('order.status')
      .getRawMany();

    const result = {
      all: 0,
      pending: 0,
      preparing: 0,
      shipping: 0,
      success: 0,
      cancelled: 0,
    };

    statuses.forEach(item => {
      const statusKey = item.status.toLowerCase();
      const count = Number(item.count);

      if (statusKey === 'pending') result.pending += count;
      if (statusKey === 'preparing') result.preparing += count;
      if (statusKey === 'shipping') result.shipping += count;
      if (statusKey === 'success' || statusKey === 'delivered') result.success += count;
      if (statusKey === 'cancelled' || statusKey === 'returned') result.cancelled += count;
    });

    result.all = result.pending + result.preparing + result.shipping;
    return result;
  }

  async getTrackingOrderDetail(userId: string, id: string): Promise<OrderDetailDto> {
    const order = await this.orderRepository.findOne({
      where: { id, userId },
      relations: ['items', 'address']
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng`);
    }

    return this.mapToOrderDetailDto(order);
  }

  async updateTrackingOrderStatus(userId: string, id: string, updateDto: UserUpdateOrderStatusDto): Promise<OrderDetailDto> {
    const order = await this.orderRepository.findOne({ where: { id, userId }, relations: ['items', 'address'] });
    if (!order) throw new NotFoundException(`Không tìm thấy đơn hàng`);

    if (updateDto.newStatus !== EOrderStatus.CANCELLED && updateDto.newStatus !== EOrderStatus.RETURNED) {
      throw new BadRequestException(`Trạng thái không hợp lệ`);
    }

    order.status = updateDto.newStatus;

    if (updateDto.newStatus === EOrderStatus.CANCELLED) {
      order.cancelReason = updateDto.note || '';
    } else if (updateDto.newStatus === EOrderStatus.RETURNED) {
      order.returnReason = updateDto.note || '';
    }

    const history = Array.isArray(order.statusHistory) ? order.statusHistory : [
      {
        status: EOrderStatus.PENDING,
        timestamp: order.createdAt,
        note: 'Đơn hàng đã được tạo'
      }
    ];

    history.push({
      status: updateDto.newStatus,
      timestamp: new Date(),
      note: updateDto.note || 'Khách hàng cập nhật'
    });

    order.statusHistory = history;
    const saved = await this.orderRepository.save(order);

    let newStatusStr = updateDto.newStatus === EOrderStatus.CANCELLED ? 'Đã bị hủy' : 'Yêu cầu trả hàng/hoàn tiền';
    this.sendStatusUpdateEmail(saved, newStatusStr, updateDto.newStatus === EOrderStatus.CANCELLED ? updateDto.note : undefined);

    return this.mapToOrderDetailDto(saved);
  }
}
