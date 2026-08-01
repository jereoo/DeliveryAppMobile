export type AuthenticatedRequest = (
  endpoint: string,
  options?: Record<string, any>,
) => Promise<Response>;
