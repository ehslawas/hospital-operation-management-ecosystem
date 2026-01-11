# Contract PDF Storage Bucket Fix

## Issue
When clicking "View PDF" in the Contract Catalog, you're getting a 404 error: `{"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}`

## Root Cause
The PDF links are trying to access a Supabase storage bucket that doesn't exist. The code now defaults to using the `documents` bucket, but it may not exist in your Supabase project.

## Solution

### Option 1: Create the `documents` Storage Bucket (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to your project: https://supabase.com/dashboard
   - Select your project

2. **Create Storage Bucket**
   - Go to **Storage** → **Buckets**
   - Click **"New Bucket"**
   - **Name**: `documents`
   - **Public bucket**: ✅ **Enable** (check this box - PDFs need to be publicly accessible)
   - **File size limit**: Leave default or set as needed (e.g., 50 MB)
   - Click **"Create bucket"**

3. **Set Bucket Policies (Optional but Recommended)**
   - Click on the `documents` bucket
   - Go to **Policies** tab
   - Add a policy for public read access:
     - **Policy name**: `Public Read Access`
     - **Allowed operation**: `SELECT` (read)
     - **Target roles**: `anon`, `authenticated`
     - **Policy definition**:
       ```sql
       true
       ```
     - Click **"Save policy"**

4. **Upload PDF Files**
   - Once the bucket is created, you can upload contract PDF files to it
   - Files should be uploaded to paths like: `contracts/{filename}.pdf`
   - Example: `contracts/contract-001.pdf`

5. **Update Database `document_url` Values**
   - After uploading PDFs, update the `document_url` field in the `contracts` table
   - The URL format should be:
     ```
     https://{your-project-ref}.supabase.co/storage/v1/object/public/documents/contracts/{filename}.pdf
     ```
   - Or just the path: `documents/contracts/{filename}.pdf` (the code will construct the full URL)

### Option 2: Use an Existing Bucket

If you already have a storage bucket (e.g., `files`, `uploads`, `contracts`), you can:

1. **Update the code** to use your existing bucket name, OR
2. **Update database `document_url` values** to use the full URL pointing to your existing bucket

### Option 3: Store Complete URLs in Database

If your PDFs are stored elsewhere (external server, different storage service), you can:

1. Store the **complete URL** (starting with `http://` or `https://`) in the `document_url` field
2. The code will detect complete URLs and use them directly without trying to construct Supabase storage URLs

## Code Changes Made

The code has been updated to:
1. Try `documents` bucket first (instead of `contracts`)
2. Handle complete URLs correctly (if `document_url` contains a full URL)
3. Provide better error messages with instructions
4. Support multiple bucket name formats

## Verification

After creating the bucket:
1. Try clicking "View PDF" again
2. Check the browser console for `[PDF]` log messages showing the resolved URL
3. The PDF should open in a new tab if the bucket and file exist

## Troubleshooting

### Still Getting 404 Errors?

1. **Check the actual `document_url` value in database:**
   ```sql
   SELECT id, contract_number, item_name, document_url, sst_rate 
   FROM contracts 
   WHERE document_url IS NOT NULL 
   LIMIT 5;
   ```

2. **Verify the bucket exists:**
   - Go to Supabase Dashboard → Storage → Buckets
   - Check if `documents` bucket exists and is public

3. **Check file path:**
   - If `document_url` is `documents/contracts/file.pdf`, verify the file exists at that path in the bucket
   - The path is case-sensitive

4. **Test direct URL:**
   - Construct the full URL manually:
     ```
     https://{project-ref}.supabase.co/storage/v1/object/public/documents/{path-from-document_url}
     ```
   - Try opening it directly in a browser
   - If it works, the code should work too

## Next Steps

1. ✅ Create the `documents` bucket in Supabase
2. ✅ Set it to public
3. ✅ Upload your contract PDF files
4. ✅ Update `document_url` values in the database with correct paths or full URLs
5. ✅ Test the "View PDF" links in the Contract Catalog

