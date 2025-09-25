/**
 * Base error class for API-related errors.
 *
 * @param status - HTTP status code returned by the API.
 * @param statusText - Human readable summary of the status code.
 * @param message - Detailed error message, typically from the API response body.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly statusText: string;

  constructor(status: number, statusText: string, message: string) {
    super(message);
    this.status = status;
    this.statusText = statusText;
    this.name = this.constructor.name;
  }
}

/**
 * Error thrown when a resource is not found (404).
 *
 * @param message - Details about the missing resource.
 */
export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(404, 'Not Found', message);
  }
}

/**
 * Error thrown for bad requests (400).
 *
 * @param message - Explanation of why the request was invalid.
 */
export class BadRequestError extends ApiError {
  constructor(message: string) {
    super(400, 'Bad Request', message);
  }
}

/**
 * Error thrown when a resource already exists (409).
 *
 * @param message - Explanation describing the conflicting resource.
 */
export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, 'Conflict', message);
  }
}

/**
 * Error thrown for server errors (500+).
 */
export class ServerError extends ApiError {}

/**
 * Error thrown for unexpected HTTP status codes.
 */
export class UnexpectedStatusError extends ApiError {}
