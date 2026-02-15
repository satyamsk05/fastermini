# Base dApp Deployment

## Smart Contract Deployment

This project includes a `GenesisLegends` ERC721 smart contract.

### Prerequisites

1.  **Node.js**: Ensure you have Node.js installed.
2.  **Wallet**: You need a wallet with Base Mainnet ETH for deployment gas.
3.  **Environment Variables**: Create a `.env` file in the root directory:

    ```env
    PRIVATE_KEY=your_private_key_without_0x_prefix
    ```

### Deployment Steps

1.  **Compile the Contract**:
    Run the compilation script to generate artifacts.
    ```bash
    node scripts/compile.cjs
    ```

2.  **Deploy to Base Mainnet**:
    Run the deployment script.
    ```bash
    node scripts/deploy_manual.cjs
    ```

    The script will output the deployed contract address.
    
    > **Note**: Update the `initialBaseURI` variable in `scripts/deploy_manual.cjs` before deploying if you have your IPFS metadata ready.

3.  **Verify on Basescan**:
    After deployment, you can verify your contract on [Basescan](https://basescan.org) using the flattened source code or standard verification tools.
