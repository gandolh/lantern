import type { HealthResponse } from "@lantern/shared";
import type { FastifyInstance } from "fastify";

/**
 *   GET /v1/health     open to anyone: the deploy's check
 */
export function registerHealthRoutes(app: FastifyInstance): void {
  app.get("/v1/health", async (): Promise<HealthResponse> => ({ ok: true }));
}
