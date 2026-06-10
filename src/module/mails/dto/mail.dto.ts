export interface OrderStatusMailData {
  orderCode: string;
  customerName: string;
  oldStatus?: string;
  newStatus: string;
  cancelReason?: string;
  updatedAt: string;
  orderItems: any[];
}

export interface BillingMailData {
  orderCode: string;
  customerName: string;
  customerEmail: string;
  orderItems: any[];
  subTotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

export interface OtpMailData {
  generatedOtp: string;
  isRegister: boolean;
}
