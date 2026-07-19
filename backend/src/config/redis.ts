import { createClient } from "redis";

import { env } from "./env.js";

export const redis =
  env.redisUrl === undefined
    ? undefined
    : createClient({
        url: env.redisUrl
      });

export async function connectRedis() {
  if (!redis || redis.isOpen) return;

  redis.on("error", (error) => {
    console.error("Redis error", error);
  });
  await redis.connect();
}
