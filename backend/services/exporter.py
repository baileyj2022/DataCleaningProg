import pandas as pd
import io


def export_data(df: pd.DataFrame, format: str):
    if format == "csv":
        return export_csv(df)
    elif format == "xlsx":
        return export_excel(df)
    elif format == "json":
        return export_json(df)
    elif format == "pdf":
        return export_pdf(df)
    else:
        raise ValueError(f"Unsupported format: {format}")


def export_csv(df: pd.DataFrame):
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    stream.seek(0)
    return io.BytesIO(stream.getvalue().encode()), "text/csv", "cleaned_data.csv"


def export_excel(df: pd.DataFrame):
    stream = io.BytesIO()
    with pd.ExcelWriter(stream, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Cleaned Data")
    stream.seek(0)
    return stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "cleaned_data.xlsx"


def export_json(df: pd.DataFrame):
    stream = io.BytesIO()
    stream.write(df.to_json(orient="records").encode())
    stream.seek(0)
    return stream, "application/json", "cleaned_data.json"


def export_pdf(df: pd.DataFrame):
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet

    stream = io.BytesIO()
    doc = SimpleDocTemplate(stream, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("Cleaned Data Report", styles["Title"]))
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(f"Total Rows: {len(df)}", styles["Normal"]))
    elements.append(Paragraph(f"Total Columns: {len(df.columns)}", styles["Normal"]))
    elements.append(Spacer(1, 20))

    table_data = [list(df.columns)] + df.head(50).astype(str).values.tolist()
    table = Table(table_data)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F3864")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ]))

    elements.append(table)
    doc.build(elements)
    stream.seek(0)
    return stream, "application/pdf", "cleaned_data_report.pdf"
