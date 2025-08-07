"use client"

import { useRouter, usePathname } from "next/navigation"
import { LogOut, Github, Sun, FileText, Copy, Zap, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import secureLocalStorage from "react-secure-storage"

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [balance, setBalance] = useState<string>("$0.00")
  const [email, setEmail] = useState<string>("")

  useEffect(() => {
    const account = localStorage.getItem("account")
    if (account) {
      const { fluxAddress } = JSON.parse(account)
      // Mock balance (replace with real fetch if needed)
      setBalance("$6.62")
    }
    // Optional email mock
    setEmail("benjamin@o...")
  }, [])

  const deleteWallet = () => {
    secureLocalStorage.removeItem("walletSeed")
    localStorage.removeItem("account")
    router.push("/login") // Opcional: redirige al login después de borrar
  }

  const navItem = (label: string, path: string, icon: React.ReactNode) => (
    <button
      onClick={() => router.push(path)}
      className={cn(
        "w-full flex items-center gap-2 px-4 py-2 rounded-md text-white hover:bg-zinc-800",
        pathname === path && "bg-white text-black font-semibold"
      )}
    >
      {icon}
      {label}
    </button>
  )

  return (
    <div className="flex flex-col w-64 min-h-screen bg-zinc-900 text-white p-4 space-y-6">
      <div className="flex items-center gap-2">
        <img src="/logo.svg" alt="Grid" className="w-6 h-6" />
        <h1 className="text-xl font-bold">Grid <span className="text-green-400">Beta</span></h1>
      </div>

      <div className="flex flex-col items-center text-sm">
        <div className="rounded-full bg-zinc-700 w-10 h-10 mb-2" />
        <p className="text-zinc-400">{email}</p>
      </div>

      <div className="text-center text-sm">
        <p>Balance:</p>
        <p className="font-bold text-lg">USD {balance}</p>
      </div>

      <Button className="bg-white text-black hover:bg-zinc-200 mx-4">Deploy <span className="ml-1 text-green-600">+</span></Button>

      <div className="space-y-2">
        <p className="text-xs text-zinc-400 px-4">Menu</p>
        {navItem("Account", "/account", <Zap size={16} />)}
        {navItem("Billing", "/billing", <Coins size={16} />)}
      </div>

      <div className="mt-auto space-y-3">
        <button className="w-full flex items-center gap-2 text-green-400 px-4 py-2">
          <LogOut size={16} onClick={deleteWallet} /> Delete Wallet
        </button>

        <div className="flex justify-center gap-4 text-white">
          <Github size={18} />
          <FileText size={18} />
          <Copy size={18} />
        </div>

        <div className="flex justify-center">
          <div className="w-10 h-6 rounded-full bg-white flex items-center justify-center">
            <Sun size={16} className="text-black" />
          </div>
        </div>
      </div>
    </div>
  )
}
