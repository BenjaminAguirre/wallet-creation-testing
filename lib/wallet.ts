// @grid/zk-auth
import { sha256 } from '@noble/hashes/sha2';
import * as secp from '@noble/secp256k1';
import * as utils from '@noble/hashes/utils';
import { randomBytes } from '@noble/hashes/utils';
import * as bip39 from 'bip39';
import { coin, DirectSecp256k1HdWallet, toHex } from "cosmwasm";
import { wordlist } from '@scure/bip39/wordlists/english';
import utxolib from '@runonflux/utxo-lib';
import { Buffer } from 'buffer';
import { HDKey } from '@scure/bip32';
import  {fluxBlockchain} from '../blockchains';
import {
    keyPair,
    minHDKey,
    cryptos,
    externalIdentity,
} from '../types';
import RIPEMD160 from "ripemd160"
import bs58check from "bs58check"


export interface xPrivXpub {
    xpriv: string;
    xpub: string;
  }

export interface ZkAuthInput {
    providerId: string;
    email: string;
}

export interface ZkIdentity {
    mnemonic: string;
    akashData: DirectSecp256k1HdWallet;
}



// export function getLibId(chain: keyof cryptos): string {
//     return blockchains[chain].libid;
// }
/**
 * Generates a 12-word mnemonic from 
 * and derives the Akash identity from it.
 */
export async function generateMnemonicFromGoogle(
    providerId: string,
    email: string,
    deterministic: boolean = false
): Promise<ZkIdentity> {
    const seedMaterial = `${providerId}|${email}`;

    let entropySource: Uint8Array;
    if (deterministic) {
        entropySource = sha256(utils.utf8ToBytes(seedMaterial));
    } else {
        const salt = randomBytes(32);
        const input = utils.concatBytes(utils.utf8ToBytes(seedMaterial), salt);
        entropySource = sha256(input);
    }

    const entropy128 = entropySource.slice(0, 16);
    const mnemonic = bip39.entropyToMnemonic(Buffer.from(entropy128));

    const akashData = await deriveAkash(mnemonic)
    return {
        mnemonic,
        akashData
    };
}
export async function deriveAkash(mnemonic: string): Promise<DirectSecp256k1HdWallet>{
    const akashData = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: "akash" });
    return akashData
}


export function generatexPubxPriv(
    mnemonic: string,
    bip = 48,
    coin: 19167,
    account = 0,
    type = 'p2sh',
  ): xPrivXpub {

    let seed = bip39.mnemonicToSeedSync(mnemonic);
    const uint8 = new Uint8Array(seed);
    // @ts-expect-error assign to null as it is no longer needed
    mnemonic = null;
    const bipParams = fluxBlockchain.bip32;
    const masterKey = HDKey.fromMasterSeed(uint8, bipParams);
  
    const externalChain = masterKey.derive(
      `m/${bip}'/${coin}'/${account}'/${type}'`,
    );

    return externalChain.toJSON();
}


export function generateFluxAddress(xpriv: string){
    const bip32 = fluxBlockchain.bip32;
  
  // 1. Parseamos el xpriv
  const hd = HDKey.fromExtendedKey(xpriv, bip32);

  // 2. Derivamos hasta m/0/0
  const child = hd.derive(`m/44'/19167'/0'/0'`);

  if (!child.privateKey) {
    throw new Error("Private key missing");
  }

  // 3. Obtenemos la public key comprimida
  const pubKey = secp.getPublicKey(child.privateKey, true);

  const sha256Hash = sha256(pubKey); 
  const hash = Buffer.from(sha256Hash)
  const data = hash.toString()
  // 4. Hash160 = RIPEMD160(SHA256(pubKey))
  const hash160 = new RIPEMD160().update(data).digest()
  // 5. Prepend FLUX prefix
  const prefix = Buffer.from("1cb8", "hex");
 const hashuint = new Uint8Array(hash160)
  const uint8 = new Uint8Array(prefix);

  const addressBytes = Buffer.concat([uint8, hashuint]);
  const addressUint = new Uint8Array(addressBytes);

  // 6. base58check encode
  return bs58check.encode(addressUint);
}





