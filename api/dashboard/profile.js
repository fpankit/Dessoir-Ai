import { createClerkClient, verifyToken } from "@clerk/backend";
import { createDashboardHandler } from "../../src/server/dashboardProfile.js";

export default createDashboardHandler({ verifyToken, createClerkClient });
