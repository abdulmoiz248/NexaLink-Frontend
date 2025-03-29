"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

type MessageInputProps = {
  onSendMessage: (text: string) => void
  onTyping: () => void
  onStopTyping: () => void
}

export function MessageInput({ onSendMessage, onTyping, onStopTyping }: MessageInputProps) {
  const [text, setText] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setText(value)

    if (value.trim() && !isTyping) {
      onTyping()
      setIsTyping(true)
    } else if (!value.trim() && isTyping) {
      onStopTyping()
      setIsTyping(false)
    }
  }

  const handleSendMessage = () => {
    if (text.trim()) {
      onSendMessage(text)
      setText("")
      onStopTyping()
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="relative">
      <textarea
        rows={1}
        value={text}
        onChange={handleInputChange}
        onBlur={onStopTyping}
        onFocus={onTyping}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        className="w-full rounded-md bg-muted px-3 py-2 pr-12 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <Button
        onClick={handleSendMessage}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted-foreground disabled:cursor-not-allowed"
        disabled={!text.trim()}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}

