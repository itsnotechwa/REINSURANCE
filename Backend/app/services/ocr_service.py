import pdfplumber
import easyocr
from werkzeug.exceptions import BadRequest
import os
import tempfile
from pdf2image import convert_from_path
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def process_pdf(pdf_path: str) -> str:
    """Process a PDF file and extract text using pdfplumber and easyocr."""
    if not os.path.exists(pdf_path):
        raise BadRequest(f"PDF file not found: {pdf_path}")
    if not pdf_path.lower().endswith('.pdf'):
        raise BadRequest("File must be a PDF")

    extracted_text = []
    try:
        # Try extracting text with pdfplumber (works for native text PDFs)
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    extracted_text.append(text)
        
        # If little or no text is extracted, try OCR with easyocr
        if not extracted_text or all(len(t.strip()) < 10 for t in extracted_text):
            logger.info("Falling back to OCR for %s", pdf_path)
            reader = easyocr.Reader(['en'])
            # Convert PDF pages to images
            with tempfile.TemporaryDirectory() as temp_dir:
                images = convert_from_path(pdf_path)
                for i, image in enumerate(images):
                    image_path = os.path.join(temp_dir, f"page_{i}.png")
                    image.save(image_path, 'PNG')
                    # Perform OCR
                    results = reader.readtext(image_path, detail=0)
                    extracted_text.append(' '.join(results))
        
        return '\n'.join([t for t in extracted_text if t]).strip()
    except Exception as e:
        logger.error("Error processing PDF %s: %s", pdf_path, str(e))
        raise BadRequest(f"Failed to process PDF: {str(e)}")
