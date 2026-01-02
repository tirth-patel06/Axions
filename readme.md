# 🤖 Axions - AI-Powered GitHub Automation Platform

<div align="center">

![Axions Logo](client/public/logo.png)

**Automate your GitHub workflow with AI-powered code reviews and issue management**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-green.svg)](https://mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Live Demo](https://axions-ai.vercel.app/) • [API Server](https://axions-server.vercel.app/) • [Documentation](#architecture) • [Contributing](#contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [How It Works](#how-it-works)
- [Analytics Dashboard](#analytics-dashboard)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## 🎯 Overview

**Axions** is a SaaS platform that integrates with GitHub to provide:

1. **🔍 AI-Powered Code Reviews** - Automatically reviews pull requests and provides inline comments with suggestions
2. **🏷️ Smart Issue Labeling** - Automatically categorizes and labels issues based on content
3. **📝 Issue Summarization** - Generates concise summaries for new issues
4. **📊 Analytics Dashboard** - Track your team's productivity and code quality metrics

### The Problem It Solves

- **Code Review Bottleneck**: Senior developers spend hours reviewing PRs manually
- **Inconsistent Issue Triage**: Issues sit unlabeled, making prioritization hard
- **Lack of Visibility**: No insights into review patterns and team productivity

### The Solution

Axions acts as an AI teammate that:
- Reviews every PR instantly with consistent quality
- Labels and summarizes issues automatically
- Provides actionable analytics to improve your workflow

---

## ✨ Features

### 🔍 AI Code Review
- **Inline Comments**: Line-by-line feedback on code changes
- **PR Summary**: Comprehensive review with overall assessment
- **Smart Detection**: Identifies bugs, security issues, and code smells
- **Instant Feedback**: Reviews posted within seconds of PR creation

### 🏷️ Issue Management
- **Auto-Labeling**: Categorizes issues (bug, feature, priority, etc.)
- **Color-Coded Labels**: Consistent label colors across repos
- **AI Summaries**: Concise issue summaries posted as comments

### 📊 Analytics Dashboard
- **Review Metrics**: PRs reviewed, comments posted, files analyzed
- **Issue Metrics**: Issues triaged, labels applied
- **Time Series**: Activity trends over time
- **Repo Comparison**: Compare performance across repositories
- **Error Tracking**: Monitor and debug failures

### 🔐 Security
- **GitHub OAuth**: Secure authentication via GitHub
- **Webhook Signatures**: HMAC-SHA256 verification for all webhooks
- **Token Encryption**: Secure storage of access tokens

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Styling |
| **React Router** | Navigation |
| **Recharts** | Analytics charts |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime |
| **Express** | Web framework |
| **MongoDB** | Database |
| **Mongoose** | ODM |
| **Passport.js** | GitHub OAuth |

### External Services
| Service | Purpose |
|---------|---------|
| **GitHub API** | Repository operations |
| **OpenAI / Groq** | LLM for code analysis |
| **Vercel** | Deployment |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AXIONS ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐
│   GitHub     │────▶│   Webhooks   │────▶│   Express Server     │
│  (PR/Issue)  │     │   Handler    │     │                      │
└──────────────┘     └──────────────┘     │  ┌────────────────┐  │
                                          │  │ Review Service │  │
┌──────────────┐                          │  └───────┬────────┘  │
│   React      │◀────────────────────────▶│          │           │
│   Frontend   │        REST API          │  ┌───────▼────────┐  │
└──────────────┘                          │  │  LLM Service   │  │
                                          │  │ (OpenAI/Groq)  │  │
┌──────────────┐                          │  └───────┬────────┘  │
│   MongoDB    │◀─────────────────────────│          │           │
│   Database   │                          │  ┌───────▼────────┐  │
└──────────────┘                          │  │ GitHub Service │  │
                                          │  └────────────────┘  │
                                          └──────────────────────┘
```

### Data Flow

```
1. PR/Issue Created on GitHub
        │
        ▼
2. GitHub sends Webhook to /api/webhooks/github
        │
        ▼
3. Verify signature & find connected repo
        │
        ▼
4. Route to appropriate handler:
   ├── PR → orchestrateReview()
   └── Issue → orchestrateIssueLabeling()
        │
        ▼
5. Fetch diff/content from GitHub API
        │
        ▼
6. Send to LLM for analysis
        │
        ▼
7. Post results back to GitHub
        │
        ▼
8. Record stats (locked, immutable)
        │
        ▼
9. Dashboard reads from rebuildRepoStats()
```

---

## 📁 Project Structure

```
Axions/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Logo.jsx
│   │   │   ├── MetricCard.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── StatCard.jsx
│   │   ├── hooks/             # Custom React hooks
│   │   │   └── useAnalyticsData.js
│   │   ├── lib/               # Utilities
│   │   │   └── api.js         # API client
│   │   ├── pages/             # Route pages
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── RepositoriesPage.jsx
│   │   │   ├── AnalyticsPage.jsx
│   │   │   ├── DeepAnalysisPage.jsx
│   │   │   ├── ErrorTrackingPage.jsx
│   │   │   └── ...
│   │   ├── services/          # API service layer
│   │   │   └── analyticsService.js
│   │   ├── App.jsx            # Root component
│   │   └── main.jsx           # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                    # Express backend
│   ├── api/
│   │   └── index.js           # Vercel serverless entry
│   ├── config/
│   │   └── passport.js        # GitHub OAuth config
│   ├── controllers/
│   │   ├── analyticsController.js
│   │   ├── authController.js
│   │   ├── repoController.js
│   │   └── webhookController.js
│   ├── lib/
│   │   └── mongoose.js        # DB connection
│   ├── middleware/
│   │   └── auth.js            # JWT verification
│   ├── models/                # MongoDB schemas
│   │   ├── ConnectedRepo.js
│   │   ├── ErrorLog.js
│   │   ├── IssueTriage.js
│   │   ├── PullRequestReview.js
│   │   ├── RepoStats.js
│   │   └── User.js
│   ├── routes/
│   │   ├── analytics.js
│   │   ├── auth.js
│   │   ├── github.js
│   │   ├── repos.js
│   │   └── webhooks.js
│   ├── services/              # Business logic
│   │   ├── githubService.js   # GitHub API wrapper
│   │   ├── llmService.js      # AI analysis
│   │   ├── reviewService.js   # PR review orchestration
│   │   └── statsService.js    # Analytics & stats
│   ├── app.js                 # Express app setup
│   ├── server.js              # Server entry point
│   └── package.json
│
└── README.md                  # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **MongoDB** (local or Atlas)
- **GitHub OAuth App** (for authentication)
- **OpenAI API Key** or **Groq API Key** (for AI analysis)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/axions.git
cd axions
```

### 2. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Set Up Environment Variables

Create `.env` files in both `server/` and `client/` directories.

**Server `.env`:**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/axions

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

# JWT
JWT_SECRET=your_super_secret_jwt_key

# LLM Provider (choose one)
OPENAI_API_KEY=sk-...
# or
GROQ_API_KEY=gsk_...

# Feature Flags
FEATURE_ISSUE_LABELING=true
FEATURE_ISSUE_SUMMARIZATION=true

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173
```

**Client `.env`:**
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Axions (Development)
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback`
4. Copy Client ID and Client Secret to your `.env`

### 5. Start Development Servers

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

### 6. Access the App

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔐 Environment Variables

### Server Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `GITHUB_CLIENT_ID` | ✅ | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | ✅ | GitHub OAuth App Client Secret |
| `GITHUB_CALLBACK_URL` | ✅ | OAuth callback URL |
| `JWT_SECRET` | ✅ | Secret for signing JWTs |
| `OPENAI_API_KEY` | ⚡ | OpenAI API key (or use Groq) |
| `GROQ_API_KEY` | ⚡ | Groq API key (or use OpenAI) |
| `FEATURE_ISSUE_LABELING` | ❌ | Enable auto-labeling (`true`/`false`) |
| `FEATURE_ISSUE_SUMMARIZATION` | ❌ | Enable auto-summarization (`true`/`false`) |
| `CLIENT_URL` | ✅ | Frontend URL for CORS |

### Client Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Backend API URL |

---

## 🗄️ Database Schema

### User
```javascript
{
  githubId: String,        // GitHub user ID
  username: String,        // GitHub username
  email: String,           // Email address
  avatarUrl: String,       // Profile picture
  accessToken: String,     // GitHub OAuth token (encrypted)
  createdAt: Date,
  updatedAt: Date
}
```

### ConnectedRepo
```javascript
{
  userId: ObjectId,        // Reference to User
  githubRepoId: Number,    // GitHub repository ID
  name: String,            // Repository name
  fullName: String,        // owner/repo
  owner: String,           // Repository owner
  isConnected: Boolean,    // Active connection status
  webhookId: Number,       // GitHub webhook ID
  webhookSecret: String,   // Webhook signature secret
  reviewCount: Number,     // Total reviews (legacy)
  lastReviewedAt: Date,
  createdAt: Date
}
```

### PullRequestReview
```javascript
{
  owner: String,
  repo: String,
  githubRepoId: Number,
  pull_number: Number,
  commit_id: String,       // SHA of reviewed commit
  userId: ObjectId,
  repoId: ObjectId,
  filesAnalyzed: Number,
  commentsPosted: Number,  // LOCKED on first insert
  confidence: String,
  analysis: Mixed,         // Full LLM response
  analyzedAt: Date
}
// Unique index: (githubRepoId, pull_number, commit_id)
```

### IssueTriage
```javascript
{
  owner: String,
  repo: String,
  githubRepoId: Number,
  issue_number: Number,
  userId: ObjectId,
  repoId: ObjectId,
  labelsApplied: [String], // LOCKED on first insert
  summary: String
}
// Unique index: (githubRepoId, issue_number)
```

### RepoStats (Derived Cache)
```javascript
{
  repoId: ObjectId,
  githubRepoId: Number,
  userId: ObjectId,
  totalPRsReviewed: Number,
  totalInlineComments: Number,  // Total comments (body + inline)
  totalIssuesTriaged: Number,
  totalLabelsApplied: Number,
  totalErrors: Number,
  lastActivityAt: Date
}
// Rebuilt from PullRequestReview + IssueTriage records
```

### ErrorLog
```javascript
{
  owner: String,
  repo: String,
  githubRepoId: Number,
  pull_number: Number,
  userId: ObjectId,
  error: String,
  errorStack: String,
  createdAt: Date
}
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/github` | Initiate GitHub OAuth |
| `GET` | `/api/auth/github/callback` | OAuth callback handler |
| `GET` | `/api/auth/user` | Get current user |
| `POST` | `/api/auth/logout` | Logout user |

### Repositories
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/repos` | List user's GitHub repos |
| `GET` | `/api/repos/connected` | List connected repos |
| `POST` | `/api/repos/:id/connect` | Connect a repository |
| `DELETE` | `/api/repos/:id/disconnect` | Disconnect a repository |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/webhooks/github` | GitHub webhook receiver |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/summary` | User-wide stats summary |
| `GET` | `/api/analytics/activity` | Recent activity feed |
| `GET` | `/api/analytics/time-series` | Review activity over time |
| `GET` | `/api/analytics/repos/comparison` | Compare repo performance |
| `GET` | `/api/analytics/comments/density` | Comment density analysis |
| `GET` | `/api/analytics/confidence` | Confidence distribution |
| `GET` | `/api/analytics/errors/trends` | Error rate trends |
| `GET` | `/api/analytics/heatmap` | Activity heatmap data |
| `GET` | `/api/analytics/issues/time-series` | Issue triage over time |
| `GET` | `/api/analytics/issues/analysis` | Issue triage analysis |
| `GET` | `/api/analytics/labels/distribution` | Label usage distribution |

---

## ⚙️ How It Works

### PR Review Flow

```
1. Developer creates/updates a PR
        │
        ▼
2. GitHub sends webhook (pull_request.opened/synchronize)
        │
        ▼
3. webhookController.js receives & verifies signature
        │
        ▼
4. reviewService.orchestrateReview() is called
        │
        ├── 4a. githubService.fetchDiff() - Get PR diff
        │
        ├── 4b. llmService.analyzeDiff() - AI analysis
        │        └── Returns: { inlineComments, filesAnalyzed, confidence }
        │
        ├── 4c. llmService.generatePRTextSummary() - Create review body
        │
        ├── 4d. githubService.postReview() - Post to GitHub
        │
        └── 4e. statsService.recordReview() - Save to DB (locked)
                 └── commentsPosted = 1 (body) + N (inline)
```

### Issue Labeling Flow

```
1. User creates a new issue
        │
        ▼
2. GitHub sends webhook (issues.opened)
        │
        ▼
3. webhookController.orchestrateIssueLabeling()
        │
        ├── 3a. llmService.generateIssueLabels() - Get labels
        │
        ├── 3b. githubService.applyColoredLabels() - Apply to issue
        │
        ├── 3c. llmService.generateIssueSummary() - Create summary
        │
        ├── 3d. githubService.postIssueSummaryComment() - Post comment
        │
        └── 3e. statsService.recordIssueTriage() - Save to DB (locked)
```

### Stats Architecture (Corruption-Proof)

```
┌─────────────────────────────────────────────────────────────┐
│                    STATS ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ❌ OLD (Broken):                                            │
│  Webhook → $inc RepoStats → Corruption from retries         │
│                                                              │
│  ✅ NEW (Fixed):                                             │
│  Webhook → Upsert Record (locked) → rebuildRepoStats()      │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Key Rules:                                                  │
│  1. PullRequestReview.commentsPosted - SET ONCE, never      │
│     updated (locked on first insert via $setOnInsert)       │
│                                                              │
│  2. IssueTriage.labelsApplied - SET ONCE, never updated     │
│     (if issue already triaged, skip entirely)               │
│                                                              │
│  3. RepoStats - NEVER use $inc, always rebuild from         │
│     immutable PullRequestReview + IssueTriage records       │
│                                                              │
│  4. rebuildRepoStats() - Single source of truth,            │
│     called before dashboard reads                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Analytics Dashboard

### Dashboard Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Overview with key metrics and recent activity |
| **Repositories** | Manage connected repositories |
| **Analytics** | Detailed charts and time-series data |
| **Deep Analysis** | Comment density, confidence distribution |
| **Error Tracking** | Monitor failures and error rates |
| **Profile** | User settings and account info |

### Metrics Tracked

- **PRs Reviewed**: Total pull requests analyzed
- **Comments Posted**: Review body + inline comments
- **Issues Triaged**: Issues with labels/summaries applied
- **Labels Applied**: Unique labels per issue
- **Error Rate**: Failed reviews / total attempts
- **Avg Comments/PR**: Code quality indicator

---

## 🚢 Deployment

### Vercel Deployment

Both client and server are configured for Vercel deployment.

**Server (`server/vercel.json`):**
```json
{
  "version": 2,
  "builds": [
    { "src": "api/index.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "api/index.js" }
  ]
}
```

**Client (`client/vercel.json`):**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Deploy Steps

1. **Push to GitHub**
2. **Import to Vercel** (both client and server as separate projects)
3. **Set Environment Variables** in Vercel dashboard
4. **Update OAuth Callback URL** to production server URL
5. **Update `CLIENT_URL`** to production client URL

### Production Checklist

- [ ] Set all environment variables in Vercel
- [ ] Update GitHub OAuth App with production URLs
- [ ] Enable MongoDB Atlas IP whitelist for Vercel
- [ ] Test webhook delivery from GitHub
- [ ] Verify CORS configuration

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Run tests** (if available)
5. **Commit with clear messages**
   ```bash
   git commit -m "feat: add new analytics chart"
   ```
6. **Push and create a PR**

### Code Style

- Use **ESLint** for JavaScript linting
- Use **Prettier** for formatting
- Follow **conventional commits** for commit messages

### Key Files to Understand

| File | What It Does |
|------|--------------|
| `server/services/reviewService.js` | Orchestrates the entire PR review flow |
| `server/services/llmService.js` | All AI/LLM interactions |
| `server/services/statsService.js` | Analytics and stats aggregation |
| `server/controllers/webhookController.js` | Handles GitHub webhooks |
| `client/src/hooks/useAnalyticsData.js` | Frontend data fetching |

---

## 🔧 Troubleshooting

### Common Issues

#### Webhooks Not Received
- Check webhook secret matches in GitHub and `.env`
- Verify webhook URL is publicly accessible
- Check GitHub webhook delivery logs

#### Stats Showing Wrong Numbers
- Run `rebuildRepoStats()` to recalculate from source records
- Check for duplicate records in database
- Verify unique indexes exist on collections

#### OAuth Errors
- Verify callback URL matches exactly (including trailing slashes)
- Check client ID and secret are correct
- Ensure GitHub OAuth App is not suspended

#### LLM Errors
- Verify API key is valid and has credits
- Check rate limits on OpenAI/Groq
- Review error logs for specific failure messages

### Debug Commands

```bash
# Check MongoDB connection
mongosh $MONGODB_URI --eval "db.stats()"

# View webhook logs
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/repos/OWNER/REPO/hooks/HOOK_ID/deliveries

# Test LLM connection
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [GitHub API](https://docs.github.com/en/rest) for repository integration
- [OpenAI](https://openai.com/) / [Groq](https://groq.com/) for LLM capabilities
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Recharts](https://recharts.org/) for analytics visualizations

---

<div align="center">

**Built with ❤️ by the Axions Team**

[⬆ Back to Top](#-axions---ai-powered-github-automation-platform)

</div>
