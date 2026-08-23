/**
 * Scraper Manager
 * 
 * PRODUCTION MODE: Uses ONLY real Bright Data Scraper Studio.
 * No fallback to mock data. Errors are visible.
 * 
 * DEVELOPMENT MODE: Can still use DevelopmentProvider if needed,
 * but only if explicitly enabled via environment variable.
 */

import { ScraperProvider } from "./types";
import { BrightDataProvider } from "./brightDataProvider";
import { DevelopmentProvider } from "./developmentProvider";

let selectedProvider: ScraperProvider | null = null;

/**
 * Get the active scraper provider
 * 
 * In production (VERCEL or ENABLE_REAL_SCRAPING):
 * - Requires Bright Data configuration
 * - No mock data fallback
 * - Fails clearly if not configured
 * 
 * In development (local, with ENABLE_DEV_MODE):
 * - Can use mock data for testing UI
 * - But NEVER in production demo
 */
export function getScraperProvider(): ScraperProvider {
  if (selectedProvider) {
    return selectedProvider;
  }

  const brightData = new BrightDataProvider();
  const isProduction = !!process.env.VERCEL || process.env.ENABLE_REAL_SCRAPING === "true";
  const enableDevMode = process.env.ENABLE_DEV_MODE === "true";

  // In production, ONLY use Bright Data - no fallback to mock
  if (isProduction) {
    if (!brightData.isConfigured()) {
      const errorMsg =
        "PRODUCTION ERROR: Bright Data Scraper Studio not configured.\n" +
        "ProofLayer requires real Bright Data integration (no mock data fallback).\n" +
        "Set BRIGHT_DATA_API_TOKEN and BRIGHT_DATA_COLLECTOR_ID environment variables.";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    selectedProvider = brightData;
    console.log("✓ Using Bright Data Scraper Studio (PRODUCTION - no mock fallback)");
    return selectedProvider;
  }

  // If Bright Data is configured, use it
  if (brightData.isConfigured()) {
    selectedProvider = brightData;
    console.log("✓ Using Bright Data Scraper Studio");
    return selectedProvider;
  }

  // If explicitly enabling dev mode and NOT in production
  if (enableDevMode) {
    const devProvider = new DevelopmentProvider();
    selectedProvider = devProvider;
    console.log(
      "⚠️ DEV MODE: Using mock data (never shipped to production)"
    );
    return selectedProvider;
  }

  // Default: no scraper configured, no dev mode enabled
  throw new Error(
    "Scraper not configured. Set BRIGHT_DATA_API_TOKEN and BRIGHT_DATA_COLLECTOR_ID, or enable ENABLE_DEV_MODE for local testing."
  );
}

/**
 * Get the name of the currently active provider
 */
export function getProviderName(): string {
  return getScraperProvider().getName();
}

/**
 * Check if Bright Data is configured
 */
export function isBrightDataConfigured(): boolean {
  const brightData = new BrightDataProvider();
  return brightData.isConfigured();
}

/**
 * Check if in development mode
 */
export function isDevelopmentMode(): boolean {
  return process.env.ENABLE_DEV_MODE === "true";
}
