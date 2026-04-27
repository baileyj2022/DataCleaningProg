from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import io

router = APIRouter()

ALLOWED_TYPES = ["text/csv", "application/json", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]

@router.post("/preview")
async def preview_file(file: UploadFile = File(...)):
    try:
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload a CSV, Excel, or JSON file.")

        contents = await file.read()

        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="File is empty.")

        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith('.xlsx'):
            df = pd.read_excel(io.BytesIO(contents))
        elif file.filename.endswith('.json'):
            df = pd.read_json(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type.")

        summary = {
            "row_count": len(df),
            "column_count": len(df.columns),
            "columns": list(df.columns),
            "null_counts": df.isnull().sum().to_dict(),
            "duplicate_count": int(df.duplicated().sum())
        }

        preview_rows = df.head(50).fillna("").to_dict(orient="records")

        return {"summary": summary, "preview": preview_rows}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")