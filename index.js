const http = require('http');
const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
} = require('discord.js');
const { REST, Routes } = require('discord.js');

const envPath = __dirname + '/.env';
const fs = require('fs');
if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (!match) continue;

        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        if (process.env[match[1]] === undefined) {
            process.env[match[1]] = value;
        }
    }
}

const COMMAND_GUILD_ID = process.env.COMMAND_GUILD_ID || '';

const slashCommands = [
    new SlashCommandBuilder()
        .setName('text')
        .setDescription('Gửi tin nhắn bằng cách nhập nội dung trực tiếp')
        .addStringOption((option) =>
            option
                .setName('noi-dung')
                .setDescription('Nội dung tin nhắn cần gửi')
                .setRequired(false)
        )
        .addStringOption((option) =>
            option
                .setName('id-tin-nhan')
                .setDescription('ID tin nhắn cần reply')
                .setRequired(false)
        )
        .addAttachmentOption((option) =>
            option
                .setName('anh')
                .setDescription('Ảnh muốn gửi')
                .setRequired(false)
        )
        .toJSON(),
    new SlashCommandBuilder()
        .setName('join')
        .setDescription('Bot vào kênh voice bạn đang ở')
        .toJSON(),
    new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Bot rời kênh voice hiện tại')
        .toJSON(),
    new SlashCommandBuilder()
        .setName('randommute')
        .setDescription('Bật/tắt chế độ bắt cóc xuống tầng hầm')
        .toJSON(),
    new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Check avatar người dùng')
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription('Người muốn check (để trống để check chính mình)')
                .setRequired(false)
        )
        .toJSON(),
    new SlashCommandBuilder()
        .setName('user')
        .setDescription('Xem thông tin chi tiết của người dùng')
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription('Người muốn check (để trống để check chính mình)')
                .setRequired(false)
        )
        .toJSON(),
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Kiểm tra độ trễ của bot')
        .toJSON(),
];

const { setupWelcome } = require('./botsystem/welcome.js');
const { setupMessageHandler, setupInteraction: setupMuteInteraction, minesweeperState, saveState, loadState } = require('./botsystem/minesweeper.js');
const { setupPingReply } = require('./botsystem/ping-reply.js');
const { setupInteraction: setupTextInteraction } = require('./botsystem/text.js');
const { setupInteraction: setupVoiceInteraction } = require('./botsystem/voice-chat.js');
const { setupInteraction: setupUserinfoInteraction } = require('./botsystem/avatar-check.js');
const { setupInteraction: setupUserCheckInteraction } = require('./botsystem/user-check.js');
const { setupInteraction: setupPingInteraction } = require('./botsystem/ping.js');

const token = process.env.TOKEN || process.env.DISCORD_TOKEN || '';

// ==========================================
//  WEB SERVER (Giữ Render luôn sống)
// ==========================================
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running 24/7!');
});

server.listen(process.env.PORT || 3000, () => {
    console.log('🌐 Web server đang chạy!');
});

// ==========================================
//  DISCORD CLIENT
// ==========================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
    ],
});

// ==========================================
//  SLASH COMMANDS REGISTRATION
// ==========================================
async function registerSlashCommands() {
    if (!client.application?.id) return;

    const rest = new REST({ version: '10' }).setToken(token);

    try {
        const targetGuildId = COMMAND_GUILD_ID || '';
        const route = targetGuildId
            ? Routes.applicationGuildCommands(client.application.id, targetGuildId)
            : Routes.applicationCommands(client.application.id);

        await rest.put(route, { body: slashCommands });
        console.log(`✅ Slash command đã được đăng ký${targetGuildId ? ` cho server ${targetGuildId}` : ' toàn cầu'}.`);
    } catch (error) {
        console.error('❌ Lỗi đăng ký slash command:', error);
    }
}

// ==========================================
//  READY EVENT
// ==========================================
client.once('ready', async () => {
    console.log(`🤖 Bot online: ${client.user.tag}`);
    loadState();
    await registerSlashCommands();
});

// ==========================================
//  SETUP EVENTS
// ==========================================
setupWelcome(client);
setupMessageHandler(client);
setupPingReply(client);
setupTextInteraction(client);
setupVoiceInteraction(client);
setupMuteInteraction(client, minesweeperState, saveState);
setupUserinfoInteraction(client);
setupUserCheckInteraction(client);
setupPingInteraction(client);

// ==========================================
//  ĐĂNG NHẬP
// ==========================================
if (!token) {
    console.error('❌ TOKEN chưa được cấu hình. Hãy thiết lập biến môi trường TOKEN hoặc thêm vào file .env.');
    process.exit(1);
}

client.login(token).catch((error) => {
    console.error('❌ Lỗi đăng nhập Discord:', error);
    process.exit(1);
});
