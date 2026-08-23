# Bright Data Scraper Studio Explanation

## Why Bright Data?

ProofLayer needs fresh public web evidence rather than relying exclusively on information already contained in an AI model. Bright Data Scraper Studio provides the web-data collection layer.

## Custom collector

The project uses a custom collector created through Bright Data Scraper Studio. The collector targets a public Wikipedia article and extracts structured fields used by ProofLayer.

This is important for hackathon compliance: the project is not simply consuming an existing scraper from the Bright Data Scrapers Library.

## Runtime flow

```text
ProofLayer API
      |
      | POST /dca/trigger
      v
Bright Data Scraper Studio
      |
      | collection_id
      v
ProofLayer polling layer
      |
      | GET /dca/dataset
      v
Structured JSON records
      |
      v
Evidence analysis
```

## Data policy

The project uses publicly accessible web content. It is not designed to collect:
- login-protected information;
- private information;
- paywalled content;
- restricted personal data.

## Important implementation note

The collector used during development was configured as a zero-input collector for a specific public URL. The application therefore needs to submit an input matching that collector's actual schema. The final production deployment must be verified against a real Bright Data response before claiming end-to-end success.

## Verification standard

A successful implementation means that:
1. Bright Data accepts the trigger request;
2. a collection identifier is returned;
3. the resulting dataset is non-empty;
4. the records contain the expected public-web content;
5. ProofLayer uses those records for its evidence analysis.

HTTP success alone is not sufficient evidence that the integration works.
