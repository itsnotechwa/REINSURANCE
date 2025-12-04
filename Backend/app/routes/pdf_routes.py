# app/routes/pdf_routes.py
from flask import Blueprint, request, send_file
import logging

logger = logging.getLogger(__name__)

# Try to import pdf_service, but handle gracefully if reportlab is not available
try:
    from app.services.pdf_service import csv_file_to_pdf
    PDF_SERVICE_AVAILABLE = True
except ImportError as e:
    logger.warning("PDF service not available: %s", str(e))
    PDF_SERVICE_AVAILABLE = False

pdf_bp = Blueprint("pdf_bp", __name__)

@pdf_bp.route("/csv-to-pdf", methods=["POST"])
def convert_csv():
    if not PDF_SERVICE_AVAILABLE:
        return {"error": "PDF conversion service is not available. Please install reportlab."}, 503
    
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
        logger.error("CSV → PDF conversion error: %s", str(e))
        return {"error": str(e)}, 500
