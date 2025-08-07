"use client"

import { useState, useEffect } from "react"
import { decrypt as passworderDecrypt } from "@metamask/browser-passworder"
import secureLocalStorage from "react-secure-storage"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Sidebar from "@/components/sidebar"

export default function Account() {
  const [passwordInput, setPasswordInput] = useState("")
  const [mnemonic, setMnemonic] = useState<string | null>(null)
  const [akashAddress, setAkashAddress] = useState<string | null>(null)
  const [fluxAddress, setFluxAddress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Cargar la dirección automáticamente al montar el componente
  useEffect(() => {
     const stored = localStorage.getItem("account");

    if (stored) {
      const parsed = JSON.parse(stored);
      const akashAddress = parsed.akashAddress;
      const fluxAddress = parsed.fluxAddress;
      setAkashAddress(akashAddress)
      setFluxAddress(fluxAddress)
    }
  }, [])

  const handleUnlock = async (password: string) => {
    try {
      const encryptedMnemonic = secureLocalStorage.getItem("walletSeed")
      if (typeof encryptedMnemonic !== "string") {
        throw new Error("Missing encrypted wallet seed")
      }
      const decryptedMnemonic = await passworderDecrypt(password, encryptedMnemonic)
      if (typeof decryptedMnemonic !== "string") {
        throw new Error("Invalid mnemonic format")
      }

      setMnemonic(decryptedMnemonic)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to unlock wallet")
    }
  }

  return (

    <div className="flex">
    <Sidebar />
    <main className="flex-1 p-6">
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mostrar la dirección siempre que esté disponible */}
          {(akashAddress || fluxAddress) && (
            <div className="text-center text-sm text-blue-600 space-y-2">
              <p><strong>Akash Address:</strong> {akashAddress}</p>
              <p><strong>Flux Address:</strong> {fluxAddress}</p>
            </div>
          )}
          
          {!mnemonic ? (
            <>
              <Input
                type="password"
                placeholder="Enter password to unlock"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              <Button onClick={() => handleUnlock(passwordInput)} className="w-full">
                Unlock Wallet
              </Button>
            </>
          ) : (
            <div className="text-center text-sm text-green-600 space-y-2">
              <p><strong>Mnemonic:</strong> {mnemonic}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </main>
    </div>
  )
}
