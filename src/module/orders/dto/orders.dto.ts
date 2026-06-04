import { IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { EOrderStatus } from '../../checkout/enums/EOrderStatus.enum';
import { EPaymentMethod } from '../../checkout/enums/EPaymentMethod.enum';
import { EPaymentStatus } from '../../checkout/enums/EPaymentStatus.enum';

export class GetOrdersFilterDto {
  @IsOptional()
  @IsEnum(EOrderStatus)
  status?: EOrderStatus;
}

export class UpdateOrderStatusDto {
  @IsNotEmpty()
  @IsEnum(EOrderStatus)
  status: EOrderStatus;

  @IsOptional()
  @IsString()
  note?: string;
}

export class OrderListItemDto {
  id: string;
  createdAt: Date;
  orderStatus: EOrderStatus;
  totalAmount: number;
  totalProductQuantity: number;
  firstProductImageUrl: string;
  buyerName: string;
  buyerAddress: string;
  buyerPhone: string;
  paymentMethod: EPaymentMethod;
  paymentStatus: EPaymentStatus;
}

export class OrderStatusHistoryDto {
  status: EOrderStatus;
  timestamp: Date;
  note?: string;
}

export class OrderDetailProductItemDto {
  productId: string;
  productName: string;
  productImageUrl: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  quantity: number;
  amount: number;
}

export class OrderDetailDto {
  id: string;
  createdAt: Date;
  statusHistory: OrderStatusHistoryDto[];
  orderStatus: EOrderStatus;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  latitude: number;
  longitude: number;
  items: OrderDetailProductItemDto[];
  subTotal: number;
  shippingFee: number;
  discountAmount?: number;
  totalAmount: number;
  paymentMethod: EPaymentMethod;
  paymentStatus: EPaymentStatus;
  cancelReason?: string;
}
