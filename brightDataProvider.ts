/**
 * Bright Data Scraper Provider
 * 
 * Uses the OFFICIAL Bright Data Scraper Studio Collection API.
 * 
 * Key endpoints:
 * - Trigger: POST https://api.brightdata.com/dca/trigger?collector={collectorId}&queue_next=1
 * - Poll: GET https://api.brightdata.com/dca/dataset?id={snapshotId}
 * 
 * This is PRODUCTION ONLY. No fallback to mock data.
 */

import { ScraperProvider, ScraperInput, ScraperResult, ScrapedPage } from "./types";

const BRIGHT_DATA_TRIGGER_URL = "https://api.brightdata.com/dca/trigger";
const BRIGHT_DATA_DATASET_URL = "https://api.brightdata.com/dca/dataset";
const MAX_POLL_ATTEMPTS = 120; // 10 minutes with 5s interval
const POLL_INTERVAL_MS = 5000; // Official docs recommend 5s

interface BrightDataTriggerResponse {
  collection_id: string; // snapshot ID
}

interface BrightDataStatusResponse {
  status: string;
}

export class BrightDataProvider implements ScraperProvider {
  private apiToken: string | undefined;
  private collectorId: string | undefined;

  constructor() {
    this.apiToken = process.env.BRIGHT_DATA_API_TOKEN;
    this.collectorId = process.env.BRIGHT_DATA_COLLECTOR_ID;
  }

  getName(): string {
    return "Bright Data Scraper Studio (Real)";
  }

  isConfigured(): boolean {
    return !!(this.apiToken && this.collectorId);
  }

  async scrape(input: ScraperInput): Promise<ScraperResult> {
    if (!this.isConfigured()) {
      return {
        pages: [],
        status: "error",
        error: "Bright Data not configured. Set BRIGHT_DATA_API_TOKEN and BRIGHT_DATA_COLLECTOR_ID environment variables.",
        timestamp: new Date().toISOString(),
        provider: "bright-data",
      };
    }

    try {
      const snapshotId = await this.triggerScraper(input.urls);
      const results = await this.pollResults(snapshotId);

      return {
        pages: results,
        status: results.length > 0 ? "success" : "partial",
        timestamp: new Date().toISOString(),
        provider: "bright-data",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        pages: [],
        status: "error",
        error: `Bright Data API failed: ${errorMessage}`,
        timestamp: new Date().toISOString(),
        provider: "bright-data",
      };
    }
  }

  private async triggerScraper(urls: string[]): Promise<string> {
    // Bright Data Scraper Studio input format must match collector's schema
    // For a collector built for a single URL with no input fields,
    // send an array with one empty object as a single "job" to process
    const inputs: unknown[] = [{}];
    
    const triggerUrl = new URL(BRIGHT_DATA_TRIGGER_URL);
    triggerUrl.searchParams.set("collector", this.collectorId!);
    triggerUrl.searchParams.set("queue_next", "1");

    console.log(`[Bright Data] Triggering scraper`);
    console.log(`[Bright Data] Collector ID: ${this.collectorId}`);
    console.log(`[Bright Data] Sending single empty input object to collector`);

    const response = await fetch(triggerUrl.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inputs),
    });

    console.log(`[Bright Data] Trigger response status: ${response.status}`);

    if (!response.ok) {
      let errorText = await response.text();
      console.error(`[Bright Data] TRIGGER FAILED`);
      console.error(`[Bright Data] HTTP Status: ${response.status}`);
      console.error(`[Bright Data] Error response: ${errorText}`);
      
      // Try to parse as JSON for structured error
      try {
        const errorJson = JSON.parse(errorText);
        console.error(`[Bright Data] Error details:`, JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.error(`[Bright Data] Error is not JSON, raw text above`);
      }
      
      throw new Error(
        `Bright Data trigger (${response.status}): ${errorText}`
      );
    }

    const data: BrightDataTriggerResponse = await response.json();
    console.log(`[Bright Data] Trigger success. Snapshot ID: ${data.collection_id}`);
    
    if (!data.collection_id) {
      throw new Error("Bright Data trigger response missing collection_id");
    }
    
    return data.collection_id; // This is the snapshot ID
  }

  private async pollResults(snapshotId: string): Promise<ScrapedPage[]> {
    console.log(`[Bright Data] Starting to poll snapshot: ${snapshotId}`);
    
    for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
      try {
        const datasetUrl = new URL(BRIGHT_DATA_DATASET_URL);
        datasetUrl.searchParams.set("id", snapshotId);

        const response = await fetch(datasetUrl.toString(), {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
          },
        });

        console.log(`[Bright Data] Poll attempt ${attempt}/${MAX_POLL_ATTEMPTS}: HTTP ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Bright Data] Poll error: ${response.status} - ${errorText}`);
          throw new Error(`Bright Data poll (${response.status}): ${errorText}`);
        }

        const data = await response.json();

        // Check if response is an array (ready) or object with status (building)
        if (Array.isArray(data)) {
          // Success - return the results
          console.log(`[Bright Data] Snapshot ready! Response type: array, length: ${data.length}`);
          
          if (data.length === 0) {
            console.warn(`[Bright Data] WARNING: Received empty array from Bright Data`);
            console.warn(`[Bright Data] This means the scraper returned 0 records`);
            console.warn(`[Bright Data] Check: Is the scraper correctly targeting the URL?`);
            console.warn(`[Bright Data] Check: Did the scraper find any matching elements?`);
          }
          
          return this.normalizeResults(data);
        }

        // Response is an object - check status
        if (data.status && data.status !== "ready") {
          console.log(
            `[Bright Data] Still processing... Status: ${data.status} (${attempt}/${MAX_POLL_ATTEMPTS})`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, POLL_INTERVAL_MS)
          );
          continue;
        }

        // If we get here with a non-array, non-status response, something is wrong
        console.error(`[Bright Data] Unexpected response format: ${JSON.stringify(data)}`);
        throw new Error(`Unexpected Bright Data response: ${JSON.stringify(data)}`);

      } catch (error) {
        if (attempt === MAX_POLL_ATTEMPTS) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`[Bright Data] Polling timeout: ${errorMsg}`);
          throw new Error(
            `Bright Data polling timeout after ${MAX_POLL_ATTEMPTS} attempts (${Math.round(
              (MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000
            )}s): ${errorMsg}`
          );
        }

        await new Promise((resolve) =>
          setTimeout(resolve, POLL_INTERVAL_MS)
        );
      }
    }

    throw new Error("Bright Data polling failed");
  }

  private normalizeResults(data: unknown[]): ScrapedPage[] {
    if (!Array.isArray(data)) {
      throw new Error("Expected array from Bright Data");
    }

    console.log(`[Bright Data] RAW RESPONSE (first 3 records):`);
    console.log(JSON.stringify(data.slice(0, 3), null, 2));

    const normalized = data.map((item: unknown) => {
      const obj = item as Record<string, unknown>;
      return {
        url: String(obj.url || ""),
        title: obj.title ? String(obj.title) : undefined,
        content: obj.content ? String(obj.content) : undefined,
        author: obj.author ? String(obj.author) : undefined,
        published_date: obj.published_date ? String(obj.published_date) : undefined,
        domain: obj.domain ? String(obj.domain) : undefined,
      };
    });

    console.log(`[Bright Data] NORMALIZED (first record):`);
    console.log(JSON.stringify(normalized[0], null, 2));

    return normalized;
  }
}
