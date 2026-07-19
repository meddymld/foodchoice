import { Request, Response } from "express";

import {
  deleteSearchHistory,
  listSearchHistory
} from "./searchHistory.service.js";
import { getAuthenticatedUser } from "../../utils/requestUser.js";

export async function listSearchHistoryController(request: Request, response: Response) {
  const user = getAuthenticatedUser(request);
  const history = await listSearchHistory(user.id);

  response.json({ data: history });
}

export async function deleteSearchHistoryController(request: Request, response: Response) {
  const user = getAuthenticatedUser(request);
  await deleteSearchHistory(user.id);

  response.status(204).send();
}
