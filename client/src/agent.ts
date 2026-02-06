import { x402Client, x402HTTPClient } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, http, formatEther, type PublicClient } from "viem";
import { skaleChain } from "./chain.js";
import "dotenv/config";

type AccessResult = {
    success: boolean;
    data?: unknown;
    error?: string;
};

class BasicAgent {
    private httpClient: x402HTTPClient;
    private walletAddress: string;
    private publicClient: PublicClient;

    private constructor(
        httpClient: x402HTTPClient,
        walletAddress: string,
        publicClient: PublicClient
    ) {
        this.httpClient = httpClient;
        this.walletAddress = walletAddress;
        this.publicClient = publicClient;
    }

    static async create(): Promise<BasicAgent> {
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            throw new Error("PRIVATE_KEY environment variable is required");
        }

        // Create wallet account from private key
        const account = privateKeyToAccount(privateKey as `0x${string}`);

        // Create EVM scheme for signing payments
        const evmScheme = new ExactEvmScheme(account);

        // Register scheme for all EVM networks
        const coreClient = new x402Client().register("eip155:*", evmScheme);
        const httpClient = new x402HTTPClient(coreClient);

        // Create public client for balance checks
        const publicClient = createPublicClient({
            chain: skaleChain,
            transport: http(),
        });

        console.log(`Agent initialized with wallet: ${account.address}`);

        return new BasicAgent(httpClient, account.address, publicClient);
    }

    async accessResource(url: string): Promise<AccessResult> {
        console.log(`Accessing resource: ${url}`);

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            if (response.status === 402) {
                return this.handlePaymentRequired(response, url);
            }

            if (!response.ok) {
                return { success: false, error: `Request failed: ${response.status}` };
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            return { success: false, error: message };
        }
    }

    private async handlePaymentRequired(
        response: Response,
        url: string
    ): Promise<AccessResult> {
        console.log("Payment required (402), processing payment...");

        try {
            const responseBody = await response.json();

            // Get payment requirements from response headers and body
            const paymentRequired = this.httpClient.getPaymentRequiredResponse(
                (name: string) => response.headers.get(name),
                responseBody
            );

            // Create signed payment payload
            const paymentPayload = await this.httpClient.createPaymentPayload(paymentRequired);
            console.log("Payment payload", paymentPayload);

            // Encode payment headers for the retry request
            const paymentHeaders = this.httpClient.encodePaymentSignatureHeader(paymentPayload);

            // Retry request with payment
            const paidResponse = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...paymentHeaders,
                },
            });

            if (!paidResponse.ok) {
                // Get detailed error from response
                const errorBody = await paidResponse.text();
                const errorHeaders = Object.fromEntries(paidResponse.headers.entries());
                console.error("Payment rejection details:");
                console.error("Status:", paidResponse.status);
                console.error("Headers:", JSON.stringify(errorHeaders, null, 2));
                console.error("Body:", errorBody);
                return { success: false, error: `Payment failed: ${paidResponse.status} - ${errorBody}` };
            }

            // Check settlement response
            const settlement = this.httpClient.getPaymentSettleResponse(
                (name: string) => paidResponse.headers.get(name)
            );

            if (settlement?.transaction) {
                console.log(`Payment settled, tx: ${settlement.transaction}`);
            }

            const data = await paidResponse.json();
            console.log("Resource accessed successfully after payment!");
            return { success: true, data };
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            console.error("Payment processing failed:", message);
            return { success: false, error: message };
        }
    }

}

export default BasicAgent;