export type KpiTrend = 'up' | 'down' | 'stable';

export interface KpiMetric {
    value: number;
    changePercent: number;
    trend: KpiTrend;
}

export interface KpiStats {
    totalRevenue: KpiMetric;
    totalOrders: KpiMetric;
    conversionRate: KpiMetric;
}

export interface RevenueDataPoint {
    label: string;
    revenue: number;
    orders: number;
}

export interface CategoryStat {
    categoryId: string;
    categoryName: string;
    revenuePercent: number;
    revenue: number;
}

export interface TrendingProduct {
    productId: string;
    name: string;
    price: number;
    imageUrl: string;
    trend: KpiTrend;
    salesGrowthPercent: number;
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface ProductPerformanceItem {
    productId: string;
    name: string;
    imageUrl: string;
    categoryName: string;
    totalSales: number;
    stockStatus: StockStatus;
}

export type DashboardPeriod = '7d' | '30d' | '1y';
