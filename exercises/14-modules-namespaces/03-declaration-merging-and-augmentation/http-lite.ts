/**
 * A tiny stand-in for a third-party HTTP library: you can use it, but you
 * cannot edit it. That is the situation module augmentation exists for.
 */

export interface Request {
  url: string;
  headers: Record<string, string>;
}

export function createRequest(url: string): Request {
  return { url, headers: {} };
}

export function withHeader(
  request: Request,
  name: string,
  value: string,
): Request {
  return { ...request, headers: { ...request.headers, [name]: value } };
}

export function describeRequest(request: Request): string {
  return `${request.url} [${Object.keys(request.headers).length}]`;
}
