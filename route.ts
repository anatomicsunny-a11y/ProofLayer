/**
 * POST /api/verify
 * 
 * Main endpoint for ProofLayer verification.
 * 
 * Request body:
 * {
 *   "claim": "Solar energy capacity increased significantly between 2023 and 2025.",
 *   "sources": ["url1", "url2", ...] // optional, otherwise auto-discover
 * }
 * 
 * Response:
 * {
 *   "claim": "...",
 *   "verdict": "SUPPORTED|CONTRADICTED|MIXED|INSUFFICIENT_EVIDENCE",
 *   "confidence": 75,
 *   "explanation": "...",
 *   "evidence": [...],
 *   "sources_analyzed": 3,
 *   ...
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getScraperProvider, getProviderName } from "@/lib/scraper/scraperManager";
import { analyzeEvidenceWithLLM } from "@/lib/evidenceAnalysis";

interface VerifyRequest {
  claim: string;
  sources?: string[];
}

/**
 * Discover potential source URLs based on a claim
 * This is a placeholder for more sophisticated source discovery
 */
function discoverSourcesForClaim(claim: string): string[] {
  // For hackathon demo, return a curated set of reliable sources
  // In production, this would use search APIs or other discovery methods
  
  const claimLower = claim.toLowerCase();

  // Topic-specific source selection
  if (
    claimLower.includes("renewable") ||
    claimLower.includes("solar") ||
    claimLower.includes("energy")
  ) {
    return [
      "https://en.wikipedia.org/wiki/Solar_energy",
      "https://en.wikipedia.org/wiki/Renewable_energy",
      "https://en.wikipedia.org/wiki/Electricity_generation",
    ];
  }

  if (claimLower.includes("ai") || claimLower.includes("artificial")) {
    return [
      "https://en.wikipedia.org/wiki/Artificial_intelligence",
      "https://en.wikipedia.org/wiki/Large_language_model",
      "https://en.wikipedia.org/wiki/Machine_learning",
    ];
  }

  if (claimLower.includes("climate") || claimLower.includes("temperature")) {
    return [
      "https://en.wikipedia.org/wiki/Climate_change",
      "https://en.wikipedia.org/wiki/Global_warming",
      "https://en.wikipedia.org/wiki/Greenhouse_gas",
    ];
  }

  // Default to general knowledge sources
  return [
    "https://en.wikipedia.org/wiki/Portal:Current_events",
    "https://en.wikipedia.org/wiki/Main_Page",
  ];
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyRequest = await request.json();

    // Validate input
    if (!body.claim || typeof body.claim !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'claim' field" },
        { status: 400 }
      );
    }

    const claim = body.claim.trim();
    if (claim.length === 0) {
      return NextResponse.json(
        { error: "Claim cannot be empty" },
        { status: 400 }
      );
    }

    if (claim.length > 500) {
      return NextResponse.json(
        { error: "Claim is too long (max 500 characters)" },
        { status: 400 }
      );
    }

    // Determine sources
    let sources = body.sources || [];
    if (sources.length === 0) {
      sources = discoverSourcesForClaim(claim);
    }

    if (sources.length === 0) {
      return NextResponse.json(
        { error: "No sources could be discovered for this claim" },
        { status: 400 }
      );
    }

    // Validate URLs
    sources = sources.filter((url) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });

    if (sources.length === 0) {
      return NextResponse.json(
        { error: "No valid URLs to scrape" },
        { status: 400 }
      );
    }

    // Step 1: Scrape web data using configured provider
    console.log(
      `Scraping ${sources.length} sources using ${getProviderName()}`
    );
    console.log(`Sources to scrape:`, sources);
    
    const scraper = getScraperProvider();
    let scraperResult;
    try {
      scraperResult = await scraper.scrape({ urls: sources });
    } catch (error) {
      console.error("Scraper error:", error);
      return NextResponse.json(
        {
          error: "Web scraping failed",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }

    // Log scraper result for debugging
    console.log(`Scraper result:`, {
      status: scraperResult.status,
      pages: scraperResult.pages.length,
      provider: scraperResult.provider,
      error: scraperResult.error,
    });

    if (!scraperResult.pages || scraperResult.pages.length === 0) {
      console.error("SCRAPING FAILED - No pages returned");
      console.error("Bright Data error:", scraperResult.error);
      console.error("Bright Data status:", scraperResult.status);
      
      return NextResponse.json(
        {
          error: "No data could be scraped from the provided sources",
          verdict: "INSUFFICIENT_EVIDENCE",
          provider: scraperResult.provider,
          provider_error: scraperResult.error,
          details: `Failed to retrieve data. Provider: ${scraperResult.provider}. Status: ${scraperResult.status}`,
        },
        { status: 400 }
      );
    }

    const scrapedData = scraperResult.pages;

    // Step 2: Analyze evidence using LLM
    console.log(`Analyzing ${scrapedData.length} evidence sources...`);
    let analysis;
    try {
      analysis = await analyzeEvidenceWithLLM(claim, scrapedData);
    } catch (error) {
      console.error("Analysis error:", error);
      return NextResponse.json(
        {
          error: "Evidence analysis failed",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }

    // Return complete result
    return NextResponse.json(analysis, { status: 200 });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
