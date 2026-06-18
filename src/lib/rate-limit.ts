import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";
import { docClient, TABLE, pkRate, skRateWindow } from "./dynamo";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number; // seconds until the window resets
}

/**
 * Fixed-window rate limiter backed by DynamoDB. Increments a per-bucket
 * counter for the current time window via an atomic ADD; the item carries a
 * `ttl` so expired windows are auto-purged by DynamoDB.
 *
 * Fails open: if the counter store errors, the request is allowed (we never
 * want infra hiccups to block legitimate users — especially the trigger flow).
 */
export async function rateLimit(
  bucket: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const windowId = Math.floor(now / windowSeconds);
  const resetAt = (windowId + 1) * windowSeconds;
  const retryAfter = Math.max(1, resetAt - now);

  try {
    const res = await docClient.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { PK: pkRate(bucket), SK: skRateWindow(windowId) },
        UpdateExpression: "ADD #c :one SET #ttl = :ttl",
        ExpressionAttributeNames: { "#c": "count", "#ttl": "ttl" },
        ExpressionAttributeValues: { ":one": 1, ":ttl": resetAt + 60 },
        ReturnValues: "UPDATED_NEW",
      })
    );
    const count = Number(res.Attributes?.count ?? 1);
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfter,
    };
  } catch {
    return { allowed: true, remaining: limit, retryAfter };
  }
}

/** Best-effort client IP from common proxy headers. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

export function tooManyResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again later.", retryAfter },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
