import { fromBase64, toUtf8 } from "@cosmjs/encoding";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { OfflineDirectSigner, AccountData } from "@cosmjs/proto-signing";
import { calculateFee } from "@cosmjs/stargate";
import { useQuery } from "@tanstack/react-query";
import { BroadcastMessage, WalletConnection } from "@delphi-labs/shuttle";

type Props = {
  messages: BroadcastMessage[];
  wallet: WalletConnection | null;
};

class Signer implements OfflineDirectSigner {
  private readonly wallet: WalletConnection | null;

  constructor(wallet: WalletConnection | null) {
    this.wallet = wallet;
  }

  async getAccounts(): Promise<readonly AccountData[]> {
    return [
      {
        address: this.wallet?.account.address || "",
        algo: this.wallet?.account.algo || "secp256k1",
        pubkey: fromBase64(this.wallet?.account.pubkey || ""),
      },
    ];
  }

  async signDirect(signerAddress: string, signDoc: any): Promise<any> {
    throw new Error("Method not implemented.");
  }
}

const GAS_MULTIPLIER = 1.3;

export default function useFeeEstimate({ messages, wallet }: Props) {
  return useQuery(['fee-estimate', JSON.stringify(messages), wallet?.id], async () => {
    if (!messages || messages.length <= 0 || !wallet) {
      return null;
    }

    const signer = new Signer(wallet);
    const signingClient = await SigningCosmWasmClient.connectWithSigner(wallet.network.rpc || "", signer);
    
    const processedMessages = messages.map((message) => {
      return {
        typeUrl: message.type,
        value: {
          sender: message.sender,
          contract: message.contract,
          msg: toUtf8(JSON.stringify(message.msg)),
        }
      };
    });
    const gasEstimation = await signingClient.simulate(wallet.account.address || "", processedMessages, "");

    const fee = calculateFee(Math.round(gasEstimation * GAS_MULTIPLIER), wallet.network.gasPrice || "0.2uluna");

    return {
      fee: fee.amount[0],
      gasLimit: fee.gas,
    }
  }, {
    enabled: !!messages && messages.length > 0 && !!wallet,
  });
}