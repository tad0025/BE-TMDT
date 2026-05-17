import { Injectable, HttpStatus } from "@nestjs/common";
import { User } from "./entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CustomException } from "src/core/exceptions/custom.exception";
import { ApiResponse } from "src/core/dto/ApiResponse.dto";
import { UpdateProfileRequest } from "./dto/users.dto";
import { WishlistResponse } from "./dto/wishlist.dto";
import { Favorite } from "../products/entities/favorite.entity";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Favorite)
        private favoriteRepository: Repository<Favorite>,
    ) { }

    async me(userId: string): Promise<ApiResponse<User>> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new CustomException(HttpStatus.NOT_FOUND, 'USER_NOT_FOUND', 'Người dùng không tồn tại');
        }
        return new ApiResponse(true, 'Lấy thông tin thành công', user);
    }

    async updateProfile(userId: string, data: UpdateProfileRequest): Promise<ApiResponse<null>> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new CustomException(HttpStatus.NOT_FOUND, 'USER_NOT_FOUND', 'Người dùng không tồn tại');
        }

        if (data.fullName) user.fullName = data.fullName;
        if (data.phone) user.phone = data.phone;
        if (data.gender) user.gender = data.gender;
        if (data.dateOfBirth) user.dateOfBirth = data.dateOfBirth;

        await this.userRepository.save(user);
        return new ApiResponse(true, 'Cập nhật thông tin thành công', null);
    }

    async getWishlist(userId: string, page: number, pageSize: number): Promise<ApiResponse<WishlistResponse>> {
        const pageNumber = page ? parseInt(page.toString(), 10) : 1;
        const sizeNumber = pageSize ? parseInt(pageSize.toString(), 10) : 10;
        const skip = (pageNumber - 1) * sizeNumber;

        const [favorites, totalItems] = await this.favoriteRepository.findAndCount({
            where: { user: { id: userId } },
            relations: ['product'],
            skip,
            take: sizeNumber,
        });

        const items = favorites.map(fav => {
            const product = fav.product;
            const price = product.originalPrice ? Number(product.originalPrice) : Number(product.price);
            const discountPrice = Number(product.price);
            return {
                id: product.id,
                name: product.name,
                price: price,
                discountPrice: discountPrice,
                thumbnail: product.imageUrl || '',
                isFavorite: true,
            };
        });

        const totalPages = Math.ceil(totalItems / sizeNumber);

        const response = new ApiResponse<WishlistResponse>(true, 'Lấy danh sách yêu thích thành công', { items });
        response.pagination = {
            page: pageNumber,
            pageSize: sizeNumber,
            totalItems,
            totalPages,
        };
        return response;
    }
}