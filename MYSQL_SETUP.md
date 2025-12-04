# MySQL Setup for Railway

## Changes Made

1. **Updated `requirements.txt`:**
   - Removed: `psycopg2-binary` (PostgreSQL driver)
   - Added: `pymysql` (MySQL driver for Python)

2. **Updated `Backend/app/__init__.py`:**
   - Added MySQL URL handling
   - Converts `mysql://` to `mysql+pymysql://` for SQLAlchemy
   - Still supports PostgreSQL if needed (backward compatible)

## Setting Up MySQL on Railway

### Step 1: Add MySQL Database

1. Go to **Railway Dashboard** → Your Project
2. Click **"+ New"** → **"Database"** → **"Add MySQL"**
3. Railway will automatically:
   - Create a MySQL database
   - Set the `DATABASE_URL` environment variable
   - Format: `mysql://user:password@host:port/database`

### Step 2: Verify Environment Variable

1. Go to your backend service → **Variables** tab
2. You should see `DATABASE_URL` automatically set by Railway
3. It should look like: `mysql://user:password@host:port/database`

### Step 3: Deploy

1. Commit and push the changes:
   ```bash
   git add Backend/requirements.txt Backend/app/__init__.py
   git commit -m "Switch from PostgreSQL to MySQL"
   git push origin main
   ```

2. Railway will automatically redeploy
3. The app will use MySQL automatically

## How It Works

Your code now handles MySQL URLs:

```python
# Railway provides: mysql://user:pass@host:port/db
# Code converts to: mysql+pymysql://user:pass@host:port/db
# SQLAlchemy uses PyMySQL driver to connect
```

## Database URL Formats

- **MySQL (Railway):** `mysql://user:password@host:port/database`
- **After conversion:** `mysql+pymysql://user:password@host:port/database`
- **SQLite (Local):** `sqlite:///path/to/database.db` (when DATABASE_URL not set)

## Migration Notes

If you had PostgreSQL before:

1. **Remove PostgreSQL service** from Railway (if you want to switch completely)
2. **Add MySQL service** as described above
3. **Database tables** will be created automatically on first run (via `db.create_all()`)
4. **Data migration:** If you had existing data, you'll need to export from PostgreSQL and import to MySQL (or start fresh)

## Testing

After deployment, check Railway logs to ensure:
- ✅ MySQL connection successful
- ✅ Tables created successfully
- ✅ No database errors

## Troubleshooting

**Connection errors:**
- Verify `DATABASE_URL` is set in Railway
- Check MySQL service is running in Railway
- Ensure `pymysql` is in `requirements.txt`

**Table creation issues:**
- Check Railway logs for SQL errors
- Verify database permissions
- Ensure `db.create_all()` runs on startup

---

**Note:** Your existing code will work the same way - just using MySQL instead of PostgreSQL. SQLAlchemy abstracts the database differences.

