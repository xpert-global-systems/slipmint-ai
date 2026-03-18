import axios from "axios";
import { config } from "../../config/env.js";

export async function sendDiscordAlert(message, embed = null) {
    if (!config.alerts.discordWebhook) {
        console.error("❌ No Discord webhook configured.");
        return;
    }

    const payload = embed
        ? { content: message, embeds: [embed] }
        : { content: message };

    try {
        await axios.post(config.alerts.discordWebhook, payload);
        console.log("📨 Discord alert sent.");
    } catch (err) {
        console.error("❌ Failed to send Discord alert:", err.message);
    }
}
