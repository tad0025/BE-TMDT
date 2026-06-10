import * as bp3d from 'bp3d';

const { Item, Bin, Packer } = bp3d;

export interface ProductInput {
    id: string;
    length: number;
    width: number;
    height: number;
    weight: number;
    quantity: number;
}

export function calculateDynamicOptimalBox(products: ProductInput[], paddingCm = 2) {
    let totalVolume = 0;
    let minLength = 0, minWidth = 0, minHeight = 0;
    let totalWeight = 0;

    products.forEach(p => {
        const l = p.length + paddingCm * 2;
        const w = p.width + paddingCm * 2;
        const h = p.height + paddingCm * 2;

        totalVolume += (w * h * l) * p.quantity;
        totalWeight += p.weight * p.quantity;

        minLength = Math.max(minLength, l);
        minWidth = Math.max(minWidth, w);
        minHeight = Math.max(minHeight, h);
    });

    const ratios = [
        [1, 1, 1],
        [2, 1, 1], [1, 2, 1], [1, 1, 2],
        [3, 1, 1], [1, 3, 1], [1, 1, 3],
        [2, 2, 1], [2, 1, 2], [1, 2, 2],
        [minLength || 1, minWidth || 1, minHeight || 1]
    ];

    let currentMultiplier = 1.1;
    let optimalBox: any = null;
    let minActualVolume = Infinity; 
    const totalItemsToPack = products.reduce((acc, p) => acc + p.quantity, 0);

    for (let attempt = 0; attempt < 20; attempt++) {
        const targetVolume = totalVolume * currentMultiplier;
        let foundInThisAttempt = false;

        for (const ratio of ratios) {
            const [rl, rw, rh] = ratio;
            
            const x = Math.cbrt(targetVolume / (rl * rw * rh));

            const boxL = Math.max(minLength, x * rl);
            const boxW = Math.max(minWidth, x * rw);
            const boxH = Math.max(minHeight, x * rh);
            
            const actualVolume = boxW * boxH * boxL;

            if (actualVolume >= minActualVolume) continue;

            const packer = new Packer();
            packer.addBin(new Bin(`Virtual_Bin`, boxW, boxH, boxL, 999999));
            
            products.forEach(p => {
                const l = p.length + paddingCm * 2;
                const w = p.width + paddingCm * 2;
                const h = p.height + paddingCm * 2;
                for (let i = 0; i < p.quantity; i++) {
                    packer.addItem(new Item(p.id, w, h, l, p.weight));
                }
            });

            packer.pack();
            const bin = packer.bins[0];

            if (bin && bin.items.length === totalItemsToPack) {
                minActualVolume = actualVolume;
                optimalBox = {
                    success: true,
                    dimensions: { 
                        length: Math.ceil(boxL), 
                        width: Math.ceil(boxW), 
                        height: Math.ceil(boxH) 
                    },
                    totalWeight: totalWeight,
                    efficiency: ((totalVolume / actualVolume) * 100).toFixed(2) + '%'
                };
                foundInThisAttempt = true;
            }
        }

        if (foundInThisAttempt) break;
        currentMultiplier += 0.15;
    }

    if (!optimalBox) return { success: false, message: 'Kiện hàng quá dị dạng hoặc cồng kềnh, cần tách đơn.' };
    return optimalBox;
}
