import { Controller, Get, Put, Body, Query, Req, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { AuthGuard } from "@nestjs/passport";
import { UpdateProfileRequest } from "./dto/users.dto";

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    async me(@Req() req) {
        return this.usersService.me(req.user.userId);
    }

    @Put('me')
    @UseGuards(AuthGuard('jwt'))
    async updateProfile(@Req() req, @Body() data: UpdateProfileRequest) {
        return this.usersService.updateProfile(req.user.userId, data);
    }

    // @Get('me/wishlist')
    // @UseGuards(AuthGuard('jwt'))
    // async getWishlist(@Req() req, @Query() query: { page: number, pageSize: number }) {
    //     return this.usersService.getWishlist(req.user.sub, query.page, query.pageSize);
    // }
}