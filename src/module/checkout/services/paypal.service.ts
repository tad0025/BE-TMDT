import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENV_VARS } from '../../../constants/env.constants';

@Injectable()
export class PaypalService {
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    const environment = this.configService.get<string>(ENV_VARS.PAYPAL_ENVIRONMENT) || 'sandbox';
    this.baseUrl = environment === 'sandbox' 
      ? 'https://api-m.sandbox.paypal.com' 
      : 'https://api-m.paypal.com';
  }

  private getRequiredEnv(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) throw new InternalServerErrorException(`Missing env: ${key}`);
    return value;
  }

  private async getAccessToken(): Promise<string> {
    const clientId = this.getRequiredEnv(ENV_VARS.PAYPAL_CLIENT_ID);
    const clientSecret = this.getRequiredEnv(ENV_VARS.PAYPAL_CLIENT_SECRET);
    
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('PayPal getAccessToken Error:', data);
      throw new InternalServerErrorException('Cannot connect to PayPal');
    }
    
    return data.access_token;
  }

  async buildPayPalPaymentUrl(orderId: string, totalAmountVND: number): Promise<string> {
    const accessToken = await this.getAccessToken();
    const returnUrl = this.getRequiredEnv(ENV_VARS.PAYPAL_RETURN_URL);
    const cancelUrl = this.getRequiredEnv(ENV_VARS.PAYPAL_CANCEL_URL);

    // Convert VND to USD (approximate rate 1 USD = 25000 VND for demo purposes)
    const amountUSD = (totalAmountVND / 25000).toFixed(2);

    const requestBody = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: orderId,
          amount: {
            currency_code: 'USD',
            value: amountUSD
          }
        }
      ],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
            brand_name: 'Test Store',
            locale: 'en-US',
            landing_page: 'LOGIN',
            user_action: 'PAY_NOW',
            return_url: `${returnUrl}?orderId=${orderId}`,
            cancel_url: `${cancelUrl}?orderId=${orderId}`
          }
        }
      }
    };

    const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('PayPal createOrder Error:', data);
      throw new InternalServerErrorException('PayPal payment creation failed');
    }

    // Return the approve link
    const approveLink = data.links.find((link: any) => link.rel === 'payer-action');
    if (approveLink) {
      return approveLink.href;
    }
    throw new InternalServerErrorException('PayPal approve link not found');
  }

  async captureOrder(token: string): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    
    const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${token}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('PayPal captureOrder Error:', data);
      return false;
    }
    
    return data.status === 'COMPLETED';
  }
}
