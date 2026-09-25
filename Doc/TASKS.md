# Project Roadmap, Backlog & AI Execution Playbook — KripaConnect

> **Purpose:** Actionable backlog, current implementation status, and step-by-step recipes for AI agents and developers to rapidly pick up and execute new features.  
> **Status:** Active Roadmap  
> **Last Updated:** September 2026  

---

## 1. Current Feature Completion Matrix

| Module | Sub-Feature | Status | Notes |
|---|---|---|---|
| **Auth** | Email / Password (bcrypt) | ✅ Complete | With role-based authorization |
| **Auth** | Google OAuth 2.0 | ✅ Complete | Identity Services token verification |
| **Auth** | SendGrid OTP & Password Reset | ✅ Complete | Temporary tokens with expiry |
| **Catalog** | Category & Subcategory Hierarchy | ✅ Complete | Populated with seed scripts |
| **Catalog** | Product CRUD & Stock Management | ✅ Complete | Includes CSV bulk import |
| **Catalog** | Upstash Redis Caching | ✅ Complete | Cache-aside with automatic invalidation |
| **Purchasing** | B2C Retail Mode | ✅ Complete | Standard pricing & cart |
| **Purchasing** | B2B Wholesale Mode | ✅ Complete | Minimum order quantity & wholesale pricing |
| **Payments** | Razorpay Gateway & Webhook | ✅ Complete | Signature verification & audit logs |
| **Payments** | Cash on Delivery (COD) | ✅ Complete | Status transitions & receipts |
| **Invoicing** | Automated PDF Invoicing | ✅ Complete | GST breakdown via PDFKit |
| **Admin** | Dashboard & Recharts Analytics | ✅ Complete | Revenue, order counts, trends |
| **Admin** | Banner & Review Management | ✅ Complete | Carousel controls & moderation |
| **AI (RAG)** | SentenceTransformers Embeddings | ✅ Complete | 384-dimensional dense vectors |
| **AI (RAG)** | Pinecone Vector Store | ✅ Complete | Cloud index with in-memory fallback |
| **AI (RAG)** | Groq / Gemini LLM Generation | ✅ Complete | Semantic answers & comparison |
| **AI (RAG)** | Express Backend Proxy & Fallback | ✅ Complete | Native MongoDB regex search fallback |
| **Mobile** | Progressive Web App (PWA) | ✅ Complete | Service worker & manifest |
| **Mobile** | Android Trusted Web Activity (TWA)| ✅ Complete | Digital Asset Links & release APKs |
| **Tracking** | Kafka Real-Time Delivery Stream | ⏳ Planned | Specification in `Tracker_Kafka.md` |
| **Testing** | Automated Unit & Integration Tests | ⏳ In Progress | Seed scripts and manual tests exist |

---

## 2. Priority AI Execution Backlog

The following tasks are broken down into **executable recipes** for AI agents. When instructed to work on a task, follow the recipe in order.

---

### Task 1: Real-Time Delivery Tracking via Kafka & WebSockets

#### Context & Goal
Allow delivery agents to emit live GPS pings while orders are in transit (`orderStatus: 'shipped'`), streaming them through Kafka to Upstash Redis and pushing live coordinate updates to the customer's tracking screen via Socket.IO.

#### Implementation Recipe
1. **Dependencies:**
   - In `backend/`: ensure `kafkajs` is installed (`npm install kafkajs`).
2. **Kafka Client Configuration (`backend/src/config/kafka.js`):**
   - Create KafkaJS client with SASL/SSL credentials (`KAFKA_BROKER_URL`, `KAFKA_USERNAME`, `KAFKA_PASSWORD`).
   - Export connected `producer` and helper `createConsumer(groupId)`.
3. **Kafka Producer Service (`backend/src/services/kafkaProducerService.js`):**
   - Create `sendLocationUpdate(orderId, { lat, lng, timestamp })`.
   - Publish to topic `delivery-location-updates` keyed by `orderId`.
4. **Location Consumers (`backend/src/consumers/`):**
   - `locationPersisterConsumer.js`: Listens to `delivery-location-updates`, writes to Upstash Redis: `SET delivery:location:<orderId>` (TTL 7200s).
   - `websocketPusherConsumer.js`: Listens to `delivery-location-updates`, emits: `io.to('order:' + orderId).emit('location-update', data)`.
