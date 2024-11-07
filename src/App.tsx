import React, { useCallback, useEffect, useState } from "react";
import ControllerConnector from "@cartridge/connector";
import { shortString } from "starknet";
import { StarknetConfig, useAccount, useConnect, useDisconnect, useExplorer } from "@starknet-react/core";
import { Chain, sepolia } from "@starknet-react/chains";
import { RpcProvider } from "starknet";

// Ethereum token address and contract settings
const ETH_TOKEN_ADDRESS = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";

// Configure Cartridge Connector with policies
const connector = new ControllerConnector({
  policies: [
    {
      target: ETH_TOKEN_ADDRESS,
      method: "approve",
      description: "Allow approval of tokens for spending.",
    },
    {
      target: ETH_TOKEN_ADDRESS,
      method: "transfer",
      description: "Allow transfer of tokens.",
    },
  ],
  rpc: "https://api.cartridge.gg/x/starknet/sepolia",
});

// Provider function for StarknetConfig
function provider(chain: Chain) {
  return new RpcProvider({
    nodeUrl: "https://api.cartridge.gg/x/starknet/sepolia",
  });
}

const ConnectWallet = () => {
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address } = useAccount();
  const [username, setUsername] = useState<string>();

  // Use the first connector (assumes it's ControllerConnector)
  const controllerConnector = connectors[0] as ControllerConnector;

  useEffect(() => {
    if (!address || !controllerConnector) return;
    controllerConnector.username()?.then((n) => setUsername(n));
  }, [address, controllerConnector]);

  return (
    <div>
      {address ? (
        <>
          <p>Account: {address}</p>
          {username && <p>Username: {username}</p>}
          <button onClick={() => disconnect()}>Disconnect</button>
        </>
      ) : (
        <button onClick={() => connect({ connector: controllerConnector })}>
          Connect
        </button>
      )}
    </div>
  );
};

const TransferEth = () => {
  const { account } = useAccount();
  const explorer = useExplorer();
  const [submitted, setSubmitted] = useState(false);
  const [txnHash, setTxnHash] = useState<string>();

  const execute = useCallback(
    async (amount: string) => {
      if (!account) return;

      setSubmitted(true);
      setTxnHash(undefined);

      try {
        const { transaction_hash } = await account.execute([
          {
            contractAddress: ETH_TOKEN_ADDRESS,
            entrypoint: "approve",
            calldata: [account.address, amount, "0x0"],
          },
          {
            contractAddress: ETH_TOKEN_ADDRESS,
            entrypoint: "transfer",
            calldata: [account.address, amount, "0x0"],
          },
        ]);
        setTxnHash(transaction_hash);
      } catch (error) {
        console.error(error);
      } finally {
        setSubmitted(false);
      }
    },
    [account]
  );

  if (!account) return null;

  return (
    <div>
      <h2>Transfer ETH</h2>
      <p>Contract: {ETH_TOKEN_ADDRESS}</p>
      <button onClick={() => execute("0x1C6BF52634000")} disabled={submitted}>
        Transfer 0.005 ETH to self
      </button>
      {txnHash && (
        <p>
          Transaction hash:{" "}
          <a href={explorer.transaction(txnHash)} target="_blank" rel="noreferrer">
            {txnHash}
          </a>
        </p>
      )}
    </div>
  );
};

const App = () => {
  return (
    <StarknetConfig
      autoConnect
      chains={[sepolia]}
      connectors={[connector]}
      explorer={starkscan}
      provider={provider}
    >
      <div style={{ textAlign: "center", padding: "20px" }}>
        <h1>Cartridge Integration Example</h1>
        <ConnectWallet />
        <TransferEth />
      </div>
    </StarknetConfig>
  );
};

export default App;
