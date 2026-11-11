import type { ErrorBody } from "@lantern/shared";
import { hasZodFastifySchemaValidationErrors, isResponseSerializationError } from "@fastify/type-provider-zod";
import type { FastifyPluginAsync, FastifyReply } from "fastify";
import type { z } from "zod";
import fp from "fastify-plugin";

/** The largest request body accepted: every write is a few fields. */
export const BODY_LIMIT = 64 * 1024;

/** Answer with the contract's error shape. The one way a handler sends an error body. */
export function fail(reply: FastifyReply, status: number, body: ErrorBody): FastifyReply {
  return reply.status(status).send(body);
}

/** Parse with a contract schema, or answer 400 and return undefined. Messages name the field, never its value. */
export function parse<S extends z.ZodType>(schema: S, value: unknown, reply: FastifyReply): z.output<S> | undefined {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  void fail(reply, 400, {
    code: "invalid_request",
    message: issue ? `${issue.path.join(".") || "request"}: ${issue.message}` : "invalid request",
  });
  return undefined;
}

/** The first failed field as `path: message`, never the value; `request` when the failure has no path. */
function describeValidation(error: { validation: readonly { instancePath: string; message?: string }[] }): string {
  const issue = error.validation[0];
  if (!issue) return "invalid request";
  const path = issue.instancePath.replace(/^\//, "").replaceAll("/", ".");
  return `${path || "request"}: ${issue.message ?? "invalid"}`;
}

/**
 * The one error handler, at the root: the contract's `{ code, message }` body,
 * which the page parses. Four cases, in order:
 *
 * 1. a request that failed its route's schema: 400 `invalid_request` naming the field;
 * 2. a reply that failed its response schema: 500, logged, never shown;
 * 3. Fastify's own 4xx (bad JSON, a body too large, a wrong media type): its status and a message
 *    that never quotes the body;
 * 4. anything else: 500 with a fixed message, logged by name and code only.
 */
export const errorsPlugin: FastifyPluginAsync = fp(
  async (app) => {
    app.setErrorHandler((error: Error & { statusCode?: number; code?: string }, request, reply) => {
      if (hasZodFastifySchemaValidationErrors(error)) {
        return fail(reply, 400, { code: "invalid_request", message: describeValidation(error) });
      }
      if (isResponseSerializationError(error)) {
        request.log.error(
          { err: { name: error.name, code: error.code }, method: request.method, url: request.url },
          "a reply failed its response schema",
        );
        return fail(reply, 500, { code: "internal", message: "Lantern hit an error; see its log" });
      }
      const status = error.statusCode ?? 500;
      if (status >= 500) {
        request.log.error({ err: { name: error.name, code: error.code } }, "unhandled error");
        return fail(reply, 500, { code: "internal", message: "Lantern hit an error; see its log" });
      }
      const message =
        error.code === "FST_ERR_CTP_INVALID_JSON_BODY" || error.name === "SyntaxError"
          ? "the body is not valid JSON"
          : error.code === "FST_ERR_CTP_BODY_TOO_LARGE"
            ? `the body is larger than ${BODY_LIMIT} bytes`
            : error.code === "FST_ERR_CTP_INVALID_MEDIA_TYPE"
              ? "send the body as application/json"
              : "the request is not valid";
      return fail(reply, status, { code: "invalid_request", message });
    });
  },
  { name: "lantern-errors" },
);
