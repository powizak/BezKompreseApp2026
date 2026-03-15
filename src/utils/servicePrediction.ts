import { differenceInDays, differenceInCalendarDays, addDays, isBefore } from 'date-fns';
import type { FuelRecord, ServiceRecord, Car } from '../types';

export interface ServicePrediction {
    recordId: string;
    predictedDate: Date | null;
    daysRemaining: number | null;
    mileageRemaining: number | null;
    isOverdue: boolean;
    triggerType: 'mileage' | 'date' | 'both' | 'none';
    confidence: 'high' | 'medium' | 'low'; // Based on available data
}

/**
 * Calculates the average daily mileage based on fuel records.
 * Uses an "intelligent average" incorporating both the overall average
 * and the average from the last 3 months to adapt to changing driver habits.
 */
export function calculateAverageDailyMileage(fuelRecords: FuelRecord[]): { averageDaily: number, confidence: 'high' | 'medium' | 'low' } {
    if (!fuelRecords || fuelRecords.length < 2) {
        return { averageDaily: 40, confidence: 'low' }; // Safe fallback, approx 14k km/year
    }

    // Sort by date ascending
    const sorted = [...fuelRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const firstRecord = sorted[0];
    const lastRecord = sorted[sorted.length - 1];

    const overallDays = differenceInDays(new Date(lastRecord.date), new Date(firstRecord.date));
    const overallDistance = lastRecord.mileage - firstRecord.mileage;
    const overallAvg = overallDays > 0 ? overallDistance / overallDays : 40;

    // Last 3 months calculation
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentRecords = sorted.filter(r => new Date(r.date) >= threeMonthsAgo);

    let recentAvg = overallAvg;
    let hasValidRecent = false;

    if (recentRecords.length >= 2) {
        const rFirst = recentRecords[0];
        const rLast = recentRecords[recentRecords.length - 1];
        const rDays = differenceInDays(new Date(rLast.date), new Date(rFirst.date));
        const rDistance = rLast.mileage - rFirst.mileage;

        // We only consider recent average valid if there's a meaningful timespan (e.g. > 14 days)
        if (rDays > 14) {
            recentAvg = rDistance / rDays;
            hasValidRecent = true;
        }
    }

    // Intelligent average: 60% recent, 40% overall (if recent is valid)
    const finalAvg = hasValidRecent ? (recentAvg * 0.6 + overallAvg * 0.4) : overallAvg;

    const confidence = hasValidRecent ? 'high' : (overallDays > 30 ? 'medium' : 'low');

    // Guard against extreme values or negative values
    return {
        averageDaily: Math.max(1, Math.min(finalAvg, 500)),
        confidence
    };
}

/**
 * Analyzes upcoming services and predicts when they will occur
 * based on both mileage limits (using intelligent daily average) and hard date limits.
 * Returns whatever limit is reached first.
 */
export function analyzeUpcomingServices(
    car: Car,
    serviceRecords: ServiceRecord[],
    fuelRecords: FuelRecord[]
): ServicePrediction[] {
    const currentMileage = car.currentMileage || 0;
    const { averageDaily, confidence } = calculateAverageDailyMileage(fuelRecords);
    const now = new Date();

    const predictions: ServicePrediction[] = [];

    for (const record of serviceRecords) {
        if (!record.nextServiceMileage && !record.nextServiceDate) continue;

        let dateFromMileage: Date | null = null;
        let daysFromMileage: number | null = null;
        let mileageRemaining: number | null = null;

        if (record.nextServiceMileage) {
            mileageRemaining = record.nextServiceMileage - currentMileage;
            daysFromMileage = Math.round(mileageRemaining / averageDaily);
            dateFromMileage = addDays(now, daysFromMileage);
        }

        let dateFromTime: Date | null = null;
        let daysFromTime: number | null = null;

        if (record.nextServiceDate) {
            dateFromTime = new Date(record.nextServiceDate);
            daysFromTime = differenceInCalendarDays(dateFromTime, now);
        }

        let predictedDate: Date | null = null;
        let finalDays: number | null = null;
        let triggerType: 'mileage' | 'date' | 'both' | 'none' = 'none';
        let isOverdue = false;

        if (dateFromMileage && dateFromTime) {
            // Determine which happens first
            if (isBefore(dateFromMileage, dateFromTime)) {
                predictedDate = dateFromMileage;
                finalDays = daysFromMileage;
                triggerType = 'mileage';
            } else {
                predictedDate = dateFromTime;
                finalDays = daysFromTime;
                triggerType = 'date';
            }

            // If both are within 30 days of each other, call it 'both'
            if (daysFromMileage !== null && daysFromTime !== null && Math.abs(daysFromMileage - daysFromTime) <= 30) {
                triggerType = 'both';
            }
        } else if (dateFromMileage) {
            predictedDate = dateFromMileage;
            finalDays = daysFromMileage;
            triggerType = 'mileage';
        } else if (dateFromTime) {
            predictedDate = dateFromTime;
            finalDays = daysFromTime;
            triggerType = 'date';
        }

        if (finalDays !== null && finalDays < 0) {
            isOverdue = true;
        }

        predictions.push({
            recordId: record.id,
            predictedDate,
            daysRemaining: finalDays !== null ? Math.max(finalDays, 0) : null,
            mileageRemaining,
            isOverdue,
            triggerType,
            confidence
        });
    }

    return predictions;
}
