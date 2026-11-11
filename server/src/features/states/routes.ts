import {
  clearStateResponseSchema,
  MAX_STATES_PAGE,
  setStateRequestSchema,
  skipResponseSchema,
  stateCountsResponseSchema,
  stateRowSchema,
  statesQuerySchema,
  statesResponseSchema,
  titleParamsSchema,
  titleStateResponseSchema,
} from "@lantern/shared";
import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { currentUserId } from "../../plugins/auth/index.js";
import type { StatesStore } from "./store.js";

/** How many rows a page holds when the request doesn't say. */
const DEFAULT_PAGE = 50;

/**
 * The states routes. Each one reads or writes the signed-in user's own rows
 * only; the writes sit behind the Origin check like every write under /v1.
 *
 *   GET    /v1/titles/:id/state     { row } or { row: null }
 *   PUT    /v1/titles/:id/state     { state } → the row
 *   DELETE /v1/titles/:id/state     { cleared }
 *   POST   /v1/titles/:id/skip      { skipped: true }
 *   DELETE /v1/titles/:id/skip      { skipped: false }; the undo
 *   GET    /v1/states?state=&limit=&cursor=   newest first
 *   GET    /v1/states/counts         per state
 *
 * `:id` is an IMDb id (`tt0111161`).
 */
export const stateRoutes: FastifyPluginAsyncZod<{ states: StatesStore }> = async (app, { states }) => {
  app.get(
    "/v1/titles/:id/state",
    { schema: { params: titleParamsSchema, response: { 200: titleStateResponseSchema } } },
    async (request) => ({ row: states.get(currentUserId(request), request.params.id) ?? null }),
  );

  app.put(
    "/v1/titles/:id/state",
    { schema: { params: titleParamsSchema, body: setStateRequestSchema, response: { 200: stateRowSchema } } },
    async (request) => states.set(currentUserId(request), request.params.id, request.body.state),
  );

  app.delete(
    "/v1/titles/:id/state",
    { schema: { params: titleParamsSchema, response: { 200: clearStateResponseSchema } } },
    async (request) => ({ cleared: states.clear(currentUserId(request), request.params.id) }),
  );

  app.post(
    "/v1/titles/:id/skip",
    { schema: { params: titleParamsSchema, response: { 200: skipResponseSchema } } },
    async (request) => {
      states.skip(currentUserId(request), request.params.id);
      return { skipped: true };
    },
  );

  app.delete(
    "/v1/titles/:id/skip",
    { schema: { params: titleParamsSchema, response: { 200: skipResponseSchema } } },
    async (request) => {
      states.unskip(currentUserId(request), request.params.id);
      return { skipped: false };
    },
  );

  app.get(
    "/v1/states",
    { schema: { querystring: statesQuerySchema, response: { 200: statesResponseSchema } } },
    async (request) => {
      const query = request.query;
      return states.list(currentUserId(request), {
        state: query.state,
        limit: Math.min(query.limit ?? DEFAULT_PAGE, MAX_STATES_PAGE),
        cursor: query.cursor,
      });
    },
  );

  app.get("/v1/states/counts", { schema: { response: { 200: stateCountsResponseSchema } } }, async (request) => ({
    counts: states.counts(currentUserId(request)),
  }));
};
