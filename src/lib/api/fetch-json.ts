export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type FetchJsonOptions = RequestInit & {
  parseError?: (payload: unknown) => string | undefined;
};

export async function fetchJson<T>(
  input: RequestInfo | URL,
  options: FetchJsonOptions = {}
): Promise<T> {
  const { parseError, ...init } = options;
  const res = await fetch(input, init);
  const data = (await res.json()) as T & { error?: string; message?: string };

  if (!res.ok) {
    const message =
      parseError?.(data) ??
      (typeof data?.error === "string" ? data.error : undefined) ??
      (typeof data?.message === "string" ? data.message : undefined) ??
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return data;
}
