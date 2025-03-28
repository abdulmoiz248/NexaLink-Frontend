import { ChatScreen } from "@/components/chat/chat-screen"

// This is a mock function to get user data
// In a real app, this would fetch from your API
const getUserData = (userId: string) => {
  const users = {
    user1: { id: "user1", name: "Alex Chen", avatar: "/placeholder.svg?height=40&width=40", status: "online" },
    user2: { id: "user2", name: "Morgan Smith", avatar: "/placeholder.svg?height=40&width=40", status: "offline" },
    user3: { id: "user3", name: "Taylor Kim", avatar: "/placeholder.svg?height=40&width=40", status: "away" },
  }

  return (
    users[userId as keyof typeof users] || {
      id: userId,
      name: "Unknown User",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "offline",
    }
  )
}

export default function ChatPage({ params }: { params: { userId: string } }) {
  const user = getUserData(params.userId)

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-[#0F172A] to-[#1E293B] text-white">
      <ChatScreen user={user} />
    </main>
  )
}

