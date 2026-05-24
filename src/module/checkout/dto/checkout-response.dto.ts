export class AddressResponseDto {
    id: number;
    fullName: string;
    phoneNumber: string;
    provinceCode: string;
    provinceName: string;
    districtCode: string;
    districtName: string;
    wardCode: string;
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
    totalAmount: number;
    invalidItems: InvalidItemResponseDto[];
}