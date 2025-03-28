"use client"

import { useState, useRef, useEffect } from "react"
import { MessageInput } from "@/components/chat/message-input"
import { MessageItem } from "@/components/chat/message-item"
import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

// Mock message type
type Message = {
  id: string
  senderId: string
  text: string
  timestamp: Date
  status: "sending" | "sent" | "delivered" | "read"
}

// Mock user type
type User = {
  id: string
  name: string
  avatar: string
  status: "online" | "offline" | "away"
}

// Mock initial messages
const initialMessages: Message[] = [
  {
    id: "1",
    senderId: "user1",
    text: "Hey there! How's it going?",
    timestamp: new Date(Date.now() - 3600000 * 2), // 2 hours ago
    status: "read",
  },
  {
    id: "2",
    senderId: "currentUser",
    text: "Hi! I'm doing well, thanks for asking. Just working on this new project.",
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    status: "read",
  },
  {
    id: "3",
    senderId: "user1",
    text: "That sounds interesting! What kind of project is it?",
    timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
    status: "read",
  },
  {
    id: "4",
    senderId: "currentUser",
    text: "It's a chat application with a futuristic design. I'm trying to make it look clean and minimal.",
    timestamp: new Date(Date.now() - 600000), // 10 minutes ago
    status: "delivered",
  },
  {
    id: "5",
    senderId: "user1",
    text: "That sounds awesome! I'd love to see it when you're done.",
    timestamp: new Date(Date.now() - 60000), // 1 minute ago
    status: "delivered",
  },
]

type ChatScreenProps = {
  user: User
}

export function ChatScreen({ user }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Simulate typing indicator
  useEffect(() => {
    const typingTimeout = setTimeout(() => {
      setIsTyping(false)
    }, 3000)

    return () => clearTimeout(typingTimeout)
  }, [isTyping])

  // Handle sending a new message
  const handleSendMessage = (text: string) => {
    if (!text.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: "currentUser",
      text,
      timestamp: new Date(),
      status: "sending",
    }

    setMessages([...messages, newMessage])

    // Simulate message being sent and delivered
    setTimeout(() => {
      setMessages((prev) => prev.map((msg) => (msg.id === newMessage.id ? { ...msg, status: "sent" } : msg)))
    }, 500)

    setTimeout(() => {
      setMessages((prev) => prev.map((msg) => (msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg)))
    }, 1500)

    // Simulate typing indicator after sending a message
    setTimeout(() => {
      setIsTyping(true)
    }, 2000)

    // Simulate response after typing
    setTimeout(() => {
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        senderId: user.id,
        text: "That's great! I'm looking forward to seeing more of your work.",
        timestamp: new Date(),
        status: "delivered",
      }
      setMessages((prev) => [...prev, responseMessage])
      setIsTyping(false)
    }, 5000)
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Chat Header */}
      <header className="flex items-center justify-between border-b border-[#334155] p-4">
        <div className="flex items-center">
          <Link href="/chat" className="mr-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center">
            <div className="relative mr-3">
              <Image
                src={user.avatar || "/placeholder.svg"}
                alt={user.name}
                width={40}
                height={40}
                className="rounded-full"
              />
              <span
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#1E293B] ${
                  user.status === "online" ? "bg-[#10B981]" : user.status === "away" ? "bg-[#F59E0B]" : "bg-[#6B7280]"
                }`}
              ></span>
            </div>
            <div>
              <h2 className="font-medium">{user.name}</h2>
              <p className="text-xs text-slate-400">
                {user.status === "online" ? "Online" : user.status === "away" ? "Away" : "Offline"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-white">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isOwnMessage={message.senderId === "currentUser"}
              senderName={message.senderId === "currentUser" ? "You" : user.name}
              senderAvatar={message.senderId === "currentUser" ? "/placeholder.svg?height=40&width=40" : user.avatar}
            />
          ))}
          {isTyping && (
            <div className="flex items-start gap-3">
              <Image
                src={user.avatar || "/placeholder.svg"}
                alt={user.name}
                width={40}
                height={40}
                className="rounded-full"
              />
              <div className="rounded-2xl rounded-tl-none bg-[#1E293B] p-3">
                <div className="flex gap-1">
                  <span className="animate-pulse h-2 w-2 rounded-full bg-[#4F46E5]"></span>
                  <span className="animate-pulse h-2 w-2 rounded-full bg-[#4F46E5] animation-delay-200"></span>
                  <span className="animate-pulse h-2 w-2 rounded-full bg-[#4F46E5] animation-delay-400"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="border-t border-[#334155] p-4">
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  )
}