5. **Backend Route (`backend/src/routes/deliveryRoutes.js`):**
   - `POST /api/delivery/:orderId/location` (Agent pings location).
   - `GET /api/delivery/:orderId/location` (Fetches latest cached coordinates from Redis).
6. **Frontend Tracking View:**
   - Create `frontend/src/pages/OrderTrackingPage.jsx`.
   - Connect via `socket.io-client` to room `order:<orderId>`.
   - Render Leaflet / Mapbox / Google Map with live moving vehicle marker.

---

### Task 2: Advanced RAG Conversational Search Widget

#### Context & Goal
Enhance [`frontend/src/components/SmartSearchModal.jsx`](file:///c:/Users/Kunal/Desktop/Projects/SKE/frontend/src/components/SmartSearchModal.jsx) with multi-turn conversation memory, category chips, and clickable price filter suggestions.

#### Implementation Recipe
1. **Frontend Service Enhancement (`frontend/src/services/recommendations.js`):**
   - Add conversation history parameter `history: [{ role, content }]` to `getSmartRecommendations(query, history, limit)`.
2. **RAG Microservice Update (`RAG_kc/app/api/recommendations.py`):**
   - Update `RecommendationRequest` to accept `conversation_history: Optional[List[Dict[str, str]]]`.
   - Pass conversation context into `app/rag/generator.py` for context-aware follow-ups (e.g. *"Show me cheaper options"*).
3. **Modal UI Enhancements (`frontend/src/components/SmartSearchModal.jsx`):**
   - Add suggested query chips: *"Best laptops for coding under 60k"*, *"Trending party wear"*, *"Wholesale bulk snacks"*.
   - Render comparison cards with direct "Add to Cart" buttons.

---

### Task 3: Comprehensive Automated Testing Suite

#### Context & Goal
Build automated integration tests for the backend API and RAG microservice to guarantee zero regressions during AI refactoring.

#### Implementation Recipe
1. **Backend Integration Tests (`backend/tests/`):**
   - Install `jest` and `supertest` in `backend/`: `npm install -D jest supertest`.
   - Configure `backend/jest.config.js`.
   - Create `backend/tests/auth.test.js`: Test register, login, refresh token, role protection.
   - Create `backend/tests/products.test.js`: Test list products, caching hit/miss, stock checks.
   - Create `backend/tests/orders.test.js`: Test order creation, Razorpay signature validation, status updates.
2. **RAG Service Tests (`RAG_kc/test_api.py`):**
   - Add Pytest assertions verifying `/health/deps` reports valid dependency statuses.
   - Add mock tests for `/api/recommend` asserting fallback behavior when Pinecone or Groq is unreachable.

---

### Task 4: Unified Docker Development Environment

#### Context & Goal
Enable developers to spin up the entire KripaConnect stack with a single command.

#### Implementation Recipe
1. **Root `docker-compose.yml`:**
   - Define services: `mongodb`, `redis`, `backend`, `frontend`, and `rag_microservice`.
   - Connect all services to a shared network `kripaconnect-net`.
   - Map ports:
     - `frontend`: 5173 -> 5173
     - `backend`: 5000 -> 5000
     - `rag_microservice`: 8000 -> 8000
     - `mongodb`: 27017 -> 27017
     - `redis`: 6379 -> 6379
2. **Dockerfiles:**
   - Review `backend/dockerfile` and `frontend/dockerfile`.
   - Add `RAG_kc/dockerfile` using `python:3.11-slim`.

---

### Task 5: Payment Failure Recovery & Webhook Idempotency

#### Context & Goal
Ensure Razorpay webhooks cannot be processed twice and provide automated recovery for failed or abandoned checkouts.

#### Implementation Recipe
1. **Webhook Idempotency (`backend/src/controllers/paymentController.js`):**
   - Check if `Transaction` with `gatewayTransactionId` already exists before updating order status.
   - Return HTTP 200 immediately if event has already been processed.
2. **Abandoned Cart Follow-Up:**
   - Add scheduled job (or cron) checking for orders in `paymentStatus: 'pending'` older than 2 hours.
   - Trigger reminder email via SendGrid with a one-click payment resumption link.
