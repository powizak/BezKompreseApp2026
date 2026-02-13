import { db } from "../config/firebase";
import { collection, getCountFromServer } from "firebase/firestore";

export interface AppStats {
    userCount: number;
    carCount: number;
}

/**
 * Fetches the total number of users and cars from Firestore.
 * Uses aggregation queries (getCountFromServer) which are cost-effective
 * (1 document read per 1000 index entries).
 */
export async function getAppStats(): Promise<AppStats> {
    try {
        const usersColl = collection(db, "users");
        const carsColl = collection(db, "cars");

        const [usersSnapshot, carsSnapshot] = await Promise.all([
            getCountFromServer(usersColl),
            getCountFromServer(carsColl)
        ]);

        return {
            userCount: usersSnapshot.data().count,
            carCount: carsSnapshot.data().count
        };
    } catch (error) {
        console.error("Error fetching app stats:", error);
        // Return default values in case of error
        return {
            userCount: 0,
            carCount: 0
        };
    }
}
