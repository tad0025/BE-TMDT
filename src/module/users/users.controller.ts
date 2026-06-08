import { Controller, Get, Post, Put, Delete, Patch, Body, Param, ParseIntPipe, Query, Req, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../../core/security/jwt/jwt-auth.guard";
import { UpdateProfileRequest } from "./dto/users.dto";
import { CreateAddressDto, UpdateAddressDto } from "./dto/address.dto";

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // ─── Profile ─────────────────────────────────────────────────────────────────

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async me(@Req() req) {
        return this.usersService.me(req.user.id);
    }

    @Put('me')
    @UseGuards(JwtAuthGuard)
    async updateProfile(@Req() req, @Body() data: UpdateProfileRequest) {
        return this.usersService.updateProfile(req.user.id, data);
    }

    @Get('me/wishlist')
    @UseGuards(JwtAuthGuard)
    async getWishlist(@Req() req, @Query() query: { page: number, pageSize: number }) {
        return this.usersService.getWishlist(req.user.id, query.page, query.pageSize);
    }

    // ─── Address ─────────────────────────────────────────────────────────────────

    /**
     * GET /users/me/address
     * Lấy danh sách địa chỉ (địa chỉ mặc định lên đầu).
     */
    @Get('me/address')
    @UseGuards(JwtAuthGuard)
    async getAddresses(@Req() req) {
        return this.usersService.getAddresses(req.user.id);
    }

    /**
     * GET /users/me/address/:id
     * Lấy chi tiết một địa chỉ.
     */
    @Get('me/address/:id')
    @UseGuards(JwtAuthGuard)
    async getAddressById(@Req() req, @Param('id', ParseIntPipe) id: number) {
        return this.usersService.getAddressById(req.user.id, id);
    }

    /**
     * POST /users/me/address
     * Tạo địa chỉ mới. Nếu là địa chỉ đầu tiên hoặc isDefault=true → tự set default.
     */
    @Post('me/address')
    @UseGuards(JwtAuthGuard)
    async createAddress(@Req() req, @Body() dto: CreateAddressDto) {
        return this.usersService.createAddress(req.user.id, dto);
    }

    /**
     * PUT /users/me/address/:id
     * Cập nhật địa chỉ. Nếu isDefault=true → bỏ default của các địa chỉ khác.
     */
    @Put('me/address/:id')
    @UseGuards(JwtAuthGuard)
    async updateAddress(@Req() req, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAddressDto) {
        return this.usersService.updateAddress(req.user.id, id, dto);
    }

    /**
     * DELETE /users/me/address/:id
     * Xóa địa chỉ. Nếu là địa chỉ default → tự promote địa chỉ cũ nhất còn lại.
     */
    @Delete('me/address/:id')
    @UseGuards(JwtAuthGuard)
    async deleteAddress(@Req() req, @Param('id', ParseIntPipe) id: number) {
        return this.usersService.deleteAddress(req.user.id, id);
    }

    /**
     * PATCH /users/me/address/:id/default
     * Đặt địa chỉ làm mặc định.
     */
    @Patch('me/address/:id/default')
    @UseGuards(JwtAuthGuard)
    async setDefaultAddress(@Req() req, @Param('id', ParseIntPipe) id: number) {
        return this.usersService.setDefaultAddress(req.user.id, id);
    }
}