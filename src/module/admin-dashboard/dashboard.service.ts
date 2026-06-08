import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../checkout/entities/order.entity';
import { OrderItem } from '../checkout/entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { EOrderStatus } from '../checkout/enums/EOrderStatus.enum';
import {
    DashboardPeriod,
    KpiStats,
    KpiMetric,
    KpiTrend,
    RevenueDataPoint,
    CategoryStat,
    TrendingProduct,
    ProductPerformanceItem,
    StockStatus,
} from './dto/dashboard.dto';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,
        @InjectRepository(OrderItem)
        private readonly orderItemRepo: Repository<OrderItem>,
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
        @InjectRepository(Category)
        private readonly categoryRepo: Repository<Category>,
    ) { }
    private getPeriodRange(period: DashboardPeriod): { currentStart: Date; previousStart: Date } {
        const now = new Date();
        let days: number;

        switch (period) {
            case '7d':
                days = 7;
                break;
            case '30d':
                days = 30;
                break;
            case '1y':
                days = 365;
                break;
            default:
                days = 30;
        }

        const currentStart = new Date(now);
        currentStart.setDate(currentStart.getDate() - days);

        const previousStart = new Date(currentStart);
        previousStart.setDate(previousStart.getDate() - days);

        return { currentStart, previousStart };
    }

    /** Tính trend dựa trên giá trị hiện tại và trước đó */
    private calcTrend(current: number, previous: number): { changePercent: number; trend: KpiTrend } {
        if (previous === 0) {
            return { changePercent: current > 0 ? 100 : 0, trend: current > 0 ? 'up' : 'stable' };
        }
        const changePercent = Math.round(((current - previous) / previous) * 100 * 10) / 10;
        let trend: KpiTrend = 'stable';
        if (changePercent > 0) trend = 'up';
        else if (changePercent < 0) trend = 'down';
        return { changePercent, trend };
    }

    async getKpiStats(period: DashboardPeriod): Promise<KpiStats> {
        const { currentStart, previousStart } = this.getPeriodRange(period);
        const now = new Date();

        const currentOrders = await this.orderRepo
            .createQueryBuilder('o')
            .where('o.status = :status', { status: EOrderStatus.SUCCESS })
            .andWhere('o.createdAt >= :start', { start: currentStart })
            .andWhere('o.createdAt <= :end', { end: now })
            .getMany();

        const currentRevenue = currentOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
        const currentOrderCount = currentOrders.length;

        const previousOrders = await this.orderRepo
            .createQueryBuilder('o')
            .where('o.status = :status', { status: EOrderStatus.SUCCESS })
            .andWhere('o.createdAt >= :start', { start: previousStart })
            .andWhere('o.createdAt < :end', { end: currentStart })
            .getMany();

        const previousRevenue = previousOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
        const previousOrderCount = previousOrders.length;


        const totalCurrentOrders = await this.orderRepo
            .createQueryBuilder('o')
            .where('o.createdAt >= :start', { start: currentStart })
            .andWhere('o.createdAt <= :end', { end: now })
            .getCount();

        const totalPreviousOrders = await this.orderRepo
            .createQueryBuilder('o')
            .where('o.createdAt >= :start', { start: previousStart })
            .andWhere('o.createdAt < :end', { end: currentStart })
            .getCount();

        const currentConversionRate = totalCurrentOrders > 0
            ? Math.round((currentOrderCount / totalCurrentOrders) * 100 * 10) / 10
            : 0;

        const previousPaidCount = previousOrders.length;
        const previousConversionRate = totalPreviousOrders > 0
            ? Math.round((previousPaidCount / totalPreviousOrders) * 100 * 10) / 10
            : 0;

        const revenueTrend = this.calcTrend(currentRevenue, previousRevenue);
        const orderTrend = this.calcTrend(currentOrderCount, previousOrderCount);
        const conversionTrend = this.calcTrend(currentConversionRate, previousConversionRate);

        const totalRevenue: KpiMetric = {
            value: currentRevenue,
            changePercent: revenueTrend.changePercent,
            trend: revenueTrend.trend,
        };

        const totalOrders: KpiMetric = {
            value: currentOrderCount,
            changePercent: orderTrend.changePercent,
            trend: orderTrend.trend,
        };

        const conversionRate: KpiMetric = {
            value: currentConversionRate,
            changePercent: conversionTrend.changePercent,
            trend: conversionTrend.trend,
        };

        return { totalRevenue, totalOrders, conversionRate };
    }


    async getRevenueChart(period: DashboardPeriod): Promise<RevenueDataPoint[]> {
        const { currentStart } = this.getPeriodRange(period);
        const now = new Date();

        let groupFormat: string;
        let labelFormat: 'day' | 'month';

        if (period === '1y') {
            groupFormat = '%Y-%m';
            labelFormat = 'month';
        } else {
            groupFormat = '%Y-%m-%d';
            labelFormat = 'day';
        }

        const rows: { label: string; revenue: string; orders: string }[] = await this.orderRepo
            .createQueryBuilder('o')
            .select(`DATE_FORMAT(o.createdAt, '${groupFormat}')`, 'label')
            .addSelect('COALESCE(SUM(o.totalAmount), 0)', 'revenue')
            .addSelect('COUNT(o.id)', 'orders')
            .where('o.status = :status', { status: EOrderStatus.SUCCESS })
            .andWhere('o.createdAt >= :start', { start: currentStart })
            .andWhere('o.createdAt <= :end', { end: now })
            .groupBy('label')
            .orderBy('label', 'ASC')
            .getRawMany();

        return rows.map((r) => ({
            label: r.label,
            revenue: Number(r.revenue),
            orders: Number(r.orders),
        }));
    }

    async getTopCategories(period: DashboardPeriod, limit = 5): Promise<CategoryStat[]> {
        const { currentStart } = this.getPeriodRange(period);
        const now = new Date();

        const totalRevenueResult = await this.orderRepo
            .createQueryBuilder('o')
            .select('COALESCE(SUM(o.totalAmount), 0)', 'total')
            .where('o.status = :status', { status: EOrderStatus.SUCCESS })
            .andWhere('o.createdAt >= :start', { start: currentStart })
            .andWhere('o.createdAt <= :end', { end: now })
            .getRawOne();

        const grandTotal = Number(totalRevenueResult?.total ?? 0);

        const rows: { categoryId: string; categoryName: string; revenue: string }[] = await this.orderItemRepo
            .createQueryBuilder('oi')
            .innerJoin('oi.order', 'o')
            .innerJoin('oi.product', 'p')
            .innerJoin('p.category', 'c')
            .select('c.id', 'categoryId')
            .addSelect('c.name', 'categoryName')
            .addSelect('COALESCE(SUM(oi.price * oi.quantity), 0)', 'revenue')
            .where('o.status = :status', { status: EOrderStatus.SUCCESS })
            .andWhere('o.createdAt >= :start', { start: currentStart })
            .andWhere('o.createdAt <= :end', { end: now })
            .groupBy('c.id')
            .addGroupBy('c.name')
            .orderBy('revenue', 'DESC')
            .limit(limit)
            .getRawMany();

        return rows.map((r) => ({
            categoryId: r.categoryId,
            categoryName: r.categoryName,
            revenue: Number(r.revenue),
            revenuePercent: grandTotal > 0 ? Math.round((Number(r.revenue) / grandTotal) * 100 * 10) / 10 : 0,
        }));
    }

    async getTrendingProducts(limit = 8): Promise<TrendingProduct[]> {
        const now = new Date();
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const twoWeeksAgo = new Date(now);
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        const currentWeek: { productId: string; totalQty: string }[] = await this.orderItemRepo
            .createQueryBuilder('oi')
            .innerJoin('oi.order', 'o')
            .select('oi.productId', 'productId')
            .addSelect('COALESCE(SUM(oi.quantity), 0)', 'totalQty')
            .where('o.status = :status', { status: EOrderStatus.SUCCESS })
            .andWhere('o.createdAt >= :start', { start: oneWeekAgo })
            .andWhere('o.createdAt <= :end', { end: now })
            .groupBy('oi.productId')
            .getRawMany();

        const prevWeek: { productId: string; totalQty: string }[] = await this.orderItemRepo
            .createQueryBuilder('oi')
            .innerJoin('oi.order', 'o')
            .select('oi.productId', 'productId')
            .addSelect('COALESCE(SUM(oi.quantity), 0)', 'totalQty')
            .where('o.status = :status', { status: EOrderStatus.SUCCESS })
            .andWhere('o.createdAt >= :start', { start: twoWeeksAgo })
            .andWhere('o.createdAt < :end', { end: oneWeekAgo })
            .groupBy('oi.productId')
            .getRawMany();

        const prevMap = new Map(prevWeek.map((r) => [r.productId, Number(r.totalQty)]));

        const growth = currentWeek
            .filter((r) => r.productId !== null)
            .map((r) => {
                const cur = Number(r.totalQty);
                const prev = prevMap.get(r.productId) ?? 0;
                const { changePercent, trend } = this.calcTrend(cur, prev);
                return { productId: r.productId, salesGrowthPercent: changePercent, trend };
            })
            .sort((a, b) => b.salesGrowthPercent - a.salesGrowthPercent)
            .slice(0, limit);

        if (growth.length === 0) return [];

        const productIds = growth.map((g) => g.productId);
        const products = await this.productRepo
            .createQueryBuilder('p')
            .whereInIds(productIds)
            .getMany();

        const productMap = new Map(products.map((p) => [p.id, p]));

        return growth
            .map((g) => {
                const p = productMap.get(g.productId);
                if (!p) return null;
                return {
                    productId: p.id,
                    name: p.name,
                    price: Number(p.price),
                    imageUrl: p.imageUrl ?? '',
                    trend: g.trend,
                    salesGrowthPercent: g.salesGrowthPercent,
                } as TrendingProduct;
            })
            .filter(Boolean) as TrendingProduct[];
    }

    async getProductPerformance(
        page: number,
        pageSize: number,
        period: DashboardPeriod,
    ): Promise<{ items: ProductPerformanceItem[]; totalItems: number; totalPages: number }> {
        const { currentStart } = this.getPeriodRange(period);
        const now = new Date();

        const qb = this.orderItemRepo
            .createQueryBuilder('oi')
            .innerJoin('oi.order', 'o')
            .innerJoin('oi.product', 'p')
            .leftJoin('p.category', 'c')
            .select('p.id', 'productId')
            .addSelect('p.name', 'name')
            .addSelect('p.imageUrl', 'imageUrl')
            .addSelect('COALESCE(c.name, :uncategorized)', 'categoryName')
            .addSelect('COALESCE(SUM(oi.quantity), 0)', 'totalSales')
            .addSelect('p.stock', 'stock')
            .where('o.status = :status', { status: EOrderStatus.SUCCESS })
            .andWhere('o.createdAt >= :start', { start: currentStart })
            .andWhere('o.createdAt <= :end', { end: now })
            .setParameter('uncategorized', 'Chưa phân loại')
            .groupBy('p.id')
            .addGroupBy('p.name')
            .addGroupBy('p.imageUrl')
            .addGroupBy('c.name')
            .addGroupBy('p.stock')
            .orderBy('totalSales', 'DESC');

        const countQb = this.orderItemRepo
            .createQueryBuilder('oi')
            .innerJoin('oi.order', 'o')
            .innerJoin('oi.product', 'p')
            .select('COUNT(DISTINCT p.id)', 'cnt')
            .where('o.status = :status', { status: EOrderStatus.SUCCESS })
            .andWhere('o.createdAt >= :start', { start: currentStart })
            .andWhere('o.createdAt <= :end', { end: now });

        const countResult = await countQb.getRawOne();
        const totalItems = Number(countResult?.cnt ?? 0);
        const totalPages = Math.ceil(totalItems / pageSize);

        const offset = (page - 1) * pageSize;
        const rows: {
            productId: string;
            name: string;
            imageUrl: string;
            categoryName: string;
            totalSales: string;
            stock: number;
        }[] = await qb.offset(offset).limit(pageSize).getRawMany();

        const items: ProductPerformanceItem[] = rows.map((r) => {
            const stock = Number(r.stock);
            let stockStatus: StockStatus = 'in_stock';
            if (stock <= 0) stockStatus = 'out_of_stock';
            else if (stock <= 10) stockStatus = 'low_stock';

            return {
                productId: r.productId,
                name: r.name,
                imageUrl: r.imageUrl ?? '',
                categoryName: r.categoryName,
                totalSales: Number(r.totalSales),
                stockStatus,
            };
        });

        return { items, totalItems, totalPages };
    }
}