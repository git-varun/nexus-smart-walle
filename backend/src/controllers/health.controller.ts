import mongoose from "mongoose";
import os from "node:os";
import {createServiceLogger} from "../utils";
import {Request, Response} from "express";

const logger = createServiceLogger('HealthController');

export const health = (req: Request, res: Response) => {
    try {
        logger.info("Health Controller");
        // Database check
        const dbState = mongoose.connection.readyState;
        const dbStatus = dbState === 1 ? "up" : "down";

        // System info
        const uptime = process.uptime();
        const load = os.loadavg(); // system load averages
        const memoryUsage = process.memoryUsage();

        return res.json({
            success: dbStatus === "up",
            timestamp: new Date().toISOString(),
            database: {
                status: dbStatus,
                state: dbState,
            },
            system: {
                uptime,
                load,
                memory: {
                    rss: memoryUsage.rss,
                    heapUsed: memoryUsage.heapUsed,
                    heapTotal: memoryUsage.heapTotal,
                },
            },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            database: {status: "unknown"},
            system: {},
            error: (err as Error).message,
        });
    }
};