# Developer Onboarding & Quickstart Guide — KripaConnect

> **Platform:** KripaConnect Monorepo  
> **Includes:** Frontend (React 19), Backend API (Node.js/Express), RAG Microservice (Python/FastAPI), Mobile (TWA)  
> **Status:** Active Development  
> **Last Updated:** September 2026  

---

## 1. Prerequisites

Ensure you have the following installed on your local development machine:

- **Node.js:** v18.0.0 or higher (`node -v`)
- **npm:** v9.0.0 or higher (`npm -v`)
- **Python:** v3.10 or higher (`python --version`)
- **MongoDB:** Local MongoDB daemon (`mongod`) OR a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster URI.
- **Redis:** Local Redis instance OR a free [Upstash Redis](https://upstash.com/) database.
- **Git:** Standard git client.
- *(Optional for Android APK):* JDK 17+ and Android Studio with SDK build tools.

---

## 2. Quickstart: Running Locally

### Step 1: Clone the Repository
```bash
git clone https://github.com/imkunal01/KripaConnect-App.git
cd KripaConnect-App
```

---

### Step 2: Set Up & Start the Backend API

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` configuration:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and fill in your `MONGO_URI`, `JWT_SECRET`, and payment/email credentials (see [Doc/.env.example](file:///c:/Users/Kunal/Desktop/Projects/SKE/Doc/.env.example)).*

4. Seed initial products and categories:
   ```bash
   npm run seed
   ```
5. Start the backend server:
   ```bash
   npm run start
   ```
   *The backend runs at `http://localhost:5000`.*

---

### Step 3: Set Up & Start the Frontend (React + Vite)

1. Open a new terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure frontend environment:
   ```bash
   cp .env.example .env
   ```
   *Ensure `VITE_API_BASE_URL=http://localhost:5000`.*

4. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   *Open your browser and navigate to `http://localhost:5173`.*

---

### Step 4: Set Up & Start the RAG Recommendation Microservice

1. Open a new terminal and navigate to `RAG_kc/`:
   ```bash
   cd RAG_kc
   ```
2. Create and activate a Python virtual environment:
   - **Windows (PowerShell):**
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure `.env`:
   ```bash
   cp .env.example .env
   ```
   *Provide `GROQ_API_KEY` (or `GEMINI_API_KEY`) and optional `PINECONE_API_KEY`.*

5. Start the microservice:
   ```bash
   python -m app.main
   ```
   *The RAG API runs at `http://localhost:8000`. Interactive Swagger documentation is available at `http://localhost:8000/docs`.*

6. Verify microservice health:
   ```bash
   python test_api.py
   ```

---

## 3. Key Verification & Test Scripts

The repository includes convenient validation scripts in `backend/scripts/`:

| Script Command | Purpose |
|---|---|
| `npm run seed` | Seeds categories and products from `backend/data/products.json` into MongoDB. |
| `npm run test:razorpay` | Validates Razorpay API credentials and attempts a mock order creation. |
| `npm run test:email` | Sends a test email via SendGrid to verify API key and sender identity. |
| `npm run check:payment` | Queries Razorpay for payment status of a given payment ID. |
| **API Testing Suite** | Comprehensive Postman collection: [`KripaConnect_API_Postman_Collection.json`](file:///c:/Users/Kunal/Desktop/Projects/SKE/KripaConnect_API_Postman_Collection.json) (See [Doc/API_TESTING_GUIDE.md](file:///c:/Users/Kunal/Desktop/Projects/SKE/Doc/API_TESTING_GUIDE.md)). |

---

## 4. Common Troubleshooting & FAQs

### Q1: I see `⚠️ UPSTASH_REDIS_REST_URL not configured - Redis caching disabled`.
- **Solution:** This is a graceful fallback warning. The backend automatically switches to direct MongoDB queries. To enable caching, create a free database at [Upstash](https://upstash.com) and set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `backend/.env`.

### Q2: Google OAuth button fails with `origin_mismatch`.
- **Solution:** Add `http://localhost:5173` and `http://localhost:3000` to the "Authorized JavaScript Origins" in your Google Cloud Console OAuth 2.0 Client ID settings.

### Q3: Razorpay checkout modal does not appear.
- **Solution:** Ensure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set in `backend/.env`. For local testing, use Razorpay Test Key credentials (`rzp_test_...`).

### Q4: RAG microservice reports `Pinecone is not configured`.
- **Solution:** The microservice automatically falls back to local in-memory cosine similarity search when Pinecone is not configured. Natural language search and LLM synthesis remain fully functional.
