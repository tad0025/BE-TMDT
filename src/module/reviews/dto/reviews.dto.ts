import { IsString, IsNumber, IsArray, ValidateNested, Min, Max, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewItemDto {
  @IsString()
  @IsNotEmpty()
  orderItemId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  comment: string;
}

export class CreateReviewRequestDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReviewItemDto)
  reviews: CreateReviewItemDto[];
}
