import { z } from "zod";

export const MAX_BODY_BYTES = 120_000;
export const MAX_REQUEST_MS = 55_000;

export class PolicyError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

export const byokSchema = z
  .object({
    apiKey: z
      .string()
      .min(16)
      .max(512)
      .regex(/^[\x21-\x7e]+$/),
  })
  .strict();

export const uiMessageSchema = z
  .object({
    id: z.string().min(1).max(200),
    role: z.enum(["user", "assistant"]),
    parts: z.array(z.unknown()).min(1).max(40),
  })
  .passthrough();

export const requestSchema = z
  .object({
    messages: z.array(uiMessageSchema).min(1).max(40),
    byok: byokSchema,
  })
  .strict();

export async function readLimitedBody(request: Request, signal: AbortSignal) {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && Number(declaredLength) > MAX_BODY_BYTES) {
    throw new PolicyError("Conversation is too large. Start a new chat.", 413);
  }
  if (!request.body) throw new PolicyError("A JSON request body is required.", 400);

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      signal.throwIfAborted();
      const result = await reader.read();
      if (result.done) break;
      bytes += result.value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        throw new PolicyError("Conversation is too large. Start a new chat.", 413);
      }
      text += decoder.decode(result.value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

export function isAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const configured = process.env.APP_ORIGIN?.trim() || "http://localhost:3000";
  return origin === configured;
}
