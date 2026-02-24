export function canUseModel(request: Request): boolean {
  if (!process.env.OPENAI_API_KEY) {
    return false;
  }

  const requiredToken = process.env.DEMO_API_TOKEN?.trim();
  if (!requiredToken) {
    return true;
  }

  const providedToken = request.headers.get("x-demo-token")?.trim();
  return providedToken === requiredToken;
}
