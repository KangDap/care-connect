from __future__ import annotations

import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import Any

import nltk
import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from supabase import create_client, Client

sys.path.insert(0, str(Path(__file__).parent))
from pipelines import pipeline_from_reports

# Load environment variables
load_dotenv()


# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get config directory
CONFIG_DIR = Path(__file__).resolve().parent / "config"
TAXONOMY: dict[str, list[str]] | None = None
SLANG_DICTIONARY: dict[str, str] | None = None

# Supabase client
NEXT_PUBLIC_SUPABASE_URL: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_CLIENT: Client | None = None

# Default parameters for Apriori algorithm
DEFAULT_MIN_SUPPORT = 0.1
DEFAULT_MIN_CONFIDENCE = 0.6
DEFAULT_TOP_N_CATEGORY_ITEMSETS = 10

def load_config():
    """Load taxonomy and slang dictionary from JSON config files."""
    global TAXONOMY, SLANG_DICTIONARY

    # Load taxonomy
    taxonomy_path = CONFIG_DIR / "taxonomy.json"
    if taxonomy_path.exists():
        try:
            with open(taxonomy_path, "r", encoding="utf-8") as f:
                raw_taxonomy = json.load(f)
                # Convert lists back to tuples for compatibility with pipelines.py
                TAXONOMY = {k: tuple(v) if isinstance(v, list) else v for k, v in raw_taxonomy.items()}
            logger.info(f"Loaded taxonomy with {len(TAXONOMY)} entries")
        except Exception as e:
            logger.error(f"Failed to load taxonomy: {e}")
            TAXONOMY = None
    else:
        logger.warning(f"Taxonomy file not found: {taxonomy_path}")

    # Load slang dictionary
    slang_path = CONFIG_DIR / "slang.json"
    if slang_path.exists():
        try:
            with open(slang_path, "r", encoding="utf-8") as f:
                SLANG_DICTIONARY = json.load(f)
            logger.info(f"Loaded slang dictionary with {len(SLANG_DICTIONARY)} entries")
        except Exception as e:
            logger.error(f"Failed to load slang dictionary: {e}")
            SLANG_DICTIONARY = None
    else:
        logger.warning(f"Slang file not found: {slang_path}")


def load_supabase_client() -> None:
    """Initialize Supabase client when credentials are available."""
    global SUPABASE_CLIENT

    if NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
        SUPABASE_CLIENT = create_client(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        logger.info("Supabase client initialized")
        return

    SUPABASE_CLIENT = None
    logger.warning("Supabase URL or KEY not configured; reports must be provided in request body")


def ensure_nltk_stopwords():
    """Download NLTK stopwords if not already available."""
    try:
        nltk.data.find("corpora/stopwords")
    except LookupError:
        logger.info("Downloading NLTK stopwords...")
        nltk.download("stopwords", quiet=True)
        logger.info("NLTK stopwords downloaded successfully")


# Initialize FastAPI app
app = FastAPI(
    title="Care Connect AI Service",
    description="NLP and Apriori Market Basket Analysis for abuse reports",
    version="1.0.0",
)


@app.on_event("startup")
def startup_event():
    """Load config and ensure dependencies are ready on startup."""
    logger.info("Starting Care Connect AI Service...")
    load_supabase_client()
    ensure_nltk_stopwords()
    load_config()
    logger.info("AI Service ready")
    logger.info(f"SUPABASE_URL: {NEXT_PUBLIC_SUPABASE_URL}")
    logger.info(f"SUPABASE_KEY exists: {bool(SUPABASE_SERVICE_ROLE_KEY)}")


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "care-connect-ai"}


# Request/Response models
class ReportInput(BaseModel):
    """Single report input."""

    report_id: int | str
    title: str
    description: str
    category: str | None = None
    province: str | None = None
    city: str | None = None
    district: str | None = None
    incident_date: str | None = None


class AnalyzeRequest(BaseModel):
    """Request payload for analyze endpoint."""

    reports: list[ReportInput] = Field(default_factory=list)
    text_columns: list[str] = Field(default=["title", "description"])


class AnalyzeResponse(BaseModel):
    """Response payload for analyze endpoint."""

    status: str
    processed_count: int
    transaction_count: int
    frequent_itemsets_count: int
    rules_count: int
    duration_ms: float
    api_payload: dict[str, Any]
    warnings: list[str] | None = None


