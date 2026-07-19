export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code = "API_ERROR"
  ) {
    super(message);
  }
}
