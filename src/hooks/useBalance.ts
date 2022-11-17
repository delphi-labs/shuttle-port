import { useQuery } from "@tanstack/react-query";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { WalletConnection } from "@delphi-labs/shuttle";

export const TOKEN_DECIMALS = 1000000;

export default function useBalance(wallet: WalletConnection | null, tokenAddress: string) {
  return useQuery(['balance', wallet?.id, tokenAddress], async () => {
    if (!wallet || !tokenAddress) {
      return 0;
    }

    const client = await CosmWasmClient.connect(wallet?.network.rpc || "");

    if (tokenAddress.startsWith("u")) {
      const response = await client.getBalance(
        wallet?.account.address || "",
        tokenAddress
      );
      return Number(response.amount) / TOKEN_DECIMALS;
    } 

    const response = await client.queryContractSmart(
      tokenAddress,
      {
        balance: {
          address: wallet?.account.address || "",
        },
      }
    );

    return Number(response.balance) / TOKEN_DECIMALS;
  }, {
    enabled: !!wallet && !!tokenAddress,
    initialData: 0,
    placeholderData: 0,
  });
}