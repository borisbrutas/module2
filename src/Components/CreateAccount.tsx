import React, { useEffect, useState } from "react";
import { Button } from "@mui/material";
import {
  Connection,
  clusterApiUrl,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmRawTransaction,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import * as buffer from "buffer";
window.Buffer = buffer.Buffer;

type DisplayEncoding = "utf8" | "hex";

type PhantomEvent = "disconnect" | "connect" | "accountChanged";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions"
  | "signMessage";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (
    message: Uint8Array | string,
    display?: DisplayEncoding
  ) => Promise<any>;
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, handler: (args: any) => void) => void;
  request: (method: PhantomRequestMethod, params: any) => Promise<unknown>;
}

const getProvider = (): PhantomProvider | undefined => {
  if ("solana" in window) {
    // @ts-ignore
    const provider = window.solana as any;
    if (provider.isPhantom) return provider as PhantomProvider;
  }
};

function CreateAccount() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const [wallet, setWallet] = useState<Keypair>();
  const [toWallet, setToWallet] = useState<Keypair>();
  const [balance, setBalance] = useState<number>(0);
  const [provider, setProvider] = useState<PhantomProvider | undefined>(
    undefined
  );

  // create state variable for the wallet key
  const [toWalletKey, setWalletKey] = useState<PhantomProvider | undefined>(
    undefined
  );

  const createNewWallet = async () => {
    if (wallet === undefined) {
      const newPair = Keypair.generate();
      setWallet(newPair);
      return newPair;
    }
  };
  
  useEffect(() => {
    const provider = getProvider();

    // if the phantom provider exists, set this as the provider
    if (provider) setProvider(provider);
    else setProvider(undefined);
  }, []);

  const airdropSol = async () => {
    if (wallet !== undefined) {
      const airDropSignature = await connection.requestAirdrop(
        wallet.publicKey,
        2 * LAMPORTS_PER_SOL
      );

      let latestBlockHash = await connection.getLatestBlockhash();

      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: airDropSignature,
      });

      const walletBalance = await connection.getBalance(wallet.publicKey);

      const currentBalance = walletBalance / LAMPORTS_PER_SOL;

      setBalance(currentBalance);
    }
}


    const connectWallet = async () => {
      // @ts-ignore
      const { solana } = window;

      // checks if phantom wallet exists
      if (solana) {
        try {
          // connects wallet and returns response which includes the wallet public key
          const response = await solana.connect();
          console.log("wallet account ", response.publicKey.toString());
          // update walletKey to be the public key
          setWalletKey(response.publicKey);
          setToWallet(response);
        } catch (err) {
          // { code: 4001, message: 'User rejected the request.' }
          console.log(err);
        }
      }
    };

    const disconnectWallet = async () => {
      // @ts-ignore
      const { solana } = window;

      const response = await solana.disconnect();
      setWalletKey(undefined);
    };

    const transferSol = async() => {

        if(toWallet !== undefined && wallet !== undefined) {
            console.log("from: ", getBalance(wallet));
            console.log("to: ", getBalance(toWallet));

            var transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: toWallet.publicKey,
                lamports: 2 * LAMPORTS_PER_SOL
            })
        );
        var signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [wallet]);

        console.log('Signature is ', signature);

        }
    }

    const getBalance = async (wallet : Keypair) => {
        
        const walletBalance = await connection.getBalance(
            new PublicKey(wallet.publicKey)
        );
    
        return walletBalance / LAMPORTS_PER_SOL;
    }

  return (
    <div>
      Target Wallet: {wallet !== undefined ? wallet.publicKey.toBase58() : ""}
      <Button variant="outlined" onClick={createNewWallet}>
        Create Account
      </Button>
      <Button variant="outlined" onClick={airdropSol}>
        Airdop 2 SOL
      </Button>
      <p>Balance: {balance}</p>
      {provider && toWalletKey && (
        <Button variant="outlined" onClick={disconnectWallet}>
          Disconnect
        </Button>
      )}
      {provider && !toWalletKey && (
        <Button variant="outlined" onClick={connectWallet}>
          Connect Wallet
        </Button>
      )}
      {provider && toWalletKey && <p>Connected account {toWalletKey.toString()}</p>}
      {provider && toWalletKey && <Button onClick={transferSol}>Transfer Sol</Button>}
      {!provider && (
        <p>
          No provider found. Install{" "}
          <a href="https://phantom.app/">Phantom Browser extension</a>
        </p>
      )}
    </div>
  );
}

export default CreateAccount;
