# ProofLayer

**Turn web claims into evidence.**

ProofLayer is a web-based claim verification application designed for the Bright Data Scraper Studio hackathon. A user enters a factual claim, ProofLayer gathers publicly available web evidence through a custom Bright Data scraper, structures the returned information, and analyzes the evidence to produce a verdict with supporting sources.

## Problem

AI systems can answer factual questions confidently without showing enough evidence. ProofLayer focuses on the evidence layer: collect public web information, compare it against a claim, and present the reasoning and sources clearly.

## How it works

```text
User Claim
   ↓
Claim / Source Discovery
   ↓
Custom Bright Data Scraper Studio Collector
   ↓
Structured Public Web Data
   ↓
Evidence Analysis
   ↓
Verdict + Confidence + Evidence + Sources
```

## Bright Data Scraper Studio

The project uses a **custom Scraper Studio collector**, rather than relying only on a pre-built scraper from the Bright Data Scrapers Library.

The collector was created for a publicly accessible Wikipedia article and configured to extract structured article information. The production integration triggers the collector through the Bright Data Scraper Studio API and polls for the resulting collection.

The application is designed so that the Bright Data provider is isolated behind a scraper-provider abstraction. This keeps the verification pipeline independent from the scraping implementation and makes the integration easier to test and maintain.

### Production integration

The application uses the Scraper Studio/DCA flow:

1. Trigger the collector.
2. Receive a collection identifier.
3. Poll the collection until it is ready.
4. Read the returned structured JSON.
5. Normalize the records.
6. Pass the evidence into the analysis layer.
7. Display the resulting verdict and sources.

**Important:** Production must use real Bright Data output. Development/mock data must never be presented as real scraped evidence.

## Example structured output

The following is an illustrative example of the structure ProofLayer expects from a scraper:

```json
[
  {
    "title": "Solar energy",
    "url": "https://en.wikipedia.org/wiki/Solar_energy",
    "content": "Solar energy is radiant light and heat from the Sun that is harnessed using a range of technologies...",
    "published_date": "",
    "author": "Wikipedia Contributors"
  }
]
```

This example is provided to document the expected structure. It is **not claimed to be a live response from Bright Data**.

## Evidence analysis

The analysis layer evaluates the collected evidence against the user's claim and can produce verdict categories such as:

- `SUPPORTED`
- `CONTRADICTED`
- `MIXED`
- `INSUFFICIENT_EVIDENCE`

The UI presents the verdict together with confidence, evidence excerpts, source URLs, and an evidence matrix.

## Technology

- Next.js
- React
- TypeScript
- Tailwind CSS
- Bright Data Scraper Studio
- Bright Data DCA API
- LLM-based evidence analysis
- Vercel deployment

## AI disclosure

AI coding assistants were used during development.

Claude, ChatGPT, and Grok were used for architecture discussion, code generation, debugging assistance, documentation, API-integration investigation, and iteration.

The team remained responsible for:
- choosing the product concept and project direction;
- configuring the Bright Data scraper;
- providing and managing the required credentials;
- reviewing generated code;
- testing the application;
- making project and technical decisions;
- preparing the final submission and demonstration.

AI assistance does not replace the team's responsibility to understand and explain the submitted implementation.

## Hackathon compliance

ProofLayer is designed around the hackathon requirements:

- Uses publicly available web data.
- Uses a custom Bright Data Scraper Studio collector.
- Does not require private or login-protected information.
- Includes an explanation of the Bright Data integration.
- Includes example structured output.
- Discloses AI coding-assistant usage.
- The final submission should include the public source repository and demo video.

## Team

**Team:** Stack overflowed

**Project:** ProofLayer

## Final submission checklist

- [ ] Public GitHub repository
- [ ] README included
- [ ] Actual source code committed
- [ ] Example structured output included
- [ ] Bright Data Scraper Studio explanation included
- [ ] AI-use disclosure included
- [ ] Production deployment tested
- [ ] Real Bright Data response verified
- [ ] Demo video recorded
- [ ] Final submission form completed
