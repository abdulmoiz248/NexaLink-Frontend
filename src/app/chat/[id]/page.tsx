'use server'
import { ChatScreen}  from "@/components/chat/chat-screen"




export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  
  
  const {id}=await params
  console.log("ChatPage id:", id)
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-[#0F172A] to-[#1E293B] text-white">
      <ChatScreen id={id} />
    </main>
  )
}

