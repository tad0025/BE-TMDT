import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ENV_VARS } from '../../../constants/env.constants';

@Injectable()
export class VnpayService {
  constructor(private configService: ConfigService) {}

  private getRequiredEnv(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) throw new InternalServerErrorException(`Missing env: ${key}`);
    return value;
  }

  private sortObject(obj: any) {
    const sorted: any = {};
    const str: string[] = [];
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (let key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
  }

  buildVnpayPaymentUrl(orderId: string, totalAmount: number, ipAddr: string): string {
    const tmnCode = this.getRequiredEnv(ENV_VARS.VNP_TMN_CODE);
    const secretKey = this.getRequiredEnv(ENV_VARS.VNP_HASH_SECRET);
    const vnpUrl = this.getRequiredEnv(ENV_VARS.VNP_URL);
    const appUrl = this.getRequiredEnv(ENV_VARS.APP_PUBLIC_URL);
    const callbackUrl = this.getRequiredEnv(ENV_VARS.PAYMENT_CALLBACK_BASE_URL);
    const returnUrl = `${appUrl}/order/checkout/result`;
    const ipnUrl = `${callbackUrl}/checkout/vnpay/ipn`;

    const date = new Date();
    
    // Format: yyyyMMddHHmmss
    const createDate = date.getFullYear().toString() +
      String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0') +
      String(date.getHours()).padStart(2, '0') +
      String(date.getMinutes()).padStart(2, '0') +
      String(date.getSeconds()).padStart(2, '0');

    // Expected amount in VND * 100
    const amount = Math.round(totalAmount * 100);

    const vnp_Params: any = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: 'Thanh toan don hang ' + orderId,
      vnp_OrderType: 'other',
      vnp_Amount: amount,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr || '127.0.0.1',
      vnp_CreateDate: createDate,
    };

    const sortedParams = this.sortObject(vnp_Params);
    
    const signData = Object.keys(sortedParams)
      .map(key => `${key}=${sortedParams[key]}`)
      .join('&');
      
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    
    sortedParams['vnp_SecureHash'] = signed;
    
    const finalQueryString = Object.keys(sortedParams)
      .map(key => `${key}=${sortedParams[key]}`)
      .join('&');

    return `${vnpUrl}?${finalQueryString}`;
  }

  verifyIpnSignature(query: any): boolean {
    const secretKey = this.getRequiredEnv(ENV_VARS.VNP_HASH_SECRET);

    const vnp_Params = { ...query };
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const sortedParams = this.sortObject(vnp_Params);
    
    const signData = Object.keys(sortedParams)
      .map(key => `${key}=${sortedParams[key]}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash !== signed) {
      console.log('Invalid signature from VNPay IPN');
      return false;
    }

    return true;
  }
}
