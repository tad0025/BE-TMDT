import { Injectable } from '@nestjs/common';
import { calculateDynamicOptimalBox, ProductInput } from '../../../utils/packing.util';

const from_province_id = 202;
const from_district_id = 3695;
const from_ward_id = 90735;

@Injectable()
export class ShippingService {
  async calcShippingFeeGHN(
    toDistrictId: number,
    toWardCode: string,
    weight: number,
    length: number,
    width: number,
    height: number
  ): Promise<number> {
    try {
      const payload = {
        from_district_id: Number(from_district_id),
        from_ward_code: from_ward_id.toString(),
        to_district_id: Number(toDistrictId),
        to_ward_code: toWardCode.toString(),
        weight: weight,
        length: length,
        width: width,
        height: height,
        source: "5sao"
      };

      const response = await fetch("https://fe-online-gateway.ghn.vn/shiip/public-api/order/calculate-fee", {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        method: "POST",
      });
      const data = await response.json();
      if (data.code === 200 && data.data) {
        return data.data.fee;
      }
      console.warn('GHN returned error or no fee:', data, 'Payload sent:', payload);
      return 30000;
    } catch (error) {
      console.error('GHN Shipping Fee Error:', error);
      return 30000;
    }
  }

  calculateOptimalBox(items: { quantity: number; productId: string }[], productMap: Map<string, any>) {
    let boxLength = 10, boxWidth = 10, boxHeight = 10, boxWeight = 500;
    
    if (!items || items.length === 0) {
      return { boxLength, boxWidth, boxHeight, boxWeight };
    }

    const packingInputs: ProductInput[] = items
      .map(item => {
        const product = productMap.get(item.productId);
        if (!product) return null;
        return {
          id: product.id,
          length: product.dimensions?.[0] || 10,
          width: product.dimensions?.[1] || 10,
          height: product.dimensions?.[2] || 10,
          weight: (product.weight || 0.5) * 1000,
          quantity: item.quantity
        };
      })
      .filter(Boolean) as ProductInput[];

    const packingResult = calculateDynamicOptimalBox(packingInputs, 2);
    
    if (packingResult.success) {
      boxLength = (packingResult as any).dimensions.length;
      boxWidth = (packingResult as any).dimensions.width;
      boxHeight = (packingResult as any).dimensions.height;
      boxWeight = (packingResult as any).totalWeight;
    }

    return { boxLength, boxWidth, boxHeight, boxWeight, packingResult };
  }
}
