"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { generateMnemonicFromGoogle, generateMnemonic, deriveAkash, generatexPubxPriv, generateFluxKeyPair, generateExternalIdentityKeypair} from "../../lib/wallet"
import BackupKey from "./BackUpKey"
import SetPassword from "./SetPassword"
import Account from "../account/page"
import { encrypt as passworderEncrypt } from "@metamask/browser-passworder"
import secureLocalStorage from "react-secure-storage"
import ImportWallet from "../import/ImportWallet"
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    google: any
    handleSignInWithGoogle?: (response: any) => Promise<void>
  }
}

interface GooglePayload {
  email: string
  sub: string
  name?: string
  picture?: string
  [key: string]: any
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [backupConfirmed, setBackupConfirmed] = useState(false)
  const [akashAddress, setAkashAddress] = useState<any>(null)
  const [fluxAddress, setFluxAddress] = useState<any>(null)
  const [fluxId, setFluxId] = useState<any>(null)
  const[FluxIdPrivKey, setFluxIdPrivKey] = useState<any>(null)
  const[FluxWifPrivKey, setFluxPrivKeyWif] = useState<any>(null)
  const [mnemonic, setMnemonic] = useState<string | null>(null)
  const [isDeterministic, setIsDeterministic] = useState(false)
  const [passwordToUse, setPasswordToUse] = useState<string | null>(null)
  const [showAccount, setShowAccount] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [walletExists, setWalletExists] = useState<boolean | null>(null);
  const router = useRouter();




  useEffect(() => {
    const walletSeed = secureLocalStorage.getItem("walletSeed");

    if (walletSeed !== null) {
      setWalletExists(true); 
    } 
  }, []);
  useEffect(() => {
    if (walletExists) {
      router.push("/account");
    }
  }, [walletExists]);


  useEffect(() => {
    const loadGoogleScript = () => {
      const script = document.createElement("script")
      script.src = "https://accounts.google.com/gsi/client"
      script.async = true
      script.defer = true
      script.onload = initializeGoogleSignIn
      script.onerror = () => setLoginError("No se pudo cargar el script de Google Sign-In.")
      document.head.appendChild(script)
    }

    window.handleSignInWithGoogle = async (response: any) => {
      setIsLoading(true)
      setLoginError(null)
      try {
        const idToken = response.credential
        const payload = JSON.parse(atob(idToken.split(".")[1])) as GooglePayload

        const backendResponse = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        })

        const data = await backendResponse.json()
        if (!backendResponse.ok) throw new Error(data.error || "Fallo en la verificación con backend.")

        const ZkAuthInput = {
          providerId: payload.sub,
          email: payload.email,
          deterministic: isDeterministic,
        }

        const zkIdentity = await generateMnemonicFromGoogle(
          ZkAuthInput.providerId,
          ZkAuthInput.email,
          ZkAuthInput.deterministic
        )

        const accounts = await zkIdentity.akashData.getAccounts()
        const firstAccount = accounts[0]
        setMnemonic(zkIdentity.mnemonic)
        setAkashAddress(firstAccount?.address || "No address found")
      } catch (err: any) {
        console.error("Error durante el login:", err)
        setLoginError(err.message || "Error inesperado.")
      } finally {
        setIsLoading(false)
      }
    }

    if (window.google) {
      initializeGoogleSignIn()
    } else {
      loadGoogleScript()
    }

    return () => {
      if (window.google) {
        window.google.accounts.id.cancel()
      }
      delete window.handleSignInWithGoogle
    }
  }, [isDeterministic])

  const handleManualMnemonicGeneration = async () => {
    const mnemonic = await generateMnemonic()
    const akashData = await deriveAkash(mnemonic);
    const account = await akashData.getAccounts();
    const returnData = await generatexPubxPriv(mnemonic, 44, 19167, 0, '0');
    const fluxAddress = await generateFluxKeyPair(returnData.xpriv)
    const fluxId = await generateExternalIdentityKeypair(returnData.xpriv);

    

    setFluxPrivKeyWif(fluxAddress.privKeyFlux)
    setAkashAddress(account[0].address || "No address found")
    setFluxAddress(fluxAddress.address);
    setMnemonic(mnemonic);
    setFluxId(fluxId.address);
    setFluxIdPrivKey(fluxId.privKey);
  }

  const initializeGoogleSignIn = () => {
    if (!window.google) return

    window.google.accounts.id.initialize({
      client_id: process.env.GOOGLE_CLIENT_ID,
      callback: window.handleSignInWithGoogle,
      auto_select: false,
      cancel_on_tap_outside: true,
    })

    const button = document.getElementById("google-signin-button")
    if (button) {
      window.google.accounts.id.renderButton(button, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        logo_alignment: "left",
      })
    }
  }

  // Paso intermedio para ingresar contraseña
  if (mnemonic && !passwordToUse) {
    return (
      <SetPassword
        onConfirm={(password) => {
          setPasswordToUse(password)
        }}
      />
    )
  }

  // Mostrar pantalla de backup
  if (mnemonic && !backupConfirmed) {
    return (
      <BackupKey
        seedPhrase={mnemonic}
        deterministic={isDeterministic}
        onConfirm={ () => {
          if (passwordToUse) {
            console.log(passwordToUse);
            const blob =  passworderEncrypt(passwordToUse, mnemonic)
            const blob1 =  passworderEncrypt(passwordToUse, FluxIdPrivKey)
            secureLocalStorage.setItem("walletSeed", blob)
            secureLocalStorage.setItem("FluxId", blob1)
            secureLocalStorage.setItem("FluxPrivKey", FluxWifPrivKey)
          }
          localStorage.setItem("account", JSON.stringify({ "akashAddress": akashAddress, "fluxAddress": fluxAddress, "fluxId": fluxId }))
          setBackupConfirmed(true)
          setShowAccount(true)
        }}
      />
    )
  }

  // Una vez terminado el flujo, mostrar Account embebido
  if (showAccount) {
    return <Account />
  }

  if (showImport) {
    return <ImportWallet />
  }

  return (
    <div className="flex flex-col items-center justify-center gap-8 min-h-[100dvh] bg-gray-100 px-4 dark:bg-gray-950">
      {/* Google Auth Card */}
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sign in with Google</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading && <div className="text-center text-sm text-muted-foreground">loading...</div>}
          {loginError && <div className="text-center text-sm text-red-500">{loginError}</div>}

          {!mnemonic && !akashAddress && (
            <>
              <div className="flex items-center justify-between px-2">
                <Label htmlFor="deterministic" className="text-sm font-medium">
                  Deterministic
                </Label>
                <Switch
                  id="deterministic"
                  checked={isDeterministic}
                  onCheckedChange={setIsDeterministic}
                />
              </div>
              <div className="flex justify-center">
                <div id="google-signin-button" className="w-full max-w-xs" />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Manual Mnemonic Card */}
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Import from a recovery phrase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            This will import your account from a recovery phrase.
          </p>
          <button
            onClick={() => setShowImport(true)}
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition"
          >
            Import from a Recovery Phrase
          </button>
        </CardContent>
      </Card>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Generate a recovery phrase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            This will generate a random wallet with a seed phrase you must back up manually.
          </p>
          <button
            onClick={handleManualMnemonicGeneration}
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition"
          >
            Generate Recovery Phrase
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
