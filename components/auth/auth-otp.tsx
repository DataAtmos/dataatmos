"use client"

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

const OTP_SLOTS = [0, 1, 2, 3, 4, 5] as const

export function AuthOtp({
  value,
  onChange,
  disabled,
  autoFocus,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
}) {
  return (
    <InputOTP
      value={value}
      onChange={onChange}
      maxLength={OTP_SLOTS.length}
      disabled={disabled}
      autoFocus={autoFocus}
      containerClassName="w-full justify-center"
    >
      <InputOTPGroup>
        {OTP_SLOTS.map(slot => (
          <InputOTPSlot key={slot} index={slot} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  )
}
