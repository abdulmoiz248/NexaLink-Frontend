import Link from "next/link"
import { SignUpForm } from "@/components/auth/SignUpForm"
import { NexalinkLogo } from "@/components/Nexalinklogo"

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#0F172A] to-[#1E293B] p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <NexalinkLogo />
          <h1 className="mt-6 text-2xl font-bold text-white">Create your account</h1>
          <p className="mt-2 text-sm text-slate-400">Join the Nexalink network</p>
        </div>

        <SignUpForm />

        <div className="mt-6 text-center text-sm">
          <p className="text-slate-400">
            Already connected?{" "}
            <Link href="/login" className="text-[#4F46E5] hover:text-[#4338CA] underline-offset-4 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

