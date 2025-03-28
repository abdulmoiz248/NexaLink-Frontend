import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { Check, CheckCheck } from "lucide-react"

type MessageProps = {
  message: {
    id: string
    text: string
    timestamp: Date
    status: "sending" | "sent" | "delivered" | "read"
  }
  isOwnMessage: boolean
  senderName: string
  senderAvatar: string
}

export function MessageItem({ message, isOwnMessage, senderName, senderAvatar }: MessageProps) {
  const statusIcon = () => {
    switch (message.status) {
      case "sending":
        return null
      case "sent":
        return <Check className="h-4 w-4 text-slate-400" />
      case "delivered":
        return <CheckCheck className="h-4 w-4 text-slate-400" />
      case "read":
        return <CheckCheck className="h-4 w-4 text-[#4F46E5]" />
      default:
        return null
    }
  }

  return (
    <div className={`flex items-start gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
      {!isOwnMessage && (
        <Image
          src={senderAvatar || "/placeholder.svg"}
          alt={senderName}
          width={40}
          height={40}
          className="rounded-full"
        />
      )}
      <div className="max-w-[70%]">
        <div
          className={`rounded-2xl p-3 ${
            isOwnMessage ? "rounded-tr-none bg-[#4F46E5] text-white" : "rounded-tl-none bg-[#1E293B] text-white"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
        </div>
        <div className={`mt-1 flex items-center gap-1 text-xs text-slate-400 ${isOwnMessage ? "justify-end" : ""}`}>
          <span>{formatDistanceToNow(message.timestamp, { addSuffix: true })}</span>
          {isOwnMessage && statusIcon()}
        </div>
      </div>
    </div>
  )
}

