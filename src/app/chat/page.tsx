import { ChatList } from "@/components/chat/chat-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NexalinkLogo } from "@/components/Nexalinklogo"

export default function ChatPage() {
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-[#0F172A] to-[#1E293B] text-white">
      <div className="flex h-screen flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[#334155] p-4">
          <div className="flex items-center">
            <NexalinkLogo />
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#10B981]"></span>
            <span className="text-sm">Online</span>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden p-4">
        
        
              <ChatList />
          

        
        </div>
      </div>
    </main>
  )
}

