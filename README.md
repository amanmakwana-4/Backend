# BeyondChats Backend

A Node.js backend for scraping, rewriting, and managing blog articles using AI.

## 🏗️ Architecture

```
beyondchats-backend/
├── src/
│   ├── config/
│   │   ├── db.js           # MongoDB connection
│   │   ├── env.js          # Environment variables
│   │   └── llm.js          # OpenAI configuration
│   │
│   ├── models/
│   │   └── Article.model.js
│   │
│   ├── controllers/
│   │   ├── article.controller.js
│   │   └── scrape.controller.js
│   │
│   ├── services/
│   │   ├── beyondChatsScraper.service.js
│   │   ├── googleSearch.service.js
│   │   ├── contentScraper.service.js
│   │   ├── llmRewrite.service.js
│   │   └── articlePublish.service.js
│   │
│   ├── routes/
│   │   ├── article.routes.js
│   │   └── scrape.routes.js
│   │
│   ├── scripts/
│   │   └── autoRewrite.script.js
│   │
│   ├── utils/
│   │   ├── logger.js
│   │   └── textCleaner.js
│   │
│   ├── app.js
│   └── server.js
│
├── .env
├── package.json
└── README.md
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file with:

```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/beyondchats?retryWrites=true&w=majority

# OpenAI
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4

# BeyondChats
BEYONDCHATS_BLOG_URL=https://beyondchats.com/blogs/
API_BASE_URL=http://localhost:5000/api
```

### 3. Start the Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

### 4. Run Automation Script

```bash
npm run scrape
```

## 📡 API Endpoints

### Article CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/articles` | Fetch all articles (paginated) |
| GET | `/api/articles/:id` | Fetch single article |
| POST | `/api/articles` | Create new article |
| PUT | `/api/articles/:id` | Update article |
| DELETE | `/api/articles/:id` | Delete article |

#### Query Parameters for GET /api/articles

- `status` - Filter by status (`original` or `rewritten`)
- `source` - Filter by source
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sort` - Sort field (default: `-createdAt`)

### Scraping

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scrape/beyondchats` | Scrape BeyondChats blog |
| GET | `/api/scrape/status` | Get scraping statistics |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | API health status |

## 📊 Article Model

```javascript
{
  title: String,
  slug: String,
  originalContent: String,
  rewrittenContent: String,
  references: [{ title: String, url: String }],
  status: 'original' | 'rewritten',
  source: String,
  sourceUrl: String,
  metadata: {
    wordCount: Number,
    readingTime: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 🔄 Workflow

### Phase 1: Scraping

1. Call `POST /api/scrape/beyondchats` to scrape articles
2. Articles are saved with `status: 'original'`

### Phase 2: Auto Rewrite

1. Run `npm run scrape` (or `node src/scripts/autoRewrite.script.js`)
2. Script fetches articles with `status: 'original'`
3. For each article:
   - Searches Google for related content
   - Scrapes reference articles
   - Sends to LLM for rewriting
   - Updates article with `status: 'rewritten'`

## 🛠️ Services

| Service | Purpose |
|---------|---------|
| `beyondChatsScraper` | Scrapes BeyondChats blog |
| `googleSearch` | Searches Google for references |
| `contentScraper` | Extracts article content |
| `llmRewrite` | Rewrites using OpenAI |
| `articlePublish` | Updates articles via API |

## ⚠️ Important Notes

### Google Blocking
- The script includes delays to avoid rate limiting
- For production, consider using Google Custom Search API
- Proxy rotation may be needed for high volume

### LLM Usage
- Uses OpenAI GPT-4 by default
- Configure `OPENAI_MODEL` for different models
- Monitor API usage to control costs

## 📝 Example API Calls

### Scrape BeyondChats

```bash
curl -X POST http://localhost:5000/api/scrape/beyondchats \
  -H "Content-Type: application/json" \
  -d '{"count": 5}'
```

### Get All Articles

```bash
curl http://localhost:5000/api/articles?status=original&limit=10
```

### Get Single Article

```bash
curl http://localhost:5000/api/articles/<article_id>
```

### Update Article

```bash
curl -X PUT http://localhost:5000/api/articles/<article_id> \
  -H "Content-Type: application/json" \
  -d '{"status": "rewritten", "rewrittenContent": "..."}'
```

## 🔧 Future Enhancements

- [ ] Add cron job scheduling
- [ ] Implement job queue (Bull/Redis)
- [ ] Add rate limiting middleware
- [ ] Implement caching layer
- [ ] Add authentication/authorization
- [ ] Add webhook notifications
- [ ] Implement retry logic for failed rewrites

## 📄 License

ISC
