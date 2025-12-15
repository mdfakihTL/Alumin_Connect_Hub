# S3 Configuration for Render - Quick Setup

## Error You're Seeing
```
S3 client not initialized. Please configure AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and S3_BUCKET_NAME in environment variables.
```

## Quick Fix Steps

### 1. Get Your AWS S3 Credentials

You need these 4 values:
- **AWS Access Key ID**
- **AWS Secret Access Key**
- **AWS Region** (e.g., `us-east-1`)
- **S3 Bucket Name** (e.g., `ios-developer-tledch`)

### 2. Add to Render Environment Variables

1. **Go to Render Dashboard**
   - Navigate to: https://dashboard.render.com
   - Click on your backend service

2. **Open Environment Tab**
   - Click on **"Environment"** tab in the left sidebar

3. **Add These 4 Variables**

   Click **"Add Environment Variable"** for each:

   **Variable 1:**
   - Key: `AWS_ACCESS_KEY_ID`
   - Value: `your_aws_access_key_here`

   **Variable 2:**
   - Key: `AWS_SECRET_ACCESS_KEY`
   - Value: `your_aws_secret_key_here`

   **Variable 3:**
   - Key: `AWS_REGION`
   - Value: `us-east-1` (or your bucket's region)

   **Variable 4:**
   - Key: `S3_BUCKET_NAME`
   - Value: `ios-developer-tledch` (or your bucket name)

4. **Save Changes**
   - Click **"Save Changes"** button
   - Render will automatically redeploy (~2-3 minutes)

### 3. Verify Configuration

After redeploy, test by:
1. Creating a post with an image
2. Check Render logs for: `"File uploaded successfully: [URL]"`
3. Check S3 bucket for uploaded file

## Example Configuration

```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
S3_BUCKET_NAME=ios-developer-tledch
```

## Where to Find AWS Credentials

### If You Don't Have AWS Credentials:

1. **Go to AWS Console**: https://console.aws.amazon.com
2. **IAM Service**:
   - Search for "IAM" in services
   - Click "Users" → "Create user"
   - Name: `alumni-portal-s3-user`
   - Enable "Programmatic access"
3. **Attach Policy**:
   - Search for `AmazonS3FullAccess` or create custom policy with:
     - `s3:PutObject`
     - `s3:PutObjectAcl`
     - `s3:GetObject`
     - `s3:DeleteObject`
4. **Create Access Key**:
   - After user creation, go to "Security credentials" tab
   - Click "Create access key"
   - Choose "Application running outside AWS"
   - **Save the Access Key ID and Secret Access Key** (shown only once!)

### If You Already Have Credentials:

- Check your AWS IAM console
- Or check your `.env` file if you have one locally

## S3 Bucket Setup

Make sure your S3 bucket:
- ✅ Exists: `ios-developer-tledch` (or your bucket name)
- ✅ Has public read access for `alumni-portal-posts-uploads/*`
- ✅ CORS configured (see S3_SERVICE_STATUS.md)

## Troubleshooting

### Still Getting Error After Adding Variables?

1. **Check Variable Names**:
   - Must be exactly: `AWS_ACCESS_KEY_ID` (not `AWS_ACCESS_KEY`)
   - Must be exactly: `AWS_SECRET_ACCESS_KEY` (not `AWS_SECRET_KEY`)
   - Must be exactly: `S3_BUCKET_NAME` (not `S3_BUCKET`)

2. **Check for Extra Spaces**:
   - No spaces before/after values
   - No quotes needed (Render adds them automatically)

3. **Wait for Redeploy**:
   - Changes take 2-3 minutes to deploy
   - Check deployment status in Render dashboard

4. **Check Render Logs**:
   - Look for "S3 client not initialized" (still not configured)
   - Look for "File uploaded successfully" (working!)

## After Configuration

Once configured, you should see in logs:
```
File uploaded successfully: https://ios-developer-tledch.s3.amazonaws.com/alumni-portal-posts-uploads/images/{uuid}.png
```

Instead of:
```
S3 client not initialized...
```

## Need Help?

If you don't have AWS credentials, I can help you:
1. Create AWS account
2. Set up S3 bucket
3. Create IAM user with proper permissions
4. Get the credentials

Let me know if you need help with any step!

