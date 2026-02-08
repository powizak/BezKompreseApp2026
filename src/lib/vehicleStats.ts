import type { FuelRecord, ServiceRecord } from '../types';
import { format, parseISO, subMonths } from 'date-fns';
import { cs } from 'date-fns/locale';

export interface MonthlyData {
    month: string;
    monthKey: string;
    fuelCost: number;
    serviceCost: number;
    consumption: number;
    consumptionCount: number;
    distance: number;
}

export interface VehicleStats {
    // Consumption
    avgConsumption: number;
    consumptionTrend: 'up' | 'down' | 'stable';

    // Costs
    costPerKm: number;
    totalFuelCost: number;
    totalServiceCost: number;
    totalCost: number;

    // Distance
    totalDistance: number;

    // Chart Data
    monthlyData: Array<{
        month: string;
        fuel: number;
        service: number;
        consumption: number | null;
    }>;
}

/**
 * Calculate vehicle stats from fuel and service records
 */
export function calculateVehicleStats(
    fuelRecords: FuelRecord[],
    serviceRecords: ServiceRecord[]
): VehicleStats {
    // Initialize monthly buckets for last 12 months
    const monthlyMap = new Map<string, MonthlyData>();
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
        const date = subMonths(now, i);
        const key = format(date, 'yyyy-MM');
        const label = format(date, 'MMM yy', { locale: cs });
        monthlyMap.set(key, {
            month: label,
            monthKey: key,
            fuelCost: 0,
            serviceCost: 0,
            consumption: 0,
            consumptionCount: 0,
            distance: 0
        });
    }

    // Process fuel records
    let totalFuelCost = 0;
    let totalDistance = 0;
    const consumptions: { date: Date; value: number }[] = [];

    fuelRecords.forEach(record => {
        totalFuelCost += record.totalPrice;
        if (record.distanceDelta) {
            totalDistance += record.distanceDelta;
        }

        const monthKey = format(parseISO(record.date), 'yyyy-MM');
        const monthly = monthlyMap.get(monthKey);
        if (monthly) {
            monthly.fuelCost += record.totalPrice;
            if (record.distanceDelta) {
                monthly.distance += record.distanceDelta;
            }
            if (record.consumption !== undefined && record.consumption !== null) {
                monthly.consumption += record.consumption;
                monthly.consumptionCount++;
                consumptions.push({ date: parseISO(record.date), value: record.consumption });
            }
        }
    });

    // Process service records
    let totalServiceCost = 0;
    serviceRecords.forEach(record => {
        totalServiceCost += record.totalCost;

        const monthKey = format(parseISO(record.date), 'yyyy-MM');
        const monthly = monthlyMap.get(monthKey);
        if (monthly) {
            monthly.serviceCost += record.totalCost;
        }
    });

    // Calculate average consumption
    const validConsumptions = fuelRecords.filter(r => r.consumption !== undefined && r.consumption !== null);
    const avgConsumption = validConsumptions.length > 0
        ? validConsumptions.reduce((sum, r) => sum + (r.consumption || 0), 0) / validConsumptions.length
        : 0;

    // Calculate consumption trend (compare last 3 vs previous 3 records)
    let consumptionTrend: 'up' | 'down' | 'stable' = 'stable';
    if (consumptions.length >= 6) {
        consumptions.sort((a, b) => b.date.getTime() - a.date.getTime());
        const recent = consumptions.slice(0, 3).reduce((s, c) => s + c.value, 0) / 3;
        const older = consumptions.slice(3, 6).reduce((s, c) => s + c.value, 0) / 3;
        const diff = recent - older;
        if (diff > 0.3) consumptionTrend = 'up';
        else if (diff < -0.3) consumptionTrend = 'down';
    }

    // Calculate cost per km
    const totalCost = totalFuelCost + totalServiceCost;
    const costPerKm = totalDistance > 0 ? totalCost / totalDistance : 0;

    // Prepare chart data
    const monthlyData = Array.from(monthlyMap.values()).map(m => ({
        month: m.month,
        fuel: Math.round(m.fuelCost),
        service: Math.round(m.serviceCost),
        consumption: m.consumptionCount > 0
            ? Math.round((m.consumption / m.consumptionCount) * 100) / 100
            : null
    }));

    return {
        avgConsumption,
        consumptionTrend,
        costPerKm,
        totalFuelCost,
        totalServiceCost,
        totalCost,
        totalDistance,
        monthlyData
    };
}
