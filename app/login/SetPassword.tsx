"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SetPasswordProps {
  onConfirm: (password: string) => void
}

export default function SetPassword({ onConfirm }: SetPasswordProps) {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = () => {
    if (!password || !confirm) {
      setError("Both fields are required")
    } else if (password !== confirm) {
      setError("Passwords do not match")
    } else {
      setError("")
      onConfirm(password)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 bg-whiteBg border border-outlineBlack rounded-xl p-6 space-y-4 shadow-xl">
      <h2 className="text-xl font-bold text-blackText">Secure your wallet</h2>
      <p className="text-sm text-blackText">
        Choose a password to encrypt your seed Phrase. This will be required to access your wallet.
      </p>
      <Input
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Confirm password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button onClick={handleSubmit} className="w-full bg-primaryGreen text-whiteBg rounded-lg">
        Continue
      </Button>
    </div>
  )
}
