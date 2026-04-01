import { NextResponse } from "next/server";

interface RateLimitData {
  count: number;
  resetAt: number;
}

const rateLimiters = new Map<string, RateLimitData>();

// Cleans up expired entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of Array.from(rateLimiters.entries())) {
    if (now > data.resetAt) rateLimiters.delete(key);
  }
}, 60000);

export function rateLimit(identifier: string, limit: number, windowMs: number = 60000) {
  const now = Date.now();
  const windowData = rateLimiters.get(identifier);

  if (!windowData || now > windowData.resetAt) {
    rateLimiters.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, count: 1 };
  }

  if (windowData.count >= limit) {
    return { success: false, count: windowData.count };
  }

  windowData.count += 1;
  return { success: true, count: windowData.count };
}

export function checkRateLimit(req: Request, identifier: string | null, limit: number, windowMs: number = 60000) {
  if (!identifier) {
    // Fallback to IP if identifier is missing, though in App Router edge this might be tricky without headers
    identifier = req.headers.get("x-forwarded-for") || "unknown-ip";
  }

  const { success } = rateLimit(identifier, limit, windowMs);
  
  if (!success) {
    return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
  }
  
  return null; // Passes checks
}
