# x402 demo
A demo demonstrating the [x402](https://www.x402.org/) payment flow

## preparation
Address for payment
- SKALE native token: [faucet](https://base-sepolia-faucet.skale.space/)
- payment token
  - [BASE SEPOLIA FAUCET](https://faucet.circle.com/)
  - [bridge to SKALE](https://base-sepolia.skalenodes.com/bridge?from=mainnet&to=jubilant-horrible-ancha&token=usdc&type=erc20)

## server
```
cd server
```
### env
```
cp .env.example .env
```
edit .env to add your own `RECEIVING_ADDRESS`
### install
`npm i`

### run
start server
`npm run dev`

the output will be 
```
🚀 Server running on http://localhost:3000
📡 Using facilitator: https://facilitator.payai.network
💰 Payments go to: 0x497c4F870fBe71433Eeec68f5b076b1dE05C6972
🔗 Network: eip155:324705682
🪙 Payment Token: Bridged USDC (SKALE Bridge) (0x2e08028E3C4c2356572E096d8EF835cD5C6030bD)
```

## client
```
cd client
```
### env
```
cp .env.example .env
```
edit .env to add your own `PRIVATE_KEY`
### install
`npm i`

### run
try to query the data
`npm run dev`

the output will be
```
Agent initialized with wallet: 0xbC59af0EA2c60c7bfbB9fb02BdCcFbdDCECf11a2
Accessing resource: http://localhost:3000/api/data
Payment required (402), processing payment...
Payment settled, tx: 0x9de261ed81cbc6f060f7663a3f9fcefdbab08e11bcee85b0cc16e9930d533484
Resource accessed successfully after payment!
Received data: {
  secret: 'Premium data unlocked!',
  timestamp: '2026-02-05T07:55:38.408Z'
}
```