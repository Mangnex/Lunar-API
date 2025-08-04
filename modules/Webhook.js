const { WebhookClient } = require('discord.js');
const Configs = require('../configs').DISCORD;

// Webhooks
const SuccessWebhook = new WebhookClient({ url: Configs.EXECUTIONS_WEBHOOK });
const UnauthorizedWebhook = new WebhookClient({ url: Configs.ALERTS_WEBHOOK });

async function Success(data) {
    try {
        await SuccessWebhook.send({
            embeds: [
                {
                    color: 0xFFFFFF,
                    title: '<:Lunar:1319030977007456277> Script executed',
                    description: 'This user has executed the script successfully!',
                    fields: [
                        { name: 'HWID:', value: `||\`\`\`${data.Hwid}\`\`\`||`, inline: true },
                        { name: 'Executor:', value: `\`\`\`${data.UserAgent}\`\`\``, inline: true },
                        { name: 'Script:', value: `\`\`\`${data.Script}\`\`\``, inline: true },
                        { name: 'Duration:', value: `\`\`\`${data.Duration}s\`\`\``, inline: true },
                    ],
                    footer: {
                        text: Configs.WEBHOOK_NAME,
                        icon_url: Configs.WEBHOOK_ICON
                    },
                    timestamp: new Date(),
                },
            ]
        });
    } catch (err) {
        console.error(err);
    }
}

async function Blacklist(data) {
    try {
        await UnauthorizedWebhook.send({
            embeds: [
                {
                    color: 0x800080,
                    title: '📡 VPN Detected',
                    description: 'The user tried to bypass the ban using a VPN!',
                    fields: [
                        { name: 'HWID:', value: `||\`\`\`${data.Hwid}\`\`\`||`, inline: true },
                        { name: 'Executor:', value: `\`\`\`${data.UserAgent}\`\`\``, inline: true },
                        { name: 'Ip:', value: `||\`\`\`${data.Ip}\`\`\`||`, inline: true },
                        { name: 'Duration:', value: `\`\`\`${data.Duration}s\`\`\``, inline: true },
                    ],
                    footer: {
                        text: Configs.WEBHOOK_NAME,
                        icon_url: Configs.WEBHOOK_ICON
                    },
                    timestamp: new Date(),
                },
            ]
        });
    } catch (err) {
        console.error(err);
    }
}

async function Unauthorized(data) {
    try {
        await UnauthorizedWebhook.send({
            embeds: [
                {
                    color: 0xED4245,
                    title: '⚠️ Suspicious Client',
                    description: "This client's activity was detected as unusual!",
                    fields: [
                        { name: 'HWID:', value: `||\`\`\`${data.Hwid}\`\`\`||`, inline: true },
                        { name: 'Executor:', value: `\`\`\`${data.UserAgent}\`\`\``, inline: true },
                        { name: 'Ip:', value: `||\`\`\`${data.Ip}\`\`\`||`, inline: true },
                        { name: 'Reason:', value: `\`\`\`${data.Reason}\`\`\``, inline: true },
                        { name: 'Duration:', value: `\`\`\`${data.Duration}s\`\`\``, inline: true },
                    ],
                    footer: {
                        text: Configs.WEBHOOK_NAME,
                        icon_url: Configs.WEBHOOK_ICON
                    },
                    timestamp: new Date(),
                },
            ]
        });
    } catch (err) {
        console.error(err);
    }
}

module.exports = { Success, Blacklist, Unauthorized };