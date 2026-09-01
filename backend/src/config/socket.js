const { Server } = require("socket.io");

let io = null;

function initSocket(server, corsOptions = {}) {
  if (io) return io;

  io = new Server(server, {
    cors: corsOptions,
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    // Client joins order-specific room for live status changes
    socket.on("join:order", (orderId) => {
      if (orderId) {
        socket.join(`order:${orderId}`);
      }
    });

    socket.on("leave:order", (orderId) => {
      if (orderId) {
        socket.leave(`order:${orderId}`);
      }
    });

    // Client joins user-specific room for notifications
    socket.on("join:user", (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    // Admin joins admin-wide orders room
    socket.on("join:admin", () => {
      socket.join("admin:orders");
    });

    socket.on("disconnect", () => {
      // Cleaned up automatically by Socket.io
    });
  });

  console.log("✅ Socket.io initialized");
  return io;
}

function getIO() {
  return io;
}

function emitOrderUpdate(order) {
  if (!io || !order) return;
  const orderId = order._id ? order._id.toString() : order.id?.toString();
  const userId = order.user ? (order.user._id ? order.user._id.toString() : order.user.toString()) : null;

  if (orderId) {
    io.to(`order:${orderId}`).emit("order:updated", order);
  }
  if (userId) {
    io.to(`user:${userId}`).emit("order:updated", order);
  }
  io.to("admin:orders").emit("order:updated", order);
}

module.exports = {
  initSocket,
  getIO,
  emitOrderUpdate,
};
