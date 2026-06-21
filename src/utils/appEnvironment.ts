export type AppEnvironment =
  | "production"
  | "development"
  | "staging"
  | "demo"
  | "presentation";

/** Resolved runtime environment. Explicit VITE_APP_ENV wins; production builds default to production. */
export function getAppEnvironment(): AppEnvironment {
  const configured = import.meta.env.VITE_APP_ENV as string | undefined;
  if (configured === "production") return "production";
  if (configured === "staging") return "staging";
  if (configured === "demo") return "demo";
  if (configured === "presentation") return "presentation";
  if (configured === "development") return "development";
  return "demo";
}

/** Production-only behavior (e.g. empty states when no onboarded PGs). */
export function isProductionMode(): boolean {
  return getAppEnvironment() === "production";
}

/** Demo, dev, staging, and presentation all seed rich sample data. */
export function isDemoMode(): boolean {
  return !isProductionMode();
}
