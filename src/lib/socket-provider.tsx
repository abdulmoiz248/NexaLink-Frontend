"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
})

export const useSocket = () => useContext(SocketContext)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const userId = localStorage.getItem("userId")
    if (!userId) return

    // Make sure we have the correct URL
    const socketUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000"

    // Configure Socket.IO with explicit options
    const socketInstance = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    // Connection events
    socketInstance.on("connect", () => {
      console.log("Socket connected in provider")
      setIsConnected(true)
      socketInstance.emit("join", userId)
    })

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected in provider")
      setIsConnected(false)
    })

    socketInstance.on("connect_error", (err) => {
      console.error("Socket connection error in provider:", err)
      setIsConnected(false)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  return <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>
}

