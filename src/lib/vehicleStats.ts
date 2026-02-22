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

    // Calculate average consumption using first-full-tank to last-full-tank method.
    // The first full tank is the reference point — we don't know how many km were driven
    // before it, so we exclude its liters from the sum and use its mileage as the baseline.
    const sorted = [...fuelRecords].sort((a, b) => {
        const timeDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (timeDiff !== 0) return timeDiff;
        return (a.mileage || 0) - (b.mileage || 0);
    });
    const fullTanks = sorted.filter(r => r.fullTank);
    let avgConsumption = 0;
    if (fullTanks.length >= 2) {
        const firstFull = fullTanks[0];
        const lastFull = fullTanks[fullTanks.length - 1];
        const kmSpan = lastFull.mileage - firstFull.mileage;
        // Sum liters of all records AFTER the first full tank up to and including the last full tank
        // We use index-based filtering on the sorted array which is safer than date comparisons for same-day records
        const firstFullIdx = sorted.findIndex(r => r.id === firstFull.id);
        const lastFullIdx = sorted.findIndex(r => r.id === lastFull.id);

        const litersAfterFirst = sorted
            .slice(firstFullIdx + 1, lastFullIdx + 1)
            .reduce((sum, r) => sum + r.liters, 0);

        if (kmSpan > 0 && litersAfterFirst > 0) {
            avgConsumption = (litersAfterFirst / kmSpan) * 100;
        }
    }

    // Calculate consumption trend (compare last 3 vs previous 3 records)
    let consumptionTrend: 'up' | 'down' | 'stable' = 'stable';
    if (consumptions.length >= 6) {
        // Sort consumptions by date desc
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
