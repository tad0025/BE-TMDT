import { Controller, Get, Post, Put, Delete, Patch, Body, Param, ParseIntPipe, Query, Req, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../../core/security/jwt/jwt-auth.guard";
import { UpdateProfileRequest } from "./dto/users.dto";
import { CreateAddressDto, UpdateAddressDto } from "./dto/address.dto";

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    

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

    

    

    @Get('me/address')
    @UseGuards(JwtAuthGuard)
    async getAddresses(@Req() req) {
        return this.usersService.getAddresses(req.user.id);
    }

    

    @Get('me/address/:id')
    @UseGuards(JwtAuthGuard)
    async getAddressById(@Req() req, @Param('id', ParseIntPipe) id: number) {
        return this.usersService.getAddressById(req.user.id, id);
    }

    

    @Post('me/address')
    @UseGuards(JwtAuthGuard)
    async createAddress(@Req() req, @Body() dto: CreateAddressDto) {
        return this.usersService.createAddress(req.user.id, dto);
    }

    

    @Put('me/address/:id')
    @UseGuards(JwtAuthGuard)
    async updateAddress(@Req() req, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAddressDto) {
        return this.usersService.updateAddress(req.user.id, id, dto);
    }

    

    @Delete('me/address/:id')
    @UseGuards(JwtAuthGuard)
    async deleteAddress(@Req() req, @Param('id', ParseIntPipe) id: number) {
        return this.usersService.deleteAddress(req.user.id, id);
    }

    

    @Patch('me/address/:id/default')
    @UseGuards(JwtAuthGuard)
    async setDefaultAddress(@Req() req, @Param('id', ParseIntPipe) id: number) {
        return this.usersService.setDefaultAddress(req.user.id, id);
    }
}