import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;

// Credentials authorize() touches bcrypt + DynamoDB — keep on Node runtime.
export const runtime = "nodejs";
