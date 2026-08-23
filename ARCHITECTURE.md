# ProofLayer Architecture

```text
                    ┌────────────────────┐
                    │     User Claim     │
                    └─────────┬──────────┘
                              ↓
                    ┌────────────────────┐
                    │  Next.js Frontend  │
                    └─────────┬──────────┘
                              ↓
                    ┌────────────────────┐
                    │   /api/verify      │
                    │   Orchestrator     │
                    └─────────┬──────────┘
                              ↓
                    ┌────────────────────┐
                    │ Scraper Provider   │
                    │    Abstraction     │
                    └─────────┬──────────┘
                              ↓
                    ┌────────────────────┐
                    │ Bright Data       │
                    │ Scraper Studio    │
                    └─────────┬──────────┘
                              ↓
                    ┌────────────────────┐
                    │ Structured Web     │
                    │ Evidence           │
                    └─────────┬──────────┘
                              ↓
                    ┌────────────────────┐
                    │ Evidence Analysis  │
                    │      LLM           │
                    └─────────┬──────────┘
                              ↓
                    ┌────────────────────┐
                    │ Verdict + Evidence │
                    │ + Sources           │
                    └────────────────────┘
```

## Main components

### Frontend
Accepts a claim and displays loading states, verdict, confidence, evidence, and source information.

### Verification API
Coordinates source discovery, scraping, normalization, and evidence analysis.

### Bright Data provider
Encapsulates the Bright Data Scraper Studio API integration.

### Evidence analysis
Converts structured evidence into a claim assessment with a verdict and supporting/contradicting evidence.

### Provider abstraction
Keeps the scraping interface separate from the rest of the application.

## Production requirement

The production application must use real Bright Data output. Any development data must be clearly separated from production behavior and must never be represented as live evidence.
