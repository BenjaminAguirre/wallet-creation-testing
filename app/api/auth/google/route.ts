import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json()

    // Ejemplo de verificación del token utilizando el endpoint tokeninfo de Google
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`)
    const tokenInfo = await response.json()

    if (tokenInfo.error) {
      console.error("Error de verificación del token de Google:", tokenInfo.error_description || tokenInfo.error)
      return NextResponse.json({ error: "Token inválido" }, { status: 400 })
    }

    // Aquí podrías añadir más comprobaciones, por ejemplo, verificar 'aud' (client_id)
    // para asegurar que el token fue emitido para tu aplicación.
    // if (tokenInfo.aud !== process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    //   return NextResponse.json({ error: "Audiencia inválida" }, { status: 400 });
    // }

    return NextResponse.json({
      success: true,
      user: {
        id: tokenInfo.sub,
        email: tokenInfo.email,
        name: tokenInfo.name,
        picture: tokenInfo.picture,
      },
    })
  } catch (error) {
    console.error("Error en autenticación del backend:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
