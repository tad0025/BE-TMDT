export class WishlistItem {
    id: string;
    name: string;
    price: number;
    discountPrice: number;
    thumbnail: string;
    isFavorite: boolean;
}

export class WishlistResponse {
    items: WishlistItem[];
};
