"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default function BackupKey({
    seedPhrase,
    onConfirm,
    deterministic
}: {
    seedPhrase: string
    onConfirm: () => void
    deterministic: boolean
}) {
    const [visible, setVisible] = useState(false)

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md border border-border shadow-xl">
                <CardHeader className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">Step 2/3</p>
                    <h2 className="text-xl font-semibold">Back up private key</h2>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div
                        className="rounded-lg border border-muted bg-muted/30 text-center px-4 py-6 text-sm cursor-pointer select-none"
                        onClick={() => setVisible(!visible)}
                    >
                        {visible ? (
                            <div className="break-all font-mono">{seedPhrase}</div>
                        ) : (
                            <span className="text-muted-foreground">Click here to see seed phrase</span>
                        )}
                    </div>

                    <div className="text-sm text-muted-foreground space-y-2">
                        <div className="flex items-start gap-2 text-warning">
                            <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-500" />
                            <span className="font-medium text-yellow-500">Backup your seed phrase securely.</span>
                        </div>
                        <p>Anyone with your seed phrase can have access to your account.</p>

                        {deterministic === true ? (
                            <p>
                                If you lose access to your Gmail account, the only way to recover your wallet is using your private key. Keep this in a safe place.
                            </p>
                        ) : (
                            <p>The only way to recover your account is using your seed phrase. Keep this in a safe place.</p>
                        )}
                       
                    </div>

                    <Button className="w-full mt-4" onClick={onConfirm}>
                        Got it
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}