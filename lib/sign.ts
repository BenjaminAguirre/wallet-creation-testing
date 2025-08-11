// src/utils/authUtils.ts

import * as bitcoin from "bitcoinjs-lib"; // Importing bitcoinjs-lib
import * as bitcoinMessage from "bitcoinjs-message"; // Importing bitcoinjs-message
import {ECPairFactory}  from "ecpair";
import * as ecc from "@bitcoinerlab/secp256k1"; 
import axios from "axios";

// Dynamically import dotenv to load environment variables
(async () => {
  const dotenv = await import("dotenv");
  dotenv.config();
})();

// Dynamically import tiny-secp256k1


// Load ECC and create ECPairFactory asynchronously
bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);


/**
 * Signs a message using a private key.
 *
 * @param message - The message to be signed.
 * @param privKey - The private key to sign the message.
 * @returns The signature in base64 format or an error message.
 */
export function SignMessage(message: string, privKey: string): string {
  const network = bitcoin.networks.bitcoin;
  
  try {
    if (!ECPair) {
      throw new Error("ECPair is not initialized.");
    }
  
    // Create ECPair from private key using the network
    const keyPair = ECPair.fromWIF(privKey, network);
    const privateKey = keyPair.privateKey;

    if (!privateKey) {
      throw new Error("Private key not found.");
    }

    const privKeyBuffer = Buffer.from(privateKey);
    const compressed = true;

    // Sign the message
    const signature = bitcoinMessage.sign(
      message,
      privKeyBuffer,
      compressed
    );
    
    return signature.toString("base64");
  } catch (error) {
    console.log("Error signing message:", error);
    return "Error signing";
  }
}

/**
 * Retrieves an authorization header for Zel ID.
 *
 * @returns A promise that resolves to the authorization header or an error message.
 */
export async function GetZelIdAuthHeader(zelid: string, privKey: string, loginPhrase: string): Promise<string> {

  try {
    // Get flux URL from env
    const FLUX_API_URL = "https://api.runonflux.io";
    // Fetch the login phrase from the API
    // Sign the login phrase
    const signature = SignMessage(loginPhrase, privKey);

    const encodedSignature = encodeURIComponent(signature);
    
    // Concatenate zelid, signature, and login phrase
    const authHeader = `zelid=${zelid}&signature=${encodedSignature}&loginPhrase=${loginPhrase}`;
   
    
    const body = {
      loginPhrase: loginPhrase,
      zelid,
      signature,
    };
    const json = JSON.stringify(body);

    // Verify login with the API by passing JSON with loginPhrase, zelid, and signature in the body
    const verify = await axios.post(`${FLUX_API_URL}/id/verifylogin`, json);
   
    
    if (verify.data.status === "success") {
      return authHeader;
    } else {
      ("error");
      
      return "Error verifying login";
    }
  } catch (error) {
    console.log("Error fetching or verifying login phrase:", error);
    return "Error signing";
  }
}