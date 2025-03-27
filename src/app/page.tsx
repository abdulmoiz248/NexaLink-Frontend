import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogIn, UserPlus } from "lucide-react"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#0F172A] to-[#1E293B] p-4 text-white">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="relative mb-8">
          <div className="nexalink-logo">
            <div className="text-4xl font-bold tracking-tight mb-2 text-white">
              <span className="text-[#4F46E5]">Nexa</span>link
            </div>
            <div className="text-sm text-slate-400">Connect to the Future</div>
          </div>
        </div>

        <div className="grid gap-4">
          <Link href="/login" passHref>
            <Button className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white py-6">
              <LogIn className="mr-2 h-5 w-5" />
              Login
            </Button>
          </Link>

          <Link href="/signup" passHref>
            <Button variant="outline" className="w-full border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5]/10 py-6">
              <UserPlus className="mr-2 h-5 w-5" />
              Sign Up
            </Button>
          </Link>
        </div>
      </div>

      {/* Decorative Elements - Animated Nodes */}
      <div className="fixed inset-0 pointer-events-none">
        <div id="nodes-animation" className="absolute inset-0"></div>
      </div>
    </main>
  )
}

