# Phase 0 — Kafka broker setup
I'm adding real-time delivery tracking to my MERN e-commerce app (KripaConnect) 
using Kafka. I need to provision a managed Kafka broker (Upstash Kafka, free tier) 
and create one topic called "delivery-location-updates" with 3-6 partitions.

Walk me through:
1. Signing up and creating the Kafka instance on Upstash
2. Creating the topic with the right partition count
3. Getting the broker URL, username, and password
4. Writing a throwaway Node script using kafkajs that sends one test message 
   and a separate script that consumes it, so I can confirm the connection 
   works before writing any real app code

# Phase 1 — Data model changes
I have an existing Mongoose `Order` model in backend/src/models/Order.js (paste 
your current schema). I'm adding real-time delivery tracking via Kafka + Redis.

Help me:
1. Add fields to the Order schema: deliveryAgent { name, phone, agentId }, 
   trackingEnabled (Boolean, default false)
2. Design the Redis key pattern for storing the current live location per order 
   (key: delivery:location:<orderId>, value: { lat, lng, updatedAt }, with a 
   ~2 hour TTL so it expires automatically)
3. Show me where to set trackingEnabled = true (when orderStatus moves to 
   'shipped') and where to clear/expire it (when orderStatus moves to 'delivered')

I already have a Redis client set up in src/config/redis.js — show me how to use 
it for this, don't set up a new connection.

# Phase 2 — Kafka client + producer route
I'm adding Kafka to my existing Node.js/Express backend (Express 5, paste relevant 
parts of server.js/index.js if helpful). I have a managed Kafka broker (Upstash) 
with these credentials: [broker URL, username, password — don't actually paste 
real secrets here, just confirm you have them in .env].

Help me build:
1. src/config/kafka.js — a kafkajs client + producer instance, with SASL/SSL 
   config for Upstash, connected once at server startup
2. Wire the producer connection into my existing index.js startup sequence 
   (I already call connectDB() there)
3. A new route POST /api/delivery/:orderId/location that:
   - is protected (reuses my existing JWT authMiddleware)
   - validates { lat, lng } in the body
   - sends a message to the "delivery-location-updates" topic, keyed by orderId, 
     payload { orderId, lat, lng, timestamp }
   - responds 200 immediately without waiting on anything downstream
4. Basic producer retry/error config so a broker hiccup doesn't crash the request

Also give me a quick way to verify messages are actually landing in the topic 
(Upstash console or CLI).

# Phase 3 — Consumers + Socket.IO
I now have a Kafka producer sending location updates to a topic called 
"delivery-location-updates", keyed by orderId, payload { orderId, lat, lng, timestamp }. 
This runs inside my existing Express backend.

Help me build, still inside the same backend process:
1. src/consumers/locationPersisterConsumer.js — a kafkajs consumer (its own 
   consumer group) that reads each message and writes the latest location to 
   Redis at key delivery:location:<orderId>
2. src/consumers/websocketPusherConsumer.js — a separate consumer (different 
   consumer group, same topic) that emits a Socket.IO event 'location-update' 
   to a room scoped to that order
3. Socket.IO setup in server.js — initialized on the same HTTP server, with a 
   'join-order-room' handler that verifies (server-side, using my existing auth) 
   that the connecting user actually owns that order before letting them join 
   the room
4. Start both consumers once at server boot, alongside the producer from before, 
   with error handling so a bad message doesn't crash the consumer loop

Also give me a simple socket.io-client test script I can run locally to confirm 
events are firing before I touch the frontend.

# Phase 4 — Frontend tracking page
I have a React 19 + Vite frontend with React Router v7, an AuthContext for auth 
state, and an existing OrderDetails page at /orders/:id. My backend now exposes:
- GET /api/delivery/:orderId/location (current location from Redis, for initial load)
- A Socket.IO server emitting 'location-update' events to rooms named order:<orderId>, 
  after the client emits 'join-order-room' with the orderId

Help me build:
1. A new route /orders/:id/track (lazy-loaded like my other routes) rendering a 
   TrackOrder page
2. socket.io-client setup: connect on mount, emit 'join-order-room', listen for 
   'location-update', clean up the connection on unmount
3. A live map using Leaflet (no API key needed) showing a marker that moves as 
   new location events arrive, centered on the delivery address initially
4. A "Track Order" button in my OrderTimeline/OrderDetails component that only 
   shows when orderStatus === 'shipped', linking to the new track page
5. A fallback: if no live socket event arrives within ~15s, poll the GET endpoint 
   instead, so the page doesn't look broken if the websocket connection drops

Show me the npm packages I need to install (socket.io-client, leaflet, 
react-leaflet) and the full component code.

# Phase 5 — Agent-side location sender
I need a simple page for delivery agents to broadcast their live GPS location 
while delivering an order. My backend has POST /api/delivery/:orderId/location 
(protected by JWT auth) which accepts { lat, lng }.

Help me build:
1. A new role-protected page /agent/deliver/:orderId in my React frontend, 
   accessible only to users with a delivery-agent role (tell me the simplest way 
   to add this role given I currently have customer/retailer/admin roles in my 
   User model and ProtectedRoute component)
2. Use navigator.geolocation.watchPosition() to get continuous GPS updates, 
   throttled to send a POST to the backend every 5-10 seconds (not on every 
   single watchPosition callback, to avoid spamming the API)
3. Basic UI: order info, a "Start Delivery" / "End Delivery" toggle, and a status 
   indicator showing whether location is currently being sent successfully
4. Stop sending updates when the agent taps "End Delivery" or navigates away

Also flag any browser permission/HTTPS considerations I should know about for 
geolocation to work reliably on mobile.

# Phase 6 — Status integration, cleanup, resilience
My delivery tracking system (Kafka -> Redis + Socket.IO -> React map) is working 
end to end. Now help me harden it:

1. Make sure trackingEnabled on the Order flips to true when orderStatus -> 
   'shipped' and false when orderStatus -> 'delivered', and that the "Track 
   Order" button respects this flag
2. When orderStatus -> 'delivered', stop the backend from accepting further 
   POSTs to /api/delivery/:orderId/location for that order (return 410 or similar)
3. Confirm the Redis key TTL is actually expiring location data after delivery 
   so old data doesn't linger
4. Review my kafkajs producer and consumer configs for sane retry/backoff 
   settings so temporary broker issues don't crash my Express process
5. Suggest what minimal logging/monitoring I should add (e.g. consumer lag, 
   failed location posts) given I'm running everything in-process on Render 
   without separate infra
