import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ENV_VARS } from '../../../constants/env.constants';
import { EPaymentStatus } from '../enums/EPaymentStatus.enum';

@Injectable()
export class MomoService {
  constructor(private configService: ConfigService) {}

  private getRequiredEnv(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) throw new InternalServerErrorException(`Missing env: ${key}`);
    return value;
  }

  async buildMoMoPaymentUrl(orderId: string, totalAmount: number): Promise<string> {
    const partnerCode = this.getRequiredEnv(ENV_VARS.MOMO_PARTNER_CODE);
    const accessKey = this.getRequiredEnv(ENV_VARS.MOMO_ACCESS_KEY);
    const secretKey = this.getRequiredEnv(ENV_VARS.MOMO_SECRET_KEY);
    const endpoint = this.getRequiredEnv(ENV_VARS.MOMO_ENDPOINT);
    const appUrl = this.getRequiredEnv(ENV_VARS.APP_PUBLIC_URL);
    const callbackUrl = this.getRequiredEnv(ENV_VARS.PAYMENT_CALLBACK_BASE_URL);
    const redirectUrl = `${appUrl}/order/checkout/result`;
    const ipnUrl = `${callbackUrl}/checkout/momo/ipn`;

    const amount = Math.round(totalAmount).toString();
    const orderInfo = 'Thanh toan don hang ' + orderId;
    const requestId = orderId;
    const extraData = '';
    const requestType = 'payWithMethod';

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    const requestBody = {
      partnerCode,
      partnerName: 'Test Store',
      storeId: 'store-1',
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: 'vi',
      requestType,
      autoCapture: true,
      extraData,
      orderGroupId: '',
      signature,
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(JSON.stringify(requestBody)).toString(),
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (data.resultCode !== 0) {
        throw new InternalServerErrorException(data.message || 'MoMo payment creation failed');
      }
      return data.payUrl;
    } catch (error) {
      console.error('MoMo Error:', error);
      if (error instanceof InternalServerErrorException) throw error;
      throw new InternalServerErrorException('Error connecting to MoMo');
    }
  }

  verifyIpnSignature(ipnData: any): boolean {
    const accessKey = this.getRequiredEnv(ENV_VARS.MOMO_ACCESS_KEY);
    const secretKey = this.getRequiredEnv(ENV_VARS.MOMO_SECRET_KEY);

    const {
      partnerCode, orderId, requestId, amount, orderInfo, orderType,
      transId, resultCode, message, payType, responseTime, extraData,
      signature: reqSignature,
    } = ipnData;

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    if (signature !== reqSignature) {
      console.log('Invalid signature from MoMo IPN');
      return false;
    }

    return true;
  }
}
