from typing import List, Dict, Any

# placeholder for a set of markers considered missing
MISSING_MARKERS = {"", "na", "n/a", "nan", "null", "none", "undefined", "-", "--"}


def is_missing(value: Any) -> bool:
    if value is None:
        return True
    try:
        s = str(value).strip().lower()
    except Exception:
        return False
    return s in MISSING_MARKERS


def calculate_summary(headers: List[str], rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Return a simple health score and missing-data breakdown like the frontend utils."""
    total_cells = len(headers) * len(rows)
    filled_cells = 0
    column_missing = {h: 0 for h in headers}

    for row in rows:
        for h in headers:
            val = row.get(h)
            if is_missing(val):
                column_missing[h] += 1
            else:
                filled_cells += 1

    health = round((filled_cells / total_cells) * 100) if total_cells > 0 else 0

    # simple color wheel to keep parity with frontend
    colors = ["var(--accent-blue)", "var(--accent-amber)", "var(--accent-rose)", "var(--accent-green)"]

    all_missing = []
    for idx, h in enumerate(headers):
        count = column_missing.get(h, 0)
        pct = round((count / len(rows)) * 100) if rows else 0
        if pct > 0:
            all_missing.append({"label": h, "value": pct, "color": colors[idx % len(colors)]})

    all_missing.sort(key=lambda x: x["value"], reverse=True)
    missing_data = all_missing[:5]

    return {"health": health, "missingData": missing_data, "allMissing": all_missing}


def apply_operations(headers: List[str], rows: List[Dict[str, Any]], operations: List[str]) -> List[Dict[str, Any]]:
    """Stub for cleaning operations; currently just returns rows unchanged.

    In future this could implement mean/median fills, predictions, etc.
    """
    # no modifications for now
    return rows
import pandas as pd

def run_cleaning_pipeline(df: pd.DataFrame, config: dict):
    report = {}

    if config.get("remove_duplicates"):
        before = len(df)
        df = df.drop_duplicates()
        report["duplicates_removed"] = before - len(df)

    if config.get("remove_empty_rows"):
        before = len(df)
        df = df.dropna(how="all")
        report["empty_rows_removed"] = before - len(df)

    if config.get("remove_empty_columns"):
        before = len(df.columns)
        df = df.dropna(axis=1, how="all")
        report["empty_columns_removed"] = before - len(df.columns)

    return df, report
