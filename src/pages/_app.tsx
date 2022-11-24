import type { AppProps } from "next/app";
import Head from "next/head";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ShuttleProvider,
  TerraStationProvider,
  KeplrProvider,
  XDefiProvider,
  LeapTerraProvider,
  LeapCosmosProvider,
  FalconProvider,
  CosmostationProvider,
} from "@delphi-labs/shuttle";

const terraMainnetChainInfo = {
  name: "Terra 2 Mainnet",
  chainId: "phoenix-1",
  chainPrefix: "terra",
  rpc: "https://terra2-delphi-1.simply-vc.com.mt/ZC79CHN02DSI/terra-rpc/",
  rest: "https://phoenix-lcd.terra.dev/",
  defaultCurrency: {
    coinDenom: "LUNA",
    coinMinimalDenom: "uluna",
    coinDecimals: 6,
    coinGeckoId: "terra-luna-2",
  },
  gasPrice: "0.015uluna",
};

const terraTestnetChainInfo = {
  name: "Terra 2 Testnet",
  chainId: "pisco-1",
  chainPrefix: "terra",
  rpc: "https://terra2-delphi-testnet-1.simplystaking.xyz/ZC79CHN02DSI/terra-rpc",
  rest: "https://pisco-lcd.terra.dev/",
  defaultCurrency: {
    coinDenom: "LUNA",
    coinMinimalDenom: "uluna",
    coinDecimals: 6,
    coinGeckoId: "terra-luna-2",
  },
  gasPrice: "0.015uluna",
};

export default function App({ Component, pageProps }: AppProps) {
  const queryClient = new QueryClient();

  return (
    <>
      <Head>
        <title>Shuttle - Port</title>
      </Head>
      <ShuttleProvider
        providers={[
          new CosmostationProvider({
            networks: [terraMainnetChainInfo, terraTestnetChainInfo],
          }),
          new FalconProvider({
            networks: [terraMainnetChainInfo, terraTestnetChainInfo],
          }),
          new LeapTerraProvider({
            networks: [terraMainnetChainInfo, terraTestnetChainInfo],
          }),
          new XDefiProvider({
            networks: [terraMainnetChainInfo, terraTestnetChainInfo],
          }),
          new TerraStationProvider({
            networks: [terraMainnetChainInfo, terraTestnetChainInfo],
          }),
          new LeapCosmosProvider({
            networks: [terraMainnetChainInfo, terraTestnetChainInfo],
          }),
          new KeplrProvider({
            networks: [terraMainnetChainInfo, terraTestnetChainInfo],
          }),
        ]}
        persistent
      >
        <QueryClientProvider client={queryClient}>
          <Component {...pageProps} />
        </QueryClientProvider>
      </ShuttleProvider>
    </>
  );
}
