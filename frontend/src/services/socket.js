import { io } from 'socket.io-client'
import { BASE_URL } from './api.js'

let socket = null

export function getSocket() {
  if (!socket) {
    socket = io(BASE_URL, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => {
      // connected
    })

    socket.on('connect_error', (err) => {
      console.warn('Socket connection warning:', err?.message || err)
    })
  }

  return socket
}

export function subscribeToOrder(orderId, callback) {
  if (!orderId || !callback) return () => {}

  const s = getSocket()
  s.emit('join:order', orderId)

  const handler = (updatedOrder) => {
    const uId = updatedOrder?._id || updatedOrder?.id
    if (String(uId) === String(orderId)) {
      callback(updatedOrder)
    }
  }

  s.on('order:updated', handler)

  return () => {
    s.emit('leave:order', orderId)
    s.off('order:updated', handler)
  }
}

export function subscribeToUserOrders(userId, callback) {
  if (!userId || !callback) return () => {}

  const s = getSocket()
  s.emit('join:user', userId)

  const handler = (updatedOrder) => {
    callback(updatedOrder)
  }

  s.on('order:updated', handler)

  return () => {
    s.off('order:updated', handler)
  }
}

export function subscribeToAdminOrders(callback) {
  if (!callback) return () => {}

  const s = getSocket()
  s.emit('join:admin')

  const handler = (updatedOrder) => {
    callback(updatedOrder)
  }

  s.on('order:updated', handler)

  return () => {
    s.off('order:updated', handler)
  }
}
