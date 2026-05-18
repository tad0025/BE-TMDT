import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { UsersService } from "./users.service";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ENV_VARS } from "src/constants/env.constants";
import { UsersController } from "./users.controller";
import { Favorite } from "../products/entities/favorite.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Favorite]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>(ENV_VARS.JWT_ACCESS_SECRET),
            }),
        }),
    ],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule { }