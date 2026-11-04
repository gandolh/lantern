import type { ErrorBody } from "@lantern/shared";
import type { FastifyReply } from "fastify";
import type { z } from "zod";

/** Answer with the contract's error shape. */
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
