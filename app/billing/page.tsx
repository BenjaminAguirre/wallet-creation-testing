"use client"

import { useEffect, useState } from "react"
import secureLocalStorage from "react-secure-storage"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Copy } from "lucide-react"
import Sidebar from "../../components/sidebar"

const FLUX_PRICE_URL = process.env.NEXT_PUBLIC_FLUX_API_URL || "https://api.coingecko.com/api/v3/simple/price?ids=zelcash&vs_currencies=usd"
const AKT_PRICE_URL = process.env.NEXT_PUBLIC_COINBASE_URL || "https://api.coinbase.com/v2/prices/AKT-USD/spot"

export default function BillingPage() {
  const [fluxPrice, setFluxPrice] = useState<number | null>(null)
  const [aktPrice, setAktPrice] = useState<number | null>(null)
  const [fluxBalance, setFluxBalance] = useState<number>(20) // 💰 hardcoded
  const [aktBalance, setAktBalance] = useState<number>(3.7) // 💰 hardcoded

  const address = typeof window !== "undefined" ? localStorage.getItem("account") : null
  const parsedAddress = address ? JSON.parse(address) : {}

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const fluxRes = await fetch(FLUX_PRICE_URL)
        const aktRes = await fetch(AKT_PRICE_URL)
        const fluxData = await fluxRes.json()
        
        const aktData = await aktRes.json()

        setFluxPrice(fluxData?.zelcash.usd || 0)
        setAktPrice(aktData?.data?.amount || 0)
      } catch (error) {
        console.error("Error fetching prices:", error)
      }
    }

    fetchPrices()
  }, [])

  const formatUsd = (value: number) => `$${value.toFixed(2)}`

  return (

    <div className="flex">
    <Sidebar />
    <main className="flex-1 p-6">
    <div className="p-6 space-y-8">
      <h2 className="text-3xl font-semibold">Billing</h2>

      <div className="flex flex-col md:flex-row gap-4">
        {/* FLUX Card */}
        <Card className="flex-1 bg-zinc-900 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Flux</CardTitle>
              <span className="text-sm bg-zinc-800 px-2 py-1 rounded-md flex items-center gap-1">
                {parsedAddress?.fluxAddress || "-"} <Copy className="w-4 h-4" />
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <span className="text-lg font-medium">FLUX</span>
            <span className="text-xl font-semibold">
              {fluxPrice ? formatUsd(fluxBalance * fluxPrice) : "$-"} ({fluxBalance} FLUX)
            </span>
          </CardContent>
        </Card>

        {/* AKASH Card */}
        <Card className="flex-1 bg-zinc-900 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Akash</CardTitle>
              <span className="text-sm bg-zinc-800 px-2 py-1 rounded-md flex items-center gap-1">
                {parsedAddress?.akashAddress || "-"} <Copy className="w-4 h-4" />
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <span className="text-lg font-medium">AKT</span>
            <span className="text-xl font-semibold">
              {aktPrice ? formatUsd(aktBalance * aktPrice) : "$-"} ({aktBalance} AKT)
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 text-center cursor-pointer hover:shadow-lg">
          <CardHeader>
            <img
              src="https://cdn-icons-png.flaticon.com/512/349/349221.png"
              alt="Stripe"
              className="mx-auto w-10 mb-2"
            />
            <CardTitle>Stripe</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Stripe payment</p>
          </CardContent>
        </Card>

        <Card className="p-6 text-center opacity-50 cursor-not-allowed">
          <CardHeader>
            <img
              src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png"
              alt="Stablecoin"
              className="mx-auto w-10 mb-2"
            />
            <CardTitle>Stable Coin</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
    </main>
    </div>
  )
}
