# app/routes/pdf_routes.py
from flask import Blueprint, request, send_file
from app.services.pdf_service import csv_file_to_pdf

pdf_bp = Blueprint("pdf_bp", __name__)

@pdf_bp.route("/csv-to-pdf", methods=["POST"])
def convert_csv():
    if 'file' not in request.files:
        return {"error": "No file uploaded"}, 400

    file = request.files['file']

    if not file.filename.endswith(".csv"):
        return {"error": "Invalid file type"}, 400

    try:
        pdf_buffer = csv_file_to_pdf(file)
        return send_file(
            pdf_buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name="converted.pdf"
        )
    except Exception as e:
        print("CSV → PDF conversion error:", e)
        return {"error": str(e)}, 500
