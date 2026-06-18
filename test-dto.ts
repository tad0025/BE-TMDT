import { validateSync } from 'class-validator';
import { PrepareCartCheckoutDto } from './src/module/checkout/dto/prepare-cart-checkout.dto';
import { plainToInstance } from 'class-transformer';

const obj = { prepareTempId: "17911310-fbb9-47b2-9cf6-a225d31735c0" };
const dto = plainToInstance(PrepareCartCheckoutDto, obj);
const errors = validateSync(dto);
console.log(errors);
