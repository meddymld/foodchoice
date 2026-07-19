import { Response, Request } from "express";

import { getMe } from "./user.service.js";
import { getAuthenticatedUser } from "../../utils/requestUser.js";

export async function getMeController(request: Request, response: Response) {
  const user = getAuthenticatedUser(request);
  const payload = await getMe(user);

  response.json(payload);
}
