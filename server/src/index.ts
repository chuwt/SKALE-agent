import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import type { Network } from "@x402/core/types";
import "dotenv/config";
import { setGlobalDispatcher, ProxyAgent } from "undici";

// for proxy support
const proxy =
  process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

if (proxy) {
  setGlobalDispatcher(new ProxyAgent(proxy));
}

const app = new Hono();

async function main() {
    const facilitatorUrl = process.env.FACILITATOR_URL || "https://facilitator.payai.network";
    const receivingAddress = process.env.RECEIVING_ADDRESS as `0x${string}` || "0x497c4F870fBe71433Eeec68f5b076b1dE05C6972";
    const paymentTokenAddress = process.env.PAYMENT_TOKEN_ADDRESS as `0x${string}` || "0x2e08028E3C4c2356572E096d8EF835cD5C6030bD";
    const paymentTokenName = process.env.PAYMENT_TOKEN_NAME || "Bridged USDC (SKALE Bridge)";
    const networkChainId = process.env.NETWORK_CHAIN_ID || "324705682";
    const network: Network = `eip155:${networkChainId}`;

    // Setup facilitator client and resource server
    const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });
    const resourceServer = new x402ResourceServer(facilitatorClient);
    
    // Register the exact scheme for EVM networks
    resourceServer.register("eip155:*", new ExactEvmScheme());

    // Public endpoint
    app.get("/", (c) => {
        return c.json({ message: "Welcome! Access /premium/* endpoints for paid content" });
    });

    // Apply payment middleware to protected routes
    app.use(
        paymentMiddleware(
            {
                "GET /api/data": {
                    accepts: [
                        {
                            scheme: "exact",
                            network: network,
                            payTo: receivingAddress,
                            price: {
                                amount: "10000",
                                asset: paymentTokenAddress,
                                extra: {
                                    name: paymentTokenName,
                                    version: "2",
                                },
                            },
                        },
                    ],
                    description: "Premium data access",
                    mimeType: "application/json",
                },
            },
            resourceServer,
        ),
    );

    // Protected endpoint
    app.get("/api/data", (c) => {
        return c.json({
            secret: "Premium data unlocked!",
            timestamp: new Date().toISOString(),
        });
    });

    const port = Number(process.env.PORT) || 3000;
    const hostname = process.env.HOST || "0.0.0.0";
    serve({ fetch: app.fetch, port, hostname }, () => {
    console.log(`🚀 Server running on http://${hostname}:${port}`);
    console.log(`📡 Using facilitator: ${facilitatorUrl}`);
    console.log(`💰 Payments go to: ${receivingAddress}`);
    console.log(`🔗 Network: ${network}`);
    console.log(`🪙 Payment Token: ${paymentTokenName} (${paymentTokenAddress})`);
    });
}

main().catch(console.error);