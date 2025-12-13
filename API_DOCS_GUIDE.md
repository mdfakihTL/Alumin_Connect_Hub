# 📚 API Documentation Website Guide

## Quick Start

1. **Open the documentation:**
   ```bash
   # Option 1: Open directly in browser
   open api-docs.html
   
   # Option 2: Serve with Python
   python3 -m http.server 8080
   # Then open: http://localhost:8080/api-docs.html
   
   # Option 3: Use VS Code Live Server extension
   # Right-click api-docs.html > Open with Live Server
   ```

2. **Change Base URL:**
   - Click "Change" button in the Overview section
   - Enter your API base URL (e.g., `http://localhost:8000` or `https://your-api.com`)

## Features

### 📋 Overview Tab
- **Base URL Configuration**: Set your API server URL
- **Authentication Guide**: Learn how to use JWT tokens
- **User Roles**: See all roles and default credentials
- **API Sections**: Quick overview of all API sections

### 🔌 All Endpoints Tab
- **Filter by Section**: Filter endpoints by category (Auth, Documents, Chat, etc.)
- **Filter by Role**: See endpoints available to specific roles
- **Filter by Method**: Filter by HTTP method (GET, POST, PUT, DELETE)
- **Search**: Search endpoints by path or description
- **Interactive Testing**: Test endpoints directly from the browser
- **Request/Response Examples**: See example payloads and responses

### 🔐 Role Matrix Tab
- **Complete Access Matrix**: See which roles can access which endpoints
- **Quick Reference**: Easy-to-read table format

### 🧪 Testing Guide Tab
- **Testing Scenarios**: 6 complete testing workflows
- **cURL Examples**: Copy-paste ready cURL commands
- **Step-by-step Guides**: Follow along with real scenarios

## Testing Endpoints

### Method 1: Interactive Tester (Built-in)
1. Go to "All Endpoints" tab
2. Find the endpoint you want to test
3. Enter your access token (if required)
4. Click "Test Request"
5. See the response in real-time

### Method 2: cURL (From Testing Guide)
1. Go to "Testing Guide" tab
2. Copy the cURL command
3. Replace `YOUR_ACCESS_TOKEN` with your actual token
4. Run in terminal

### Method 3: Swagger UI
1. Start your server: `uvicorn app.main:app --reload`
2. Open: http://localhost:8000/docs
3. Use the interactive Swagger interface

## Default Test Users

| Role | Username | Password | Email |
|------|----------|----------|-------|
| Super Admin | `superadmin` | `superadmin123` | superadmin@alumni-portal.com |
| University Admin | `university` | `university123` | university@alumni-portal.com |
| Alumni | `alumni` | `alumni123` | alumni@example.com |

## Testing Scenarios

### Scenario 1: Complete Alumni Flow
1. Register new alumni → Get tokens
2. Create alumni profile
3. Upload document
4. Search documents with AI
5. Chat with AI assistant

### Scenario 2: Admin Workflow
1. Login as university admin
2. Create event
3. Create job posting
4. View all users
5. Manage documents

### Scenario 3: Public Access
1. Browse events (no auth)
2. Browse jobs (no auth)
3. Browse alumni profiles (no auth)
4. Search documents (no auth)

## Tips

- **Bookmark the page**: Save `api-docs.html` for quick access
- **Update Base URL**: Change it when switching between local/production
- **Use Filters**: Quickly find endpoints by role or section
- **Copy cURL**: Use the Testing Guide tab for ready-to-use commands
- **Test Locally**: Use the interactive tester for quick validation

## Troubleshooting

### "CORS Error" when testing
- Make sure your API server has CORS enabled
- Check `CORS_ORIGINS` in your `.env` file

### "401 Unauthorized"
- Make sure you're using a valid access token
- Token might be expired (use refresh endpoint)

### "404 Not Found"
- Check that your base URL is correct
- Make sure the server is running

### Interactive tester not working
- Check browser console for errors
- Make sure you're using a modern browser (Chrome, Firefox, Edge)

## Sharing with Team

1. **Host on GitHub Pages:**
   - Commit `api-docs.html` to your repo
   - Enable GitHub Pages
   - Share the URL with your team

2. **Host on Server:**
   - Upload `api-docs.html` to your web server
   - Access via URL

3. **Local File:**
   - Share the file directly
   - Team members can open it locally

## Customization

The HTML file is self-contained and can be customized:
- Change colors in the `<style>` section
- Add more endpoints in the `endpoints` array
- Modify testing scenarios
- Add your company branding

---

**Happy Testing! 🚀**

