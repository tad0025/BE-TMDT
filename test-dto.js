"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const class_validator_1 = require("class-validator");
const prepare_cart_checkout_dto_1 = require("./src/module/checkout/dto/prepare-cart-checkout.dto");
const class_transformer_1 = require("class-transformer");
const obj = { prepareTempId: "17911310-fbb9-47b2-9cf6-a225d31735c0" };
const dto = (0, class_transformer_1.plainToInstance)(prepare_cart_checkout_dto_1.PrepareCartCheckoutDto, obj);
const errors = (0, class_validator_1.validateSync)(dto);
console.log(errors);
//# sourceMappingURL=test-dto.js.map