import {
  MAX_STATES_PAGE,
  setStateRequestSchema,
  statesQuerySchema,
  titleParamsSchema,
  type ClearStateResponse,
  type SkipResponse,
  type StateCountsResponse,
  type StateRow,
  type StatesResponse,
  type TitleStateResponse,
} from "@lantern/shared";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { parse } from "../reply.js";
import type { StatesStore } from "../states.js";

/** How many rows a page holds when the request doesn't say. */
const DEFAULT_PAGE = 50;

/** The signed-in user's id. Every route here is behind the guard, which sets `auth`. */
export function userIdOf(request: FastifyRequest): string {
  const auth = request.auth;
  if (auth === null) throw new Error("a states route ran without a session");
  return auth.user.id;
}

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
export function registerStateRoutes(app: FastifyInstance, states: StatesStore): void {
  app.get("/v1/titles/:id/state", async (request, reply) => {
    const params = parse(titleParamsSchema, request.params, reply);
    if (!params) return reply;
    const body: TitleStateResponse = { row: states.get(userIdOf(request), params.id) ?? null };
    return body;
  });

  app.put("/v1/titles/:id/state", async (request, reply) => {
    const params = parse(titleParamsSchema, request.params, reply);
    if (!params) return reply;
    const body = parse(setStateRequestSchema, request.body, reply);
    if (!body) return reply;
    const row: StateRow = states.set(userIdOf(request), params.id, body.state);
    return row;
  });

  app.delete("/v1/titles/:id/state", async (request, reply) => {
    const params = parse(titleParamsSchema, request.params, reply);
    if (!params) return reply;
    const body: ClearStateResponse = { cleared: states.clear(userIdOf(request), params.id) };
    return body;
  });

  app.post("/v1/titles/:id/skip", async (request, reply) => {
    const params = parse(titleParamsSchema, request.params, reply);
    if (!params) return reply;
    states.skip(userIdOf(request), params.id);
    const body: SkipResponse = { skipped: true };
    return body;
  });

  app.delete("/v1/titles/:id/skip", async (request, reply) => {
    const params = parse(titleParamsSchema, request.params, reply);
    if (!params) return reply;
    states.unskip(userIdOf(request), params.id);
    const body: SkipResponse = { skipped: false };
    return body;
  });

  app.get("/v1/states", async (request, reply) => {
    const query = parse(statesQuerySchema, request.query, reply);
    if (!query) return reply;
    const body: StatesResponse = states.list(userIdOf(request), {
      state: query.state,
      limit: Math.min(query.limit ?? DEFAULT_PAGE, MAX_STATES_PAGE),
      cursor: query.cursor,
    });
    return body;
  });

  app.get("/v1/states/counts", async (request) => {
    const body: StateCountsResponse = { counts: states.counts(userIdOf(request)) };
    return body;
  });
}
