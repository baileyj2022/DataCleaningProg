import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()

        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="File is empty.")

        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        with open(file_path, "wb") as f:
            f.write(contents)

        return {
            "message": "File received successfully",
            "filename": file.filename,
            "saved_path": file_path
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
