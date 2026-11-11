import { poolInfoSchema } from "@lantern/shared";
import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import type { Pool } from "./store.js";

/**
 *   GET /v1/pool     how many titles the pool holds, by kind, and when they were imported
 */
export const poolRoutes: FastifyPluginAsyncZod<{ pool: Pool }> = async (app, { pool }) => {
  app.get("/v1/pool", { schema: { response: { 200: poolInfoSchema } } }, async () => pool.info());
};
