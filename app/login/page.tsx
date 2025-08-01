"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Declara el namespace 'google' en el objeto Window para TypeScript
declare global {
  interface Window {
    google: any
    handleSignInWithGoogle: (response: any) => Promise<void>
  }
}

// Objeto 'wallet' simulado para propósitos de demostración.
// DEBES reemplazar esto con tu implementación real de 'wallet'.
const wallet = {
  createZkIdentity: async (input: any) => {
    console.log("Mock wallet.createZkIdentity llamado con:", input)
    // Simula una operación asíncrona
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ id: `zk-identity-${Math.random().toString(36).substring(7)}`, data: input })
      }, 500)
    })
  },
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [pendingIdentity, setPendingIdentity] = useState<any>(null)
  const [googlePayload, setGooglePayload] = useState<any>(null)
  const [authMethod] = useState("google") // Asumimos que "google" es el método de autenticación principal aquí

  useEffect(() => {
    // Función para cargar el script de Google GSI
    const loadGoogleScript = () => {
      const script = document.createElement("script")
      script.src = "https://accounts.google.com/gsi/client"
      script.async = true
      script.defer = true
      script.onload = initializeGoogleSignIn
      script.onerror = () => setLoginError("No se pudo cargar el script de Google Sign-In.")
      document.head.appendChild(script)
    }

    // Define la función de callback global para Google Sign-In
    window.handleSignInWithGoogle = async (response: any) => {
      setIsLoading(true)
      setLoginError(null)
      try {
        const idToken = response.credential
        console.log("Token de ID de Google recibido:", idToken)

        // Decodifica el token de ID para obtener el payload
        const payload = JSON.parse(atob(idToken.split(".")[1]))
        console.log("Payload de Google decodificado:", payload)

        // Llama a tu API de backend para verificar el token
        const backendResponse = await fetch("/api/auth/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idToken }),
        })

        const data = await backendResponse.json()

        if (!backendResponse.ok) {
          throw new Error(data.error || "Fallo al verificar el token con el backend.")
        }

        console.log("Verificación de backend exitosa:", data.user)

        // Lógica específica de tu 'wallet'
        const ZkAuthInput = {
          providerId: payload.sub,
          email: payload.email,
        }
        const zkIdentity = await wallet.createZkIdentity(ZkAuthInput)
        setPendingIdentity(zkIdentity)
        setGooglePayload(payload)

        // Opcionalmente, redirige o actualiza la interfaz de usuario tras un inicio de sesión exitoso
        alert(`¡Inicio de sesión exitoso! Bienvenido, ${data.user.name || data.user.email}`)
      } catch (error: any) {
        console.error("Error durante el proceso de inicio de sesión de Google:", error)
        setLoginError(error.message || "Ocurrió un error inesperado durante el inicio de sesión.")
      } finally {
        setIsLoading(false)
      }
    }

    // Inicializa Google Sign-In si el script ya está cargado
    if (window.google) {
      initializeGoogleSignIn()
    } else {
      loadGoogleScript()
    }

    // Función de limpieza
    return () => {
      if (window.google) {
        window.google.accounts.id.cancel() // Cancela cualquier proceso de GSI pendiente
      }
      delete window.handleSignInWithGoogle // Elimina el manejador global
    }
  }, [authMethod]) // Se ejecuta de nuevo si authMethod cambia

  const initializeGoogleSignIn = () => {
    if (window.google && authMethod === "google") {
      window.google.accounts.id.initialize({
        client_id:
          process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
          "903556090114-9n31t9go10a5ipodeh4jm7ac99fgiuvg.apps.googleusercontent.com",
        callback: window.handleSignInWithGoogle,
        auto_select: false,
        cancel_on_tap_outside: true,
      })
      // Renderiza el botón solo si el elemento existe
      const googleButton = document.getElementById("google-signin-button")
      if (googleButton) {
        window.google.accounts.id.renderButton(googleButton, {
          theme: "outline",
          size: "large",
          type: "standard",
          shape: "pill",
          text: "signin_with",
          logo_alignment: "left",
        })
      } else {
        console.warn("Elemento del botón de Google Sign-In no encontrado.")
      }
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
          <CardDescription>Inicia sesión con tu cuenta de Google</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <div id="google-signin-button" className="w-full max-w-xs"></div>
          </div>
          {isLoading && <div className="text-center text-sm text-muted-foreground">Cargando...</div>}
          {loginError && <div className="text-center text-sm text-red-500">{loginError}</div>}
          {pendingIdentity && (
            <div className="text-center text-sm text-green-600">
              <p>ZkIdentity creada: {pendingIdentity.id}</p>
              <p>Email de Google: {googlePayload?.email}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
