/**
 * Pending: Vừa đặt hàng, chờ xác nhận
 * Preparing: Đã xác nhận, đang chuẩn bị đơn hàng
 * Shipping: Đã giao cho đơn vị vận chuyển
 * Success: Đơn hàng được giao thành công
 * Cancelled: Đơn hàng đã bị hủy
 * Returned: Đơn hàng được yêu cầu hoàn trả
 * 
 */
export enum EOrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  SHIPPING = 'SHIPPING',
  DELIVERED = 'DELIVERED',

  SUCCESS = 'SUCCESS',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
}