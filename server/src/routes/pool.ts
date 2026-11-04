import type { PoolInfo } from "@lantern/shared";
import type { FastifyInstance } from "fastify";
import type { Pool } from "../pool/pool.js";

/**
 *   GET /v1/pool     how many titles the pool holds, by kind, and when they were imported
 */
export function registerPoolRoutes(app: FastifyInstance, pool: Pool): void {
  app.get("/v1/pool", async (): Promise<PoolInfo> => pool.info());
}
