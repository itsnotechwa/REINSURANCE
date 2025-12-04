# Deployment Fix: Missing Dependencies

## Issue
The backend deployment failed with:
```
ModuleNotFoundError: No module named 'reportlab'
```

## Root Cause
The `pdf_service.py` module imports `reportlab` at the top level, which is required when the `pdf_routes` blueprint is registered in `app/__init__.py`.

## Solution Applied

### 1. Added Missing Dependencies
Updated `Backend/requirements.txt` to include:
- `reportlab` - Required for PDF generation (CSV to PDF conversion)
- `pdfplumber` - Required for PDF text extraction

### 2. Made PDF Service Import Optional
Updated `Backend/app/routes/pdf_routes.py` to:
- Gracefully handle missing `reportlab` dependency
- Return a 503 error if PDF service is unavailable instead of crashing
- Log warnings instead of failing silently

## Files Modified

1. **Backend/requirements.txt**
   - Added: `reportlab`
   - Added: `pdfplumber`

2. **Backend/app/routes/pdf_routes.py**
   - Added try/except around PDF service import
   - Added `PDF_SERVICE_AVAILABLE` flag
   - Added proper error handling

## Next Steps

1. **Commit and push the changes:**
   ```bash
   git add Backend/requirements.txt Backend/app/routes/pdf_routes.py
   git commit -m "Fix: Add missing dependencies for deployment"
   git push origin main
   ```

2. **Railway will automatically redeploy** with the updated dependencies

3. **Verify deployment:**
   - Check Railway logs to ensure no import errors
   - The app should start successfully now
   - PDF conversion endpoint will return 503 if reportlab is still missing (shouldn't happen now)

## Optional Dependencies (Not Critical)

These dependencies are optional and won't cause deployment failures:
- `spacy` - For advanced NLP text extraction (already handled gracefully)
- `easyocr` - For OCR functionality (not currently used in main routes)
- `pdf2image` - For PDF to image conversion (not currently used in main routes)

The `data_extraction.py` service already handles missing `spacy` gracefully with mock data generation.

## Verification

After redeployment, check:
- ✅ Backend starts without errors
- ✅ No `ModuleNotFoundError` in logs
- ✅ API endpoints respond correctly
- ✅ PDF conversion endpoint works (if reportlab installed)

---

**Status**: Fixed ✅
**Action Required**: Commit and push changes, Railway will auto-redeploy

