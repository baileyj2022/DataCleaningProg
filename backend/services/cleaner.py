import pandas as pd
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


def remove_duplicates(df: pd.DataFrame):
    before = len(df)
    df = df.drop_duplicates()
    return df, {"duplicates_removed": before - len(df)}


def remove_empty_rows(df: pd.DataFrame):
    before = len(df)
    df = df.dropna(how="all")
    return df, {"empty_rows_removed": before - len(df)}


def remove_empty_columns(df: pd.DataFrame):
    before = len(df.columns)
    df = df.dropna(axis=1, how="all")
    return df, {"empty_columns_removed": before - len(df.columns)}


def strip_whitespace(df: pd.DataFrame):
    str_cols = df.select_dtypes(include="object").columns
    df[str_cols] = df[str_cols].apply(lambda col: col.str.strip())
    return df, {"whitespace_stripped": True}


def fix_data_types(df: pd.DataFrame):
    df = df.infer_objects()
    for col in df.select_dtypes(include="object").columns:
        converted = pd.to_numeric(df[col], errors="ignore")
        if converted.dtype != df[col].dtype:
            df[col] = converted
    return df, {"data_types_fixed": True}


def fill_nulls(df: pd.DataFrame, strategy: str = "mean"):
    num_cols = df.select_dtypes(include="number").columns
    filled = 0
    for col in num_cols:
        null_count = df[col].isna().sum()
        if null_count == 0:
            continue
        if strategy == "mean":
            df[col] = df[col].fillna(df[col].mean())
        elif strategy == "median":
            df[col] = df[col].fillna(df[col].median())
        elif strategy == "mode":
            df[col] = df[col].fillna(df[col].mode().iloc[0] if not df[col].mode().empty else df[col])
        filled += null_count
    return df, {"nulls_filled": int(filled)}


def standardize_case(df: pd.DataFrame, case: str = "lower"):
    str_cols = df.select_dtypes(include="object").columns
    for col in str_cols:
        if case == "lower":
            df[col] = df[col].str.lower()
        elif case == "upper":
            df[col] = df[col].str.upper()
        elif case == "title":
            df[col] = df[col].str.title()
    return df, {"case_standardized": case}


def run_cleaning_pipeline(df: pd.DataFrame, config: dict):
    report = {}

    if config.get("remove_duplicates"):
        df, r = remove_duplicates(df)
        report.update(r)

    if config.get("remove_empty_rows"):
        df, r = remove_empty_rows(df)
        report.update(r)

    if config.get("remove_empty_columns"):
        df, r = remove_empty_columns(df)
        report.update(r)

    if config.get("strip_whitespace"):
        df, r = strip_whitespace(df)
        report.update(r)

    if config.get("fix_data_types"):
        df, r = fix_data_types(df)
        report.update(r)

    if config.get("fill_nulls"):
        strategy = config.get("null_strategy", "mean")
        df, r = fill_nulls(df, strategy=strategy)
        report.update(r)

    if config.get("standardize_case"):
        case = config.get("case_format", "lower")
        df, r = standardize_case(df, case=case)
        report.update(r)

    return df, report