@app.post("/dashboard/admin/ai/analyze", response_model=AnalyzeResponse)
def analyze_reports(
    request: AnalyzeRequest,
) -> AnalyzeResponse:
    """
    Analyze reports using NLP and Apriori association rules mining.

    Request body:
    - reports: array of report objects with id, title, description, category, etc.
      (if empty, will attempt to fetch from Supabase)
    - min_support: minimum support threshold for itemsets (0.0-1.0, default 0.1)
    - min_confidence: minimum confidence for rules (0.0-1.0, default 0.6)
    - top_n_category_itemsets: top N itemsets per category (default 10)
    - text_columns: which columns to use for text analysis (default ["title", "description"])

    Response:
    - status: "ok" if successful
    - processed_count: number of reports processed
    - transaction_count: number of valid transactions
    - frequent_itemsets_count: number of frequent itemsets found
    - rules_count: number of association rules generated
    - duration_ms: processing time in milliseconds
    - api_payload: { global: {...}, by_category: {...} }
    """
    try:
        start_time = time.time()
        warnings = []

        # If no reports provided, try to fetch from Supabase
        reports_list = request.reports
        if not reports_list:
            if not SUPABASE_CLIENT:
                raise HTTPException(status_code=400, detail="No reports provided and Supabase not configured")
            
            logger.info("Fetching reports from Supabase...")
            try:
                response = SUPABASE_CLIENT.table("reports").select("report_id,title,description,category,province,city,district,incident_date").execute()
                reports_list = response.data
                if not reports_list:
                    raise HTTPException(status_code=400, detail="No reports found in database")
                logger.info(f"Fetched {len(reports_list)} reports from Supabase")
            except Exception as e:
                logger.error(f"Failed to fetch reports from Supabase: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to fetch reports: {str(e)}")

        # Convert reports to DataFrame
        if not reports_list:
            raise HTTPException(status_code=400, detail="No reports provided")

        # Handles both ReportInput objects and raw dicts (from Supabase)
        if reports_list and hasattr(reports_list[0], "model_dump"):
            df = pd.DataFrame([r.model_dump() for r in reports_list])
        else:
            df = pd.DataFrame(reports_list)

        logger.info(f"DataFrame columns: {df.columns.tolist()}")
        logger.info(f"Total rows: {len(df)}")

        # Check if text_columns is in dataframe
        for col in request.text_columns:
            if col not in df.columns:
                logger.error(f"Column '{col}' not found in data! Available: {df.columns.tolist()}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Column '{col}' not found in reports data. Available columns: {df.columns.tolist()}"
                )
            non_null = df[col].notna().sum()
            logger.info(f"Column '{col}': {non_null}/{len(df)} non-null values")

        logger.info(f"Processing {len(df)} reports with min_support={DEFAULT_MIN_SUPPORT}, min_confidence={DEFAULT_MIN_CONFIDENCE}")

        # Run pipeline
        result = pipeline_from_reports(
            df,
            text_columns=request.text_columns,
            min_support=DEFAULT_MIN_SUPPORT,
            min_confidence=DEFAULT_MIN_CONFIDENCE,
            top_n_category_itemsets=DEFAULT_TOP_N_CATEGORY_ITEMSETS,
            taxonomy=TAXONOMY,
            slang_dictionary=SLANG_DICTIONARY,
            category_column="category",
        )

        # Extract metrics
        processed_df = result["processed_df"]
        transactions = result["transactions"]
        frequent_itemsets_df = result["frequent_itemsets_df"]
        rules_df = result["rules_df"]
        api_payload = result["api_payload"]

        # Count empty descriptions
        empty_count = processed_df["source_text"].isna().sum() + (processed_df["source_text"] == "").sum()
        if empty_count > 0:
            warnings.append(f"{empty_count} reports had empty text and were skipped")

        duration_ms = (time.time() - start_time) * 1000

        logger.info(f"Analysis complete: {len(transactions)} transactions, {len(frequent_itemsets_df)} itemsets, {len(rules_df)} rules in {duration_ms:.1f}ms")

        return AnalyzeResponse(
            status="ok",
            processed_count=len(processed_df),
            transaction_count=len(transactions),
            frequent_itemsets_count=len(frequent_itemsets_df),
            rules_count=len(rules_df),
            duration_ms=duration_ms,
            api_payload=api_payload,
            warnings=warnings if warnings else None,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    # Run from ai-services folder: python api.py
    uvicorn.run("api:app", host="0.0.0.0", port=8000, log_level="info", reload=True)
