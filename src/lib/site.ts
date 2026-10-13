// Ordre : SITE_URL (domaine personnalisé) > domaine de production Vercel (variable système) > dev local.
export function resolveSite(env: Record<string, string | undefined>): string {
  if (env.SITE_URL) return env.SITE_URL.replace(/\/+$/, "");
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:4321";
}
