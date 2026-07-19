import { env } from "./config/env.js";
import { connectRedis } from "./config/redis.js";
import { app } from "./app.js";

async function bootstrap() {
  try {
    await connectRedis();
  } catch (error) {
    console.warn("Redis unavailable, continuing without search cache", error);
  }

  app.listen(env.port, () => {
    console.log(`FoodChoice backend listening on port ${env.port}`);
  });
}

void bootstrap().catch((error) => {
  console.error("Backend startup failed", error);
  process.exit(1);
});
