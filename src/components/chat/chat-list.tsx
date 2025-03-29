"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Search, UserPlus } from "lucide-react"
import axios from "axios"
import { io } from "socket.io-client"
import { Button } from "@/components/ui/button"

export interface User {
  _id: string
  username: string
  lastMessage: string
  lastMessageTime?: number
  unreadCount?: number
  gradient?: string
  isOnline?: boolean
}

const getRandomGradient = () => {
  const gradients = [
    "bg-gradient-to-r from-purple-500 to-pink-500",
    "bg-gradient-to-r from-blue-500 to-cyan-500",
    "bg-gradient-to-r from-green-500 to-lime-500",
    "bg-gradient-to-r from-yellow-500 to-orange-500",
    "bg-gradient-to-r from-red-500 to-purple-500",
  ]
  return gradients[Math.floor(Math.random() * gradients.length)]
}

export function ChatList() {
  const [filter, setFilter] = useState("")
  const [chats, setChats] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeUser, setActiveUser] = useState<string | null>(null)
  const [activeUsers, setActiveUsers] = useState<string[]>([])
  const [socket, setSocket] = useState<any>(null)

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_URL_Socket || "http://localhost:3001", {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    setSocket(socketInstance)

    socketInstance.on("connect", () => {
      console.log("Connected with socket id:", socketInstance.id)
      const username = localStorage.getItem("username")
      if (username) {
        console.log("Joining as:", username)
        socketInstance.emit("join", username)
        setActiveUser(username)
      } else {
        setActiveUser("No user Logged In")
        console.error("Username not found in localStorage")
      }
    })

    socketInstance.on("connect_error", (err) => {
      console.error("Socket connection error:", err)
    })

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected")
    })

    socketInstance.on("activeUsers", (users: string[]) => {
      console.log("Active users:", users)
      setActiveUsers(users)

      // Update online status of chats
      setChats((prevChats) =>
        prevChats.map((chat) => ({
          ...chat,
          isOnline: users.includes(chat.username),
        })),
      )
    })

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  // Handle new messages
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (data: { sender: string; receiver: string; message: string }) => {
      console.log("New message received in ChatList:", data)
      updateChatWithNewMessage(data)
    }

    socket.on("newMessage", handleNewMessage)

    return () => {
      socket.off("newMessage", handleNewMessage)
    }
  }, [socket, chats])

  // Fetch chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_URL || "http://localhost:3001"}/user/all`, {
          withCredentials: true,
        })

        // Get last messages for each user
        const usersWithMessages = await Promise.all(
          response.data.map(async (user: any) => {
            try {
              const messagesResponse = await axios.get(
                `${process.env.NEXT_PUBLIC_URL || "http://localhost:3001"}/chat/history?receiverId=${user.username}`,
                { withCredentials: true },
              )

              const chatHistory = messagesResponse.data
              let lastMessage = "No messages yet"
              let lastMessageTime = 0
              let unreadCount = 0

              // Check if we have messages in sender or receiver arrays
              if (chatHistory.sender && chatHistory.sender.length > 0) {
                const lastSenderMsg = chatHistory.sender[chatHistory.sender.length - 1]
                lastMessage = lastSenderMsg.message
                lastMessageTime = lastSenderMsg.time ? new Date(lastSenderMsg.time).getTime() : 0
                unreadCount = chatHistory.sender.filter((m: any) => !m.read).length
              }

              if (chatHistory.reciever && chatHistory.reciever.length > 0) {
                const lastReceiverMsg = chatHistory.reciever[chatHistory.reciever.length - 1]
                const receiverMsgTime = lastReceiverMsg.time ? new Date(lastReceiverMsg.time).getTime() : 0

                // Use the most recent message
                if (receiverMsgTime > lastMessageTime) {
                  lastMessage = lastReceiverMsg.message
                  lastMessageTime = receiverMsgTime
                }
              }

              // Check if user is online
              const isOnline = activeUsers.includes(user.username)

              return {
                _id: user._id,
                username: user.username,
                lastMessage,
                lastMessageTime,
                unreadCount,
                gradient: getRandomGradient(),
                isOnline,
              }
            } catch (err) {
              console.error(`Error fetching messages for ${user.username}:`, err)
              return {
                _id: user._id,
                username: user.username,
                lastMessage: "Click to start chatting",
                lastMessageTime: 0,
                unreadCount: 0,
                gradient: getRandomGradient(),
                isOnline: activeUsers.includes(user.username),
              }
            }
          }),
        )

        // Sort by last message time
        const sortedChats = usersWithMessages.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0))

        setChats(sortedChats)
      } catch (err) {
        console.error("Failed to fetch chats:", err)
        setError("Failed to fetch chats")
      } finally {
        setLoading(false)
      }
    }

    fetchChats()
  }, [activeUsers])

  // Update chat with new message
  const updateChatWithNewMessage = (data: { sender: string; receiver: string; message: string }) => {
    const { sender, receiver, message } = data

    setChats((prevChats) => {
      // Create a copy of the current chats
      const updatedChats = [...prevChats]

      // Determine which user ID to look for based on who the current user is
      const currentUsername = localStorage.getItem("username")
      const chatUsername = sender === currentUsername ? receiver : sender

      // Find the chat with this user
      const chatIndex = updatedChats.findIndex((chat) => chat.username === chatUsername)

      if (chatIndex !== -1) {
        // Update the chat with new message
        const updatedChat = {
          ...updatedChats[chatIndex],
          lastMessage: message,
          lastMessageTime: Date.now(),
          unreadCount: sender !== currentUsername ? (updatedChats[chatIndex].unreadCount || 0) + 1 : 0,
        }

        // Remove the chat from its current position
        updatedChats.splice(chatIndex, 1)

        // Add it to the beginning of the array
        updatedChats.unshift(updatedChat)

        return updatedChats
      } else {
        // If chat doesn't exist yet, create a new one
        const newChat = {
          _id: chatUsername, // Temporary ID
          username: chatUsername,
          lastMessage: message,
          lastMessageTime: Date.now(),
          unreadCount: sender !== currentUsername ? 1 : 0,
          gradient: getRandomGradient(),
          isOnline: activeUsers.includes(chatUsername),
        }

        return [newChat, ...prevChats]
      }
    })
  }

  const filteredChats = chats.filter(
    (chat) =>
      chat.username.toLowerCase().includes(filter.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(filter.toLowerCase()),
  )

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()

    // If message is from today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    }

    // If message is from this week, show day name
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" })
    }

    // Otherwise show date
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Chats</h1>
        <Button variant="ghost" size="icon">
          <UserPlus className="h-5 w-5" />
        </Button>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search conversations..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-9"
        />
      </div>

      {activeUser && (
        <div className="mb-4 text-center text-sm text-muted-foreground">
          Logged in as: <span className="font-medium">{activeUser}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Loading conversations...</p>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : filteredChats.length > 0 ? (
          <ul className="space-y-1">
            {filteredChats.map((chat) => (
              <li key={chat._id || chat.username}>
                <Link href={`/chat/${chat.username}`}>
                  <div className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted">
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-full text-white font-bold">
                      <div className={`absolute inset-0 rounded-full ${chat.gradient}`}></div>
                      <span className="z-10">{chat.username[0].toUpperCase()}</span>
                      {chat.isOnline && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">{chat.username}</h3>
                        {chat.lastMessageTime > 0 && (
                          <span className="text-xs text-muted-foreground">{formatTime(chat.lastMessageTime)}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                        {chat.unreadCount && chat.unreadCount > 0 && (
                          <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">No conversations found</p>
          </div>
        )}
      </div>
    </div>
  )
}

