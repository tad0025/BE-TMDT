import { Controller, Get, Put, Body, Query, Req, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../../core/security/jwt/jwt-auth.guard";
import { UpdateProfileRequest } from "./dto/users.dto";

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
}