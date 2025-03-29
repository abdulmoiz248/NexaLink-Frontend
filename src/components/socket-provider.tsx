"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useRef } from "react"
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
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // This code only runs in the browser
    const userId = localStorage.getItem("userId")
    if (!userId) return

    // Get the backend URL from environment variable or use default
    const SOCKET_URL = process.env.NEXT_PUBLIC_URL || "http://localhost:8000"
    console.log(`Connecting to socket server at: ${SOCKET_URL}`)

    // Create socket instance with explicit configuration
    const socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket"], // Try with only websocket first
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      forceNew: true, // Force a new connection
    })

    // Set up event listeners
    socketInstance.on("connect", () => {
      console.log(`Socket connected with ID: ${socketInstance.id}`)
      setIsConnected(true)

      // Emit join event after successful connection
      console.log(`Emitting join event with userId: ${userId}`)
      socketInstance.emit("join", userId)
    })

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message)
      setIsConnected(false)
    })

    socketInstance.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${reason}`)
      setIsConnected(false)
    })

    // Store socket in ref
    socketRef.current = socketInstance

    // Clean up on unmount
    return () => {
      console.log("Cleaning up socket connection")
      if (socketInstance) {
        socketInstance.disconnect()
      }
    }
  }, []) // Empty dependency array ensures this runs once on mount

  return <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>{children}</SocketContext.Provider>
}

