import { formatDistanceToNow } from "date-fns"

type MessageStatus = "sent" | "delivered" | "read"

type MessageItemProps = {
  message: {
    id: string
    senderId: string
    text: string
    timestamp: Date
    status: MessageStatus
  }
  isOwnMessage: boolean
  senderName: string
  senderGradient: string
  highlight?: string // Added highlight prop for search functionality
}

export function MessageItem({ message, isOwnMessage, senderName, senderGradient, highlight }: MessageItemProps) {
  // Function to highlight search terms in message text
  const highlightText = (text: string, query: string) => {
    if (!query) return text

    const parts = text.split(new RegExp(`(${query})`, "gi"))
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-yellow-300 text-black">
          {part}
        </span>
      ) : (
        part
      ),
    )
  }

  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      {!isOwnMessage && (
        <div className="relative mr-2 flex h-8 w-8 items-center justify-center rounded-full">
          <div className={`absolute inset-0 rounded-full ${senderGradient}`}></div>
          <span className="z-10 text-white text-xs">{senderName[0]?.toUpperCase()}</span>
        </div>
      )}
      <div className={`max-w-[75%] ${isOwnMessage ? "order-1" : "order-2"}`}>
        <div
          className={`rounded-lg p-3 ${
            isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
          }`}
        >
          {highlight ? highlightText(message.text, highlight) : message.text}
        </div>
        <div
          className={`mt-1 flex items-center text-xs text-muted-foreground ${isOwnMessage ? "justify-end" : "justify-start"}`}
        >
          <span>{formatDistanceToNow(message.timestamp, { addSuffix: true })}</span>
          {isOwnMessage && (
            <span className="ml-1">
              {message.status === "read" ? "✓✓" : message.status === "delivered" ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

