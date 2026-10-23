import { verifyToken } from "@clerk/backend";
import { createProxyHandler } from "../../src/server/n8nProxy.js";

export default createProxyHandler({ verifyToken });