export function generateMnemonic(strength: 128 | 256 = 256): string {
    return bip39.generateMnemonic(strength, undefined, wordlist);
}

export function validateMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic, wordlist);
}


// export function generateAddressKeypair(
//     xpriv: string,
//     typeIndex: 0 | 1,
//     addressIndex: number,
//     chain: keyof cryptos,
//   ): keyPair {

   
//     const libID = getLibId(chain);
//     const bipParams = blockchains[chain].bip32;
//     const networkBipParams = utxolib.networks[libID].bip32;
//     let externalChain;
//     let network = utxolib.networks[libID];
//     try {
//       externalChain = HDKey.fromExtendedKey(xpriv, bipParams);
//       network = Object.assign({}, network, {
//         bip32: bipParams,
//       });
//     } catch (e) {
//       console.log(e);
//       externalChain = HDKey.fromExtendedKey(xpriv, networkBipParams);
//     }
  
//     const externalAddress = externalChain
//       .deriveChild(typeIndex)
//       .deriveChild(addressIndex);
  
//     const derivedExternalAddress: minHDKey = utxolib.HDNode.fromBase58(
//       // to get priv key in wif via lib
//       externalAddress.toJSON().xpriv,
//       network,
//     );
  
//     const privateKeyWIF: string = derivedExternalAddress.keyPair.toWIF();
  
//     const publicKey = derivedExternalAddress.keyPair
//       .getPublicKeyBuffer()
//       .toString('hex'); // same as Buffer.from(externalAddress.pubKey).toString('hex);. Library does not expose keypair from just hex of private key, workaround
  
//     return { privKey: privateKeyWIF, pubKey: publicKey };
//   }

// export function generateNodeIdentityKeypair(
//     xpriv: string,
//     typeIndex: 11 | 12,
//     addressIndex: number,
//     chain: keyof cryptos,
// ): keyPair {
//     const libID = getLibId(chain);
//     const bipParams = blockchains[chain].bip32;
//     const networkBipParams = utxolib.networks[libID].bip32;
//     let externalChain;
//     let network = utxolib.networks[libID];
//     try {
//         externalChain = HDKey.fromExtendedKey(xpriv, bipParams);
//         network = Object.assign({}, network, {
//             bip32: bipParams,
//         });
//     } catch (e) {
//         console.log(e);
//         externalChain = HDKey.fromExtendedKey(xpriv, networkBipParams);
//     }

//     const externalAddress = externalChain
//         .deriveChild(typeIndex)
//         .deriveChild(addressIndex);

//     const derivedExternalAddress: minHDKey = utxolib.HDNode.fromBase58(
//         externalAddress.toJSON().xpriv,
//         network,
//     );

//     const privateKeyWIF: string = derivedExternalAddress.keyPair.toWIF();

//     const publicKey = derivedExternalAddress.keyPair
//         .getPublicKeyBuffer()
//         .toString('hex');

//     return { privKey: privateKeyWIF, pubKey: publicKey };
// }


// export function generateExternalIdentityKeypair( // in memory we store just address
//     xpriv: string,
// ): externalIdentity {
//     const chain = 'btc' as keyof cryptos;
//     const typeIndex = 11; // identity index
//     const addressIndex = 0; // identity index
//     const identityKeypair = generateNodeIdentityKeypair(
//         xpriv,
//         typeIndex,
//         addressIndex,
//         chain,
//     );

//     const pubKeyBuffer = Buffer.from(identityKeypair.pubKey, 'hex');
//     const libID = getLibId(chain);
//     const network = utxolib.networks[libID];

//     const genKeypair = utxolib.ECPair.fromPublicKeyBuffer(pubKeyBuffer, network);
//     const address = genKeypair.getAddress();

//     const externalIdentity = {
//         privKey: identityKeypair.privKey,
//         pubKey: identityKeypair.pubKey,
//         address,
//     };
//     return externalIdentity;
// }


