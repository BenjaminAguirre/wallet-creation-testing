// @grid/zk-auth
import { sha256 } from '@noble/hashes/sha2';
import * as secp from '@noble/secp256k1';
import * as utils from '@noble/hashes/utils';
import { randomBytes } from '@noble/hashes/utils';
import * as bip39 from 'bip39';
import * as utxolib from '@bitgo/utxo-lib';
import { coin, DirectSecp256k1HdWallet, toHex } from "cosmwasm";
import { wordlist } from '@scure/bip39/wordlists/english';
import { Buffer } from 'buffer';
import { HDKey } from '@scure/bip32';
import { fluxBlockchain } from '../blockchains';
import * as bitcoin from 'bitcoinjs-lib';

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
interface Network {
    wif: number;
    bip32: {
        public: number;
        private: number;
    };
    messagePrefix?: string;
    bech32?: string;
    pubKeyHash?: number;
    scriptHash?: number;
}

export const flux : Network = {
    wif: 0x80,          // Wallet Import Format
    bip32: {
        public: 0x0488b21e, // xpub
        private: 0x0488ade4  // xpriv
    },
    messagePrefix: '\x18Flux Signed Message:\n',
    bech32: '', // Flux no usa direcciones Bech32
    pubKeyHash: 0x1c, // direcciones P2PKH empiezan con "1"
    scriptHash: 0x32, // 0x1cbd = 7357// direcciones P2SH empiezan con "3"
  };


// const network: bitcoin.networks.Network = {
//     messagePrefix: '\x18Bitcoin Signed Message:\n',
//     bech32: 'bc',
//     bip32: {
//         public: 0x0488b21e,
//         private: 0x0488ade4
//     },
//     pubKeyHash: 0x00,
//     scriptHash: 0x05,
//     wif: 0x80
// };



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
export async function deriveAkash(mnemonic: string): Promise<DirectSecp256k1HdWallet> {
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

export function generateNodeIdentityKeypair(
    xpriv: string,
): keyPair {
    const network = utxolib.networks.bitcoin
    const externalid = HDKey.fromExtendedKey(
        xpriv,
        network.bip32
    );
    const externalAddress = externalid.deriveChild(11).deriveChild(0);

    const keyNode = utxolib.bip32.fromBase58(externalAddress.privateExtendedKey, network);
    const wif = keyNode.toWIF();
    const pubkeyHex = keyNode.publicKey.toString('hex');
    console.log(wif);
    
    return {
        privKey: wif,
        pubKey: pubkeyHex
    }
}


export function generateFluxKeyPair(xpriv: string) {
    const bip32 = fluxBlockchain.bip32;

    const hd = HDKey.fromExtendedKey(xpriv, bip32);

    const child = hd.derive(`m/44'/19167'/0'/0'`);

    if (!child.privateKey) {
        throw new Error("Private key missing");
    }
    const keyNode = utxolib.bip32.fromBase58(child.privateExtendedKey, flux);
    const wif = keyNode.toWIF();
    console.log(wif);
    
    
    // 3. Obtenemos la public key comprimida
    const pubKey = secp.getPublicKey(child.privateKey, true);

    const sha256Hash = sha256(pubKey);
    const hash = Buffer.from(sha256Hash)
    const data = hash.toString()
    const hash160 = new RIPEMD160().update(data).digest()
    const prefix = Buffer.from("1cb8", "hex");
    const hashuint = new Uint8Array(hash160)
    const uint8 = new Uint8Array(prefix);

    const addressBytes = Buffer.concat([uint8, hashuint]);
    const addressUint = new Uint8Array(addressBytes);

    // 6. base58check encode
    return {
        address: bs58check.encode(addressUint),
        privKeyFlux: wif 
    }
}

export function generateExternalIdentityKeypair(
    xpriv: string,
): externalIdentity {
    const identityKeypair = generateNodeIdentityKeypair(xpriv)

    const pubKeyBuffer = Buffer.from(identityKeypair.pubKey, "hex");


    const network = utxolib.networks.bitcoin;
    const genKeypair = utxolib.ECPair.fromPublicKey(pubKeyBuffer, {network})

    const { address } = utxolib.payments.p2pkh({
        pubkey: genKeypair.publicKey,
        network,
      }); 


    const externalIdentity = {
        privKey: identityKeypair.privKey,
        pubKey: identityKeypair.pubKey,
        address: address || ""
      };
      return externalIdentity;
    }


export function generateMnemonic(strength: 128 | 256 = 256): string {
    return bip39.generateMnemonic(strength, undefined, wordlist);
}

export function validateMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic, wordlist);
}


