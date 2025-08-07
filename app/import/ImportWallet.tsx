"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SetPassword from "../login/SetPassword"
import { encrypt as passworderEncrypt } from "@metamask/browser-passworder"
import secureLocalStorage from "react-secure-storage"
// tu función
import { generatexPubxPriv, generateFluxAddress, validateMnemonic, deriveAkash } from "@/lib/wallet";
import Account from "../account/page"


export default function ImportWallet() {
  const [wordCount, setWordCount] = useState<12 | 24>(12);
  const [words, setWords] = useState<string[]>(Array(12).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAccount, setShowAccount] = useState(false)
  const [passwordToUse, setPasswordToUse] = useState<string | null>(null)
  const [mnemonic, setMnemonic] = useState<string | null>(null)

  const handleWordCountChange = (count: 12 | 24) => {
    setWordCount(count);
    setWords(Array(count).fill(""));
  };

  const updateWord = (index: number, value: string) => {
    const newWords = [...words];
    newWords[index] = value.trim().toLowerCase();
    setWords(newWords);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").trim().toLowerCase();
    const split = pasted.split(/\s+/);
    if (split.length === 12 || split.length === 24) {
      handleWordCountChange(split.length as 12 | 24);
      setWords(split);
      e.preventDefault();
    }
  };

  const handleImport = async () => {
    const mnemonic = words.join(" ").trim();
    if (!validateMnemonic(mnemonic)) {
      setError("Invalid mnemonic phrase.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const akashData = await deriveAkash(mnemonic);
      const accounts = await akashData.getAccounts();
      const returnData = await generatexPubxPriv(mnemonic, 44, 19167, 0, "0");
      const fluxAddress = await generateFluxAddress(returnData.xpriv);

      localStorage.setItem("account", JSON.stringify({
        akashAddress: accounts[0]?.address,
        fluxAddress,
      }));
      setMnemonic(mnemonic)
    } catch (err) {
      setError("Something went wrong during import.");
    } finally {
      setLoading(false);
    }
  };
  if (mnemonic && !passwordToUse) {
    return (
      <SetPassword
        onConfirm={async (password) => {
          setPasswordToUse(password);
          if (mnemonic) {
            const blob = await passworderEncrypt(password, mnemonic);
            secureLocalStorage.setItem("walletSeed", blob);
          }
          setShowAccount(true);
        }}
      />
    )
  }




  if (showAccount && passwordToUse) {

    return <Account />
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Import Existing Wallet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Enter your recovery phrase to restore your wallet.
          </p>

          {/* Word count selector */}
          <Tabs defaultValue="12" onValueChange={(val) => handleWordCountChange(Number(val) as 12 | 24)}>
            <TabsList className="grid grid-cols-2 mb-2">
              <TabsTrigger value="12">12 words</TabsTrigger>
              <TabsTrigger value="24">24 words</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-3 gap-2">
            {words.map((word, i) => (
              <Input
                key={i}
                value={word}
                onChange={(e) => updateWord(i, e.target.value)}
                onPaste={handlePaste}
                placeholder={`${i + 1}`}
                className="text-center"
              />
            ))}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button
            onClick={handleImport}
            disabled={loading}
            className="w-full mt-4"
          >
            {loading ? "Importing..." : "Import"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
