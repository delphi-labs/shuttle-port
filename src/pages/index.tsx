import { useState } from "react";
import type { NextPage } from "next";
import { useShuttle } from "@delphi-labs/shuttle";
import useBalance, { TOKEN_DECIMALS } from "../hooks/useBalance";
import useSwap from "../hooks/useSwap";
import useFeeEstimate from "../hooks/useFeeEstimate";

type ASTROPORT_CONTRACTS = {
  [key: string]: {
    astroContractAddress: string;
    xAstroContractAddress: string;
    astroxAstroPoolAddress: string;
    astroLunaPoolAddress: string;
  };
};

const CONTRACTS: ASTROPORT_CONTRACTS = {
  "phoenix-1": {
    astroContractAddress:
      "terra1nsuqsk6kh58ulczatwev87ttq2z6r3pusulg9r24mfj2fvtzd4uq3exn26",
    xAstroContractAddress:
      "terra1x62mjnme4y0rdnag3r8rfgjuutsqlkkyuh4ndgex0wl3wue25uksau39q8",
    astroxAstroPoolAddress:
      "terra1muhks8yr47lwe370wf65xg5dmyykrawqpkljfm39xhkwhf4r7jps0gwl4l",
    astroLunaPoolAddress:
      "terra13rj43lsucnel7z8hakvskr7dkfj27hd9aa06pcw4nh7t66fgt7qshrpmaw",
  },
  "pisco-1": {
    astroContractAddress:
      "terra167dsqkh2alurx997wmycw9ydkyu54gyswe3ygmrs4lwume3vmwks8ruqnv",
    xAstroContractAddress:
      "terra1ctzthkc0nzseppqtqlwq9mjwy9gq8ht2534rtcj3yplerm06snmqfc5ucr",
    astroxAstroPoolAddress:
      "terra19gn0pd6a7n8kgmdg8h76t70rzssf0dguvetjfkq5y78v8cr6fk3s7jfvgl",
    astroLunaPoolAddress: "...",
  },
};

const HomePage: NextPage = () => {
  const { providers, recentWallet, connect, disconnect, broadcast, sign } =
    useShuttle();
  const [amount, setAmount] = useState<number>(0);
  const lunaBalance = useBalance(recentWallet, "uluna");
  const astroBalance = useBalance(
    recentWallet,
    CONTRACTS[recentWallet?.network.chainId || "phoenix-1"].astroContractAddress
  );
  const xAstroBalance = useBalance(
    recentWallet,
    CONTRACTS[recentWallet?.network.chainId || "phoenix-1"]
      .xAstroContractAddress
  );

  const swap = useSwap({
    amount,
    offerAssetAddress:
      CONTRACTS[recentWallet?.network.chainId || "phoenix-1"]
        .astroContractAddress,
    poolAddress:
      CONTRACTS[recentWallet?.network.chainId || "phoenix-1"]
        .astroxAstroPoolAddress,
    wallet: recentWallet,
  });

  const { data: feeEstimate } = useFeeEstimate({
    messages: swap.msgs,
    wallet: recentWallet,
  });

  const onSwap = () => {
    broadcast({
      messages: swap.msgs,
      feeAmount: feeEstimate?.fee.amount,
      gasLimit: feeEstimate?.gasLimit,
    })
      .then((result) => {
        console.log("result", result);
        setAmount(0);
        lunaBalance.refetch();
        astroBalance.refetch();
        xAstroBalance.refetch();
      })
      .catch((error) => {
        console.error("Broadcast error", error);
      });
  };

  const onSign = () => {
    sign({
      messages: swap.msgs,
      feeAmount: feeEstimate?.fee.amount,
      gasLimit: feeEstimate?.gasLimit,
    })
      .then((result) => {
        console.log("result", result);
        setAmount(0);
        lunaBalance.refetch();
        astroBalance.refetch();
        xAstroBalance.refetch();
      })
      .catch((error) => {
        console.error("Signing error", error);
      });
  };

  return (
    <div>
      <header>
        <h1>Shuttle Port</h1>

        <div>
          {providers.map((provider) => {
            return (
              <div key={provider.id}>
                {Array.from(provider.networks.values()).map((network) => {
                  return (
                    <button
                      key={`${provider.id}-${network.chainId}`}
                      disabled={!provider.initialized}
                      onClick={() => {
                        connect(provider.id, network.chainId);
                      }}
                    >
                      Connect {provider.name} ({network.name})
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {recentWallet && (
          <>
            <h2>Recent Wallet</h2>
            <p>ID: {recentWallet.id}</p>
            <p>Provider ID: {recentWallet.providerId}</p>
            <p>Chain ID: {recentWallet.network.chainId}</p>
            <p>Address: {recentWallet.account.address}</p>
            <p>$LUNA Balance: {lunaBalance.data.toString()}</p>
            <button onClick={() => disconnect()}>Disconnect</button>
          </>
        )}
      </header>

      <hr />
      <br />

      <main>
        <h3>Swap ASTRO &lt;&gt; xASTRO</h3>
        <div>
          <label>ASTRO:</label>
          <input
            type="text"
            placeholder="ASTRO"
            disabled={astroBalance.data <= 0}
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
          />
          <br />
          <p>Balance: {astroBalance.data.toString()}</p>
        </div>
        <br />
        <div>
          <label>xASTRO:</label>
          <input
            type="text"
            placeholder="xASTRO"
            disabled
            value={swap.simulate?.data?.amount || 0}
          />
          <br />
          <p>Balance: {xAstroBalance.data.toString()}</p>
        </div>
        <br />
        <div>
          <button
            onClick={onSwap}
            disabled={
              astroBalance.data <= 0 ||
              amount <= 0 ||
              amount > astroBalance.data
            }
          >
            Swap
          </button>{" "}
          <button
            onClick={onSign}
            disabled={
              astroBalance.data <= 0 ||
              amount <= 0 ||
              amount > astroBalance.data
            }
          >
            Sign
          </button>
        </div>
        {feeEstimate && (
          <div>
            <p>
              Fee: {parseInt(feeEstimate?.fee.amount || "0") / TOKEN_DECIMALS}{" "}
              LUNA
            </p>
          </div>
        )}
      </main>

      <br />
      <hr />

      <footer>
        <a
          href="https://twitter.com/delphi_labs"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by Delphi Labs
        </a>
      </footer>
    </div>
  );
};

export default HomePage;
