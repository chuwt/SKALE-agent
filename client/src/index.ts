import BasicAgent from "./agent.js";
import "dotenv/config";

async function main() {
    // Create the agent (async factory pattern)
    const agent = await BasicAgent.create();

    // Get API URL from environment variable
    const apiUrl = process.env.API_URL || "http://localhost:3000/api/data";

    // Access a paywalled resource
    const result = await agent.accessResource(apiUrl);

    if (result.success) {
        console.log("Received data:", result.data);
    } else {
        console.error("Error:", result.error);
    }
}

main().catch(console.error);