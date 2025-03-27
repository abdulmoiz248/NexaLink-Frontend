type PasswordStrengthMeterProps = {
    strength: number
  }
  
  export function PasswordStrengthMeter({ strength }: PasswordStrengthMeterProps) {
    const getLabel = (strength: number) => {
      if (strength === 0) return "Too weak"
      if (strength === 1) return "Weak"
      if (strength === 2) return "Fair"
      if (strength === 3) return "Good"
      if (strength === 4) return "Strong"
      return "Very strong"
    }
  
    const getColor = (strength: number) => {
      if (strength <= 1) return "bg-[#EF4444]"
      if (strength === 2) return "bg-[#F59E0B]"
      if (strength === 3) return "bg-[#10B981]"
      if (strength >= 4) return "bg-[#10B981]"
      return ""
    }
  
    return (
      <div className="space-y-1">
        <div className="flex h-2 overflow-hidden rounded-full bg-[#1E293B]">
          {[1, 2, 3, 4, 5].map((segment) => (
            <div
              key={segment}
              className={`h-full w-1/5 transition-all duration-300 ${
                segment <= strength ? getColor(strength) : "bg-[#1E293B]"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs">
          <span className={strength > 0 ? "text-slate-400" : "text-[#EF4444]"}>{getLabel(strength)}</span>
          {strength < 3 && <span className="text-slate-400">Add numbers, symbols, and uppercase letters</span>}
        </div>
      </div>
    )
  }
  
  