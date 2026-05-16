export class HttpError extends Error {
  constructor(status, message, details = undefined) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

export const httpError = (status, message, details = undefined) => new HttpError(status, message, details);
export const isHttpError = (error) => error instanceof HttpError;
