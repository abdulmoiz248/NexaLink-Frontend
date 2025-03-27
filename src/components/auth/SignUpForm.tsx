"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter"
import { ConnectingNodesAnimation } from "@/components/auth/ConnectingNodesAnimation"
import { debounce } from "@/lib/utils"
import axios from "axios"

export function SignUpForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [usernameError, setUsernameError] = useState("")
  const usernameInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)

 
  const checkUsername = useRef(
    debounce(async (username: string) => {
      if (username.length < 3) {
        setUsernameAvailable(null)
        setSuggestions([])
        return
      }

      setIsCheckingUsername(true)
      try {
        const url=`${process.env.NEXT_PUBLIC_URL}/user?username=${username}`;
        
        const response = await axios.get(url);  
      
        
        console.log(response);   
        if (response.status!=200) {
           throw new Error("Failed to check username")
         }

         
         setUsernameAvailable(true)
         setSuggestions([])

        
        if (usernameInputRef.current) {
         
            usernameInputRef.current.classList.add("border-[#10B981]")
            setTimeout(() => {
              usernameInputRef.current?.classList.remove("border-[#10B981]")
            }, 2000)
          } else {
            usernameInputRef.current!.classList.add("shake", "border-[#EF4444]")
            setTimeout(() => {
              usernameInputRef.current?.classList.remove("shake", "border-[#EF4444]")
            }, 820)
          
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          // Username is already taken
          setUsernameAvailable(false);
      
          if (usernameInputRef.current) {
            usernameInputRef.current.classList.add("shake", "border-[#EF4444]");
            setTimeout(() => {
              usernameInputRef.current?.classList.remove("shake", "border-[#EF4444]");
            }, 820);
          }
        } else {
          alert("Failed to check username. Please try again later.");
        }
      } finally {
        setIsCheckingUsername(false)
      }
    }, 500),
  ).current

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUsername(value)
    if (value) {
      checkUsername(value)
    } else {
      setUsernameAvailable(null)
      setSuggestions([])
    }
  }

 
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)

   
    let strength = 0
    if (value.length > 0) strength += 1
    if (value.length >= 8) strength += 1
    if (/[A-Z]/.test(value)) strength += 1
    if (/[0-9]/.test(value)) strength += 1
    if (/[^A-Za-z0-9]/.test(value)) strength += 1

    setPasswordStrength(strength)
  }

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password || passwordStrength < 3 || !usernameAvailable) {
      return
    }

    setIsSubmitting(true)

    const url=`${process.env.NEXT_PUBLIC_URL}/auth/signup`; 
    try {
      
      const response = await axios.post(url, { username, password });
      console.log(response);

      if (response.status === 200) {
        router.push("/login")
      } else {
        setUsernameError("Failed to create account. Please try again.")
      }
    } catch (error) {
      
    }finally{
      setIsSubmitting(false)
     
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="username" className="text-white">
          Username
        </Label>
        <div className="relative">
          <Input
            ref={usernameInputRef}
            id="username"
            placeholder="Choose a unique username"
            value={username}
            onChange={handleUsernameChange}
            className={`bg-[#1E293B] border-[#334155] focus:border-[#4F46E5] text-white pr-10 transition-all
              ${isCheckingUsername ? "border-yellow-500" : ""}
              ${usernameAvailable === true ? "border-[#10B981]" : ""}
              ${usernameAvailable === false ? "border-[#EF4444]" : ""}
            `}
          />

          {/* Status indicator */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isCheckingUsername && <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />}
            {!isCheckingUsername && usernameAvailable === true && <CheckCircle2 className="h-5 w-5 text-[#10B981]" />}
            {!isCheckingUsername && usernameAvailable === false && <XCircle className="h-5 w-5 text-[#EF4444]" />}
          </div>
        </div>

        {/* Feedback messages */}
        {usernameAvailable === true && username && (
          <p className="text-sm text-[#10B981] animate-pulse">Welcome to Nexalink, {username}!</p>
        )}
        {usernameAvailable === false && suggestions.length > 0 && (
          <div className="text-sm text-[#EF4444]">
            <p>Username taken. Try one of these:</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {suggestions.map((suggestion, i) => (
                <Button
                  key={i}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 bg-[#1E293B] border-[#334155] text-white hover:bg-[#4F46E5]/20"
                  onClick={() => {
                    setUsername(suggestion)
                    checkUsername(suggestion)
                  }}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}
        {usernameError && <p className="text-sm text-[#EF4444]">{usernameError}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-white">
          Password
        </Label>
        <div className="relative">
          <Input
            ref={passwordInputRef}
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a strong password"
            value={password}
            onChange={handlePasswordChange}
            className="bg-[#1E293B] border-[#334155] focus:border-[#4F46E5] text-white pr-10"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {/* Password strength meter */}
        {password && <PasswordStrengthMeter strength={passwordStrength} />}
      </div>

      <Button
        type="submit"
        disabled={!username || !password || passwordStrength < 3 || !usernameAvailable || isSubmitting}
        className="w-full h-12 bg-[#4F46E5] hover:bg-[#4338CA] text-white transition-colors relative overflow-hidden"
      >
        {isSubmitting ? (
          <>
            <span className="opacity-0">Sign Up</span>
            <ConnectingNodesAnimation />
          </>
        ) : (
          "Sign Up"
        )}
      </Button>
    </form>
  )
}

