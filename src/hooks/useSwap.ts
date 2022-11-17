import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { WalletConnection } from "@delphi-labs/shuttle";

const TOKEN_DECIMALS = 1000000;

const toBase64 = (obj: object) => {
  return Buffer.from(JSON.stringify(obj)).toString("base64");
};

type SimulateProps = {
  amount: number;
  offerAssetAddress: string;
  poolAddress: string;
  wallet: WalletConnection | null;
};

function useSwapSimulate({ amount, offerAssetAddress, poolAddress, wallet }: SimulateProps) {
  return useQuery(['swap-simulate', amount, offerAssetAddress, poolAddress], async () => {
    if (!amount || amount <= 0 || !offerAssetAddress || !poolAddress || !wallet) {
      return null;
    }

    const client = await CosmWasmClient.connect(wallet?.network.rpc || "");

    const response = await client.queryContractSmart(
      poolAddress,
      {
        simulation: {
          offer_asset: {
            amount: String(amount * TOKEN_DECIMALS),
            info: { token: { contract_addr: offerAssetAddress } },
          },
        },
      }
    );

    return {
      amount: Number(response.return_amount) / TOKEN_DECIMALS,
      commission: Number(response.commission_amount) / TOKEN_DECIMALS,
      spread: Number(response.spread_amount) / TOKEN_DECIMALS,
      price: (amount * TOKEN_DECIMALS / Number(response.return_amount)),
    };
  }, {
    enabled: !!amount && amount > 0 && !!offerAssetAddress && !!poolAddress && !!wallet,
  });
}


type Props = {
  amount: number;
  offerAssetAddress: string;
  poolAddress: string;
  wallet: WalletConnection | null;
  slippage?: number;
};

export default function useSwap({ amount, offerAssetAddress, poolAddress, slippage = 0.005, wallet }: Props) {
  const simulate = useSwapSimulate({ amount, offerAssetAddress, poolAddress, wallet });

  const msgs = useMemo(() => {
    if (!amount || amount <= 0 || !offerAssetAddress || !poolAddress || !wallet) {
      return [];
    }
    
    return [
      {
        type: "/cosmwasm.wasm.v1.MsgExecuteContract",
        sender: wallet?.account.address || "",
        contract: offerAssetAddress,
        msg: {
          send: {
            amount: String(amount * TOKEN_DECIMALS),
            contract: poolAddress,
            msg: toBase64({
              swap: {
                max_spread: String(slippage),
                belief_price: String(simulate.data?.price || 1),
              },
            }),
          },
        }        
      }
    ];
}, [wallet, offerAssetAddress, poolAddress, amount, slippage, simulate]);

  return useMemo(() => {
    return { msgs, simulate };
  }, [msgs, simulate]);
}