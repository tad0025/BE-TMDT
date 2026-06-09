export class AddressResponseDto {
    id: number;
    fullName: string;
    phoneNumber: string;
    provinceCode: number;
    provinceName: string;
    districtCode: number;
    districtName: string;
    wardCode: number;
    wardName: string;
    street: string;
    latitude: number;
    longitude: number;
    fullAddress: string;
}
export class CheckoutItemResponseDto {
    product: {
        id: string;
        name: string;
        imageUrl: string;
        price: number;
        originalPrice: number;
        discountPercentage: number;
    };
    quantity: number;
    amount: number;
}
export class InvalidItemResponseDto {
    productId: string;
    reason: string;
}
export class PrepareCheckoutResponseDto {
    address: AddressResponseDto | null;
    items: CheckoutItemResponseDto[];
    subTotal: number;
    shippingFee: number;
    discountAmount: number;
    shippingDiscountAmount: number;
    appliedVouchers: { voucherCode: string; voucherType: string; discountValue: number }[];
    totalAmount: number;
    invalidItems: InvalidItemResponseDto[];
}