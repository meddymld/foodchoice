import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";
import { favoriteRoutes } from "./modules/favorites/favorite.routes.js";
import { preferenceRoutes } from "./modules/preferences/preference.routes.js";
import { restaurantRoutes } from "./modules/restaurants/restaurant.routes.js";
import { searchHistoryRoutes } from "./modules/search-history/searchHistory.routes.js";
import { userRoutes } from "./modules/users/user.routes.js";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin ?? true,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "foodchoice-backend"
  });
});

app.use(userRoutes);
app.use("/restaurants", restaurantRoutes);
app.use("/favorites", favoriteRoutes);
app.use("/preferences", preferenceRoutes);
app.use("/search-history", searchHistoryRoutes);

app.use(notFound);
app.use(errorHandler);
