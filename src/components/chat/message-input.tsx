"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Paperclip, Smile, Send, Mic } from "lucide-react"

type MessageInputProps = {
  onSendMessage: (text: string) => void
}

export function MessageInput({ onSendMessage }: MessageInputProps) {
  const [message, setMessage] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      onSendMessage(message)
      setMessage("")
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-10 shrink-0 rounded-full text-slate-400 hover:text-white"
      >
        <Paperclip className="h-5 w-5" />
      </Button>

      <div className="relative flex-1">
        <textarea
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="w-full resize-none rounded-2xl bg-[#1E293B] px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] min-h-[44px] max-h-[120px]"
          rows={1}
          style={{
            height: "auto",
            minHeight: "44px",
            maxHeight: "120px",
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute bottom-1 right-1 h-8 w-8 rounded-full text-slate-400 hover:text-white"
        >
          <Smile className="h-5 w-5" />
        </Button>
      </div>

      {message.trim() ? (
        <Button type="submit" size="icon" className="h-10 w-10 shrink-0 rounded-full bg-[#4F46E5] hover:bg-[#4338CA]">
          <Send className="h-5 w-5" />
        </Button>
      ) : (
        <Button type="button" size="icon" className="h-10 w-10 shrink-0 rounded-full bg-[#4F46E5] hover:bg-[#4338CA]">
          <Mic className="h-5 w-5" />
        </Button>
      )}
    </form>
  )
}

