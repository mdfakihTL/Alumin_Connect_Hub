# MIT Knowledge Base - MVP/Demo Implementation

This is a **dummy/MVP implementation** of a university-specific knowledge base for hackathon/demo purposes.

## ⚠️ WHAT'S DUMMY (Will Change in Production)

| Feature | Current (Dummy) | Production |
|---------|-----------------|------------|
| Vector Database | None (keyword matching) | Pinecone/FAISS |
| Document Storage | Local filesystem | AWS S3 |
| Universities | Single (MIT) hardcoded | Multi-tenant |
| Authentication | None | JWT-based |
| Retrieval | Keyword overlap scoring | Vector embeddings + cosine similarity |
| File Types | .txt only | PDF, DOCX, etc. |

## 📁 Folder Structure

```
backend/
├── data/
│   └── knowledge_base/
│       └── mit/                    # MIT-specific documents
│           ├── mit_admissions.txt
│           ├── mit_academics.txt
│           ├── mit_campus_life.txt
│           └── mit_alumni.txt
├── app/
│   ├── services/
│   │   └── knowledge_base.py      # Core service (chunking, retrieval)
│   └── api/
│       └── routes/
│           └── knowledge_base.py  # API endpoints
```

## 🚀 API Endpoints

### Admin Endpoints (No Auth Required for Demo)

#### Upload Document
```bash
POST /api/v1/admin/knowledge-base/upload
Content-Type: multipart/form-data

# Example with curl:
curl -X POST "http://localhost:8000/api/v1/admin/knowledge-base/upload" \
  -F "file=@my_document.txt"
```

#### List Documents
```bash
GET /api/v1/admin/knowledge-base/documents

# Response:
[
  {"filename": "mit_admissions.txt", "size_bytes": 1234, "university_id": "mit"},
  ...
]
```

#### Delete Document
```bash
DELETE /api/v1/admin/knowledge-base/documents/{filename}
```

#### Get Status
```bash
GET /api/v1/admin/knowledge-base/status

# Response:
{
  "university_id": "mit",
  "university_name": "Massachusetts Institute of Technology",
  "document_count": 4,
  "chunk_count": 22,
  "documents": ["mit_admissions.txt", ...],
  "is_dummy": true,
  "notes": "..."
}
```

### Chat Endpoint

#### Ask a Question
```bash
POST /api/v1/chat/query
Content-Type: application/json

{
  "question": "What are the admission requirements for MIT?"
}

# Response:
{
  "answer": "Based on the MIT knowledge base...",
  "sources": ["mit_admissions.txt"],
  "university_id": "mit",
  "university_name": "Massachusetts Institute of Technology",
  "context_used": "...",
  "is_dummy": true
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Optional | For AI-generated answers. Falls back to simple context display if not set. |

### On Render

The `OPENAI_API_KEY` is already added to `render.yaml` but set to `sync: false`.
You need to manually add the key in Render dashboard:

1. Go to your service in Render
2. Navigate to Environment
3. Add `OPENAI_API_KEY` with your OpenAI API key

## 🧪 Testing Locally

```bash
# Activate virtualenv
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install new dependency
pip install openai==1.12.0

# Run the server
python -m uvicorn app.main:app --reload --port 8000

# Test the status endpoint
curl http://localhost:8000/api/v1/admin/knowledge-base/status

# Test chat
curl -X POST http://localhost:8000/api/v1/chat/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What are MIT admission requirements?"}'
```

## 📝 How It Works

### Document Loading (On Startup)
1. App starts → loads all `.txt` files from `/data/knowledge_base/mit/`
2. Each document is split into ~500 character chunks with 50 char overlap
3. Chunks stored in memory (lost on restart)

### Query Flow (Simple RAG)
```
User Question
    ↓
Keyword Extraction (remove stop words)
    ↓
Score each chunk (keyword overlap)
    ↓
Get top 3 chunks as context
    ↓
Pass context + question to OpenAI (or show raw context)
    ↓
Return answer with sources
```

### Keyword Matching (Dummy Retrieval)
- Extracts words from question
- Removes common stop words
- Calculates overlap with chunk content
- Ranks by overlap percentage

## 🎯 Limitations

1. **No semantic understanding** - "admissions process" won't match "how to apply"
2. **In-memory storage** - Data resets on each restart (but reloads from files)
3. **Single university** - Hardcoded to MIT
4. **No authentication** - Anyone can upload/delete documents
5. **Text files only** - No PDF, DOCX, etc.

## 🚧 Future Improvements (Production)

- [ ] Add vector embeddings (OpenAI ada-002 or sentence-transformers)
- [ ] Use Pinecone/FAISS for vector storage
- [ ] Support multiple universities (multi-tenant)
- [ ] Add proper authentication
- [ ] Support PDF/DOCX parsing
- [ ] Use S3 for document storage
- [ ] Add document versioning
- [ ] Implement streaming responses

## 📊 Sample Documents Included

| File | Content |
|------|---------|
| `mit_admissions.txt` | Admission requirements, deadlines, financial aid |
| `mit_academics.txt` | Schools, majors, GIRs, research opportunities |
| `mit_campus_life.txt` | Housing, dining, activities, health services |
| `mit_alumni.txt` | Alumni network, benefits, giving back |

---

**Remember:** This is a demo implementation. Do not use in production without proper security, authentication, and scalable infrastructure!

