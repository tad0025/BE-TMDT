import { Injectable, HttpStatus } from "@nestjs/common";
import { User } from "./entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CustomException } from "src/core/exceptions/custom.exception";
import { ApiResponse } from "src/core/dto/ApiResponse.dto";
import { UpdateProfileRequest } from "./dto/users.dto";
import { WishlistResponse } from "./dto/wishlist.dto";


@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
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

    // async getWishlist(userId: string, page: number, pageSize: number): Promise<ApiResponse<WishlistResponse>> {
    //     const user = await this.userRepository.findOne({ where: { id: userId } });
    //     if (!user) {
    //         throw new CustomException(HttpStatus.NOT_FOUND, 'USER_NOT_FOUND', 'Người dùng không tồn tại');
    //     }
    //     return new ApiResponse(true, 'Lấy danh sách yêu thích thành công', user.wishlist);
    // }
}