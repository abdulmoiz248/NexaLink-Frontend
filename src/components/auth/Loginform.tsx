"use client"

import type React from "react"
import Cookies from "js-cookie";
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react"
import { debounce } from "@/lib/utils"
import axios from "axios"

export function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [userExists, setUserExists] = useState<boolean | null>(null)
  const [savedUsernames, setSavedUsernames] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)



 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); 
    if (!username || !password) {
      setError("Username and password are required");
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const url = `${process.env.NEXT_PUBLIC_URL}/auth/login`;
      const response = await axios.post(url, { username, password });
  
      console.log("Login successful:", response.data);
     // localStorage.setItem("token", response.data.access_token);
     Cookies.set("token", response.data.access_token, { expires: 7 });
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Login failed:", error.response?.data);
        
        if (error.response?.status === 401) {
          setError("Invalid username or password. Please try again.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } else {
        setError("Unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="username" className="text-white">
          Username
        </Label>
        <div className="relative">
        <Input
  id="username"
  placeholder="Enter your username"
  value={username}
  onChange={(e) => setUsername(e.target.value)} 
  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
  className={`bg-[#1E293B] border-[#334155] focus:border-[#4F46E5] text-white ${
    "pr-10" 
  }`}
/>


          

        
         
        </div>

    
     
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-white">
          Password
        </Label>
        <div className="relative">
  <Input
    id="password"
    type={showPassword ? "text" : "password"}
    placeholder="Enter your password"
    value={password}
    onChange={(e) => {
      setPassword(e.target.value);
      setError(""); // Clear error on new input
    }}
    className={`bg-[#1E293B] border-[#334155] focus:border-[#4F46E5] text-white pr-10 ${
      error ? "border-[#EF4444]" : ""
    }`}
  />
  
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
  >
    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
  </button>
</div>



        {error && <p className="text-sm text-[#EF4444]">{error}</p>}


      </div>

      <Button
        type="submit"
        disabled={!username || !password || isSubmitting}
        className="w-full h-12 bg-[#4F46E5] hover:bg-[#4338CA] text-white transition-colors"
      >
        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Login"}
      </Button>
    </form>
  )
}

