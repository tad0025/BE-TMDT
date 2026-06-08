import { Injectable, HttpStatus } from "@nestjs/common";
import { User } from "./entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CustomException } from "src/core/exceptions/custom.exception";
import { ApiResponse } from "src/core/dto/ApiResponse.dto";
import { UpdateProfileRequest } from "./dto/users.dto";
import { WishlistResponse } from "./dto/wishlist.dto";
import { Favorite } from "../products/entities/favorite.entity";
import { Address } from "./entities/address-users.entity";
import { AddressDto, CreateAddressDto, UpdateAddressDto } from "./dto/address.dto";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Favorite)
        private favoriteRepository: Repository<Favorite>,
        @InjectRepository(Address)
        private addressRepository: Repository<Address>,
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

    // ─── Address CRUD ─────────────────────────────────────────────────────────

    private mapToAddressDto(address: Address): AddressDto {
        return {
            id: address.id,
            fullName: address.fullName,
            phoneNumber: address.phoneNumber,
            provinceCode: address.provinceCode,
            provinceName: address.provinceName,
            districtCode: address.districtCode,
            districtName: address.districtName,
            wardCode: address.wardCode,
            wardName: address.wardName,
            street: address.street,
            latitude: address.latitude,
            longitude: address.longitude,
            fullAddress: address.fullAddress,
            isDefault: address.isDefault,
            createdAt: address.createdAt,
        };
    }

    /**
     * Lấy danh sách địa chỉ của user (địa chỉ mặc định lên đầu).
     */
    async getAddresses(userId: string): Promise<ApiResponse<AddressDto[]>> {
        const addresses = await this.addressRepository.find({
            where: { userId },
            order: { isDefault: 'DESC', createdAt: 'ASC' },
        });
        return new ApiResponse(true, 'Lấy danh sách địa chỉ thành công', addresses.map(this.mapToAddressDto));
    }

    /**
     * Lấy chi tiết một địa chỉ theo id.
     */
    async getAddressById(userId: string, addressId: number): Promise<ApiResponse<AddressDto>> {
        const address = await this.addressRepository.findOne({ where: { id: addressId, userId } });
        if (!address) {
            throw new CustomException(HttpStatus.NOT_FOUND, 'ADDRESS_NOT_FOUND', 'Không tìm thấy địa chỉ');
        }
        return new ApiResponse(true, 'Lấy địa chỉ thành công', this.mapToAddressDto(address));
    }

    /**
     * Tạo địa chỉ mới cho user.
     * Nếu isDefault = true → tự động bỏ default của các địa chỉ cũ.
     * Nếu đây là địa chỉ đầu tiên → tự động đặt làm default.
     */
    async createAddress(userId: string, dto: CreateAddressDto): Promise<ApiResponse<AddressDto>> {
        const existingCount = await this.addressRepository.count({ where: { userId } });
        const shouldBeDefault = dto.isDefault === true || existingCount === 0;

        if (shouldBeDefault) {
            // Bỏ default của tất cả địa chỉ hiện có
            await this.addressRepository.update({ userId, isDefault: true }, { isDefault: false });
        }

        const address = this.addressRepository.create({
            ...dto,
            userId,
            latitude: dto.latitude ?? 0,
            longitude: dto.longitude ?? 0,
            isDefault: shouldBeDefault,
        });

        const saved = await this.addressRepository.save(address);
        return new ApiResponse(true, 'Thêm địa chỉ thành công', this.mapToAddressDto(saved));
    }

    /**
     * Cập nhật địa chỉ.
     * Nếu isDefault = true → bỏ default của các địa chỉ khác.
     */
    async updateAddress(userId: string, addressId: number, dto: UpdateAddressDto): Promise<ApiResponse<AddressDto>> {
        const address = await this.addressRepository.findOne({ where: { id: addressId, userId } });
        if (!address) {
            throw new CustomException(HttpStatus.NOT_FOUND, 'ADDRESS_NOT_FOUND', 'Không tìm thấy địa chỉ');
        }

        if (dto.isDefault === true && !address.isDefault) {
            await this.addressRepository.update({ userId, isDefault: true }, { isDefault: false });
        }

        Object.assign(address, dto);
        const saved = await this.addressRepository.save(address);
        return new ApiResponse(true, 'Cập nhật địa chỉ thành công', this.mapToAddressDto(saved));
    }

    /**
     * Xóa địa chỉ.
     * Nếu địa chỉ bị xóa là default → tự động đặt địa chỉ còn lại mới nhất làm default.
     */
    async deleteAddress(userId: string, addressId: number): Promise<ApiResponse<null>> {
        const address = await this.addressRepository.findOne({ where: { id: addressId, userId } });
        if (!address) {
            throw new CustomException(HttpStatus.NOT_FOUND, 'ADDRESS_NOT_FOUND', 'Không tìm thấy địa chỉ');
        }

        const wasDefault = address.isDefault;
        await this.addressRepository.remove(address);

        // Nếu địa chỉ bị xóa là default → promote địa chỉ mới nhất còn lại
        if (wasDefault) {
            const next = await this.addressRepository.findOne({
                where: { userId },
                order: { createdAt: 'ASC' },
            });
            if (next) {
                next.isDefault = true;
                await this.addressRepository.save(next);
            }
        }

        return new ApiResponse(true, 'Xóa địa chỉ thành công', null);
    }

    /**
     * Đặt một địa chỉ làm mặc định.
     */
    async setDefaultAddress(userId: string, addressId: number): Promise<ApiResponse<null>> {
        const address = await this.addressRepository.findOne({ where: { id: addressId, userId } });
        if (!address) {
            throw new CustomException(HttpStatus.NOT_FOUND, 'ADDRESS_NOT_FOUND', 'Không tìm thấy địa chỉ');
        }

        if (address.isDefault) {
            return new ApiResponse(true, 'Địa chỉ này đã là mặc định', null);
        }

        // Bỏ default của tất cả địa chỉ hiện có
        await this.addressRepository.update({ userId, isDefault: true }, { isDefault: false });

        // Set default cho địa chỉ được chọn
        address.isDefault = true;
        await this.addressRepository.save(address);

        return new ApiResponse(true, 'Đã đặt địa chỉ mặc định', null);
    }
}