from fastapi import FastAPI
from db import db
from pydantic import BaseModel
from typing import List, Dict, Any

# helper logic for cleaning and summary
from services.cleaner import calculate_summary, apply_operations

app = FastAPI()

@app.get("/health")
async def health():
    names = await db.list_collection_names()
    return {"ok": True, "collections": names}

@app.post("/seed")
async def seed():
    result = await db["test_records"].insert_one(
        {"source": "fastapi", "status": "connected", "timestamp": "seeded"}
    )
    return {"inserted_id": str(result.inserted_id)}


# new preview endpoint that echoes data back and includes a summary

class PreviewRequest(BaseModel):
    headers: List[str]
    rows: List[Dict[str, Any]]
    operations: List[str] = []

@app.post("/preview")
async def preview(request: PreviewRequest):
    # apply any requested operations (currently a stub)
    cleaned_rows = apply_operations(request.headers, request.rows, request.operations)
    summary = calculate_summary(request.headers, cleaned_rows)

    return {
        "headers": request.headers,
        "rows": cleaned_rows,
        "operations_applied": request.operations,
        "original_row_count": len(request.rows),
        "preview_row_count": len(cleaned_rows),
        "source": "backend",
        "summary": summary,
    }