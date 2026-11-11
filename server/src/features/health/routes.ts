import { healthResponseSchema } from "@lantern/shared";
import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";

/**
 *   GET /v1/health     open to anyone: the deploy's check
 */
export const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get("/v1/health", { schema: { response: { 200: healthResponseSchema } } }, async () => ({ ok: true as const }));
};
