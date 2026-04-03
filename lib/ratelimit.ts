import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 30 requests per hour for authenticated API routes
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 h"),
  prefix: "ratelimit:api",
});

// 5 requests per hour for welcome/contact endpoints
export const emailRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix: "ratelimit:email",
});

// Chat rate limiting — double couche pour eviter les abus
// Limite horaire : 30 messages/heure (burst protection)
export const chatHourlyLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 h"),
  prefix: "ratelimit:chat:hourly",
});

// Limite quotidienne : 100 messages/jour (~1$ max par user/jour avec Haiku)
export const chatDailyLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 d"),
  prefix: "ratelimit:chat:daily",
});

// Limite pour visiteurs anonymes (plus stricte)
export const chatAnonHourlyLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, "1 h"),
  prefix: "ratelimit:chat:anon:hourly",
});

export const chatAnonDailyLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(40, "1 d"),
  prefix: "ratelimit:chat:anon:daily",
});
