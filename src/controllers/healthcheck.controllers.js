import mongoose from "mongoose";
import os from "os";
import process from "process";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const healthSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
});
const HealthCheck = mongoose.models.HealthCheck || mongoose.model("HealthCheck", healthSchema);

const healthcheck = asyncHandler(async (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatusMap = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
    };
    let dbPing = false;
    try {
        await mongoose.connection.db.admin().ping();
        const doc = await HealthCheck.create({});
        dbPing = !!doc;
        await HealthCheck.deleteOne({ _id: doc._id });
    } catch (err) {
        console.error("Healthcheck DB test failed:", err.message);
        dbPing = false;
    }
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage(); 
    const loadAverage = os.loadavg();
    const platform = os.platform();
    const cpus = os.cpus().length;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                apiStatus: "OK",
                dbStatus: dbStatusMap[dbState],
                dbPing: dbPing ? "successful" : "failed",
                uptimeInSeconds: Math.floor(uptime),
                memoryUsage,
                loadAverage,
                platform,
                cpus,
            },
            "API is healthy and running"
        )
    );
});
/*
    simpler version:

    const healthcheck = asyncHandler(async (req, res) => {
        return res.status(200).json(
            new ApiResponse(200, { status: "OK" }, "API is running")
        );
    });

*/
export { healthcheck };
