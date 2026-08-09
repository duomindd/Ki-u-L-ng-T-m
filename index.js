const http = require('http');
const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
} = require('discord.js');
const { REST, Routes } = require('discord.js');

const envPath = __dirname + '/.env';
const fs = require('fs');
console.log('🔧 Đang load file cấu hình .env...');
if (fs.existsSync(envPath)) {
    console.log('✅ File .env tìm thấy tại:', envPath);
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (!match) continue;

        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        if (process.env[match[1]] === undefined) {
            process.env[match[1]] = value;
            console.log(`   📝 Load biến: ${match[1]}`);
        }
    }
    console.log('✅ Đã load xong biến môi trường từ .env');
} else {
    console.log('⚠️ Không tìm thấy file .env, sử dụng biến môi trường hệ thống');
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

console.log('🔧 Đang load các module bot system...');
const { setupWelcome } = require('./botsystem/welcome.js');
console.log('   ✅ Loaded welcome.js');
const { setupMessageHandler, setupInteraction: setupMuteInteraction, minesweeperState, saveState, loadState } = require('./botsystem/minesweeper.js');
console.log('   ✅ Loaded minesweeper.js');
const { setupPingReply } = require('./botsystem/ping-reply.js');
console.log('   ✅ Loaded ping-reply.js');
const { setupInteraction: setupTextInteraction } = require('./botsystem/text.js');
console.log('   ✅ Loaded text.js');
const { setupInteraction: setupVoiceInteraction } = require('./botsystem/voice-chat.js');
console.log('   ✅ Loaded voice-chat.js');
const { setupInteraction: setupUserinfoInteraction } = require('./botsystem/avatar-check.js');
console.log('   ✅ Loaded avatar-check.js');
const { setupInteraction: setupUserCheckInteraction } = require('./botsystem/user-check.js');
console.log('   ✅ Loaded user-check.js');
const { setupInteraction: setupPingInteraction } = require('./botsystem/ping.js');
console.log('   ✅ Loaded ping.js');
console.log('✅ Đã load xong tất cả module');

const token = process.env.TOKEN || process.env.DISCORD_TOKEN || '';

console.log('🔧 Token Discord:', token ? '✅ Đã tìm thấy' : '❌ Không tìm thấy');

// ==========================================
//  WEB SERVER (Giữ Render luôn sống)
// ==========================================
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running 24/7!');
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`🌐 Web server đang chạy trên port ${port}!`);
});

// ==========================================
//  DISCORD CLIENT
// ==========================================
console.log('🔧 Đang khởi tạo Discord Client...');
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
console.log('✅ Discord Client đã khởi tạo');

// ==========================================
//  SLASH COMMANDS REGISTRATION
// ==========================================
async function registerSlashCommands() {
    console.log('🔧 Đang đăng ký slash commands...');
    if (!client.application?.id) {
        console.log('⚠️ Không tìm thấy application ID, bỏ qua đăng ký commands');
        return;
    }

    const rest = new REST({ version: '10' }).setToken(token);

    try {
        const targetGuildId = COMMAND_GUILD_ID || '';
        const route = targetGuildId
            ? Routes.applicationGuildCommands(client.application.id, targetGuildId)
            : Routes.applicationCommands(client.application.id);

        console.log(`📝 Đang đăng ký ${slashCommands.length} slash commands...`);
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
    console.log('🤖 ================================================');
    console.log(`🤖 Bot online: ${client.user.tag}`);
    console.log(`🤖 Bot ID: ${client.user.id}`);
    console.log(`🤖 Số server: ${client.guilds.cache.size}`);
    console.log(`🤖 Số user: ${client.users.cache.size}`);
    console.log('🤖 ================================================');
    console.log('🔧 Đang load trạng thái từ data.json...');
    loadState();
    console.log('🔧 Đang đăng ký slash commands...');
    await registerSlashCommands();
    console.log('✅ Bot đã sẵn sàng hoạt động!');
});

// ==========================================
//  SETUP EVENTS
// ==========================================
console.log('🔧 Đang setup event handlers...');
setupWelcome(client);
console.log('   ✅ Welcome event handler');
setupMessageHandler(client);
console.log('   ✅ Message handler');
setupPingReply(client);
console.log('   ✅ Ping reply handler');
setupTextInteraction(client);
console.log('   ✅ Text command handler');
setupVoiceInteraction(client);
console.log('   ✅ Voice command handler');
setupMuteInteraction(client, minesweeperState, saveState);
console.log('   ✅ Random mute handler');
setupUserinfoInteraction(client);
console.log('   ✅ Avatar check handler');
setupUserCheckInteraction(client);
console.log('   ✅ User check handler');
setupPingInteraction(client);
console.log('   ✅ Ping command handler');

// Log tất cả interactions
client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        console.log(`🎮 [Interaction] Command: /${interaction.commandName} từ ${interaction.user.tag} (${interaction.user.id})`);
    }
});

// Error handling
client.on('error', (error) => {
    console.error('❌ [Discord Error]:', error);
});

client.on('warn', (warning) => {
    console.warn('⚠️ [Discord Warning]:', warning);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ [Unhandled Rejection]:', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ [Uncaught Exception]:', error);
});

console.log('✅ Đã setup xong tất cả event handlers');

// ==========================================
//  ĐĂNG NHẬP
// ==========================================
console.log('🔧 Đang kết nối đến Discord...');
console.log('🚀 ================================================');
console.log('🚀 KHỞI ĐỘNG DISCORD BOT 24/7');
console.log('🚀 ================================================');
if (!token) {
    console.error('❌ TOKEN chưa được cấu hình. Hãy thiết lập biến môi trường TOKEN hoặc thêm vào file .env.');
    process.exit(1);
}

client.login(token).catch((error) => {
    console.error('❌ Lỗi đăng nhập Discord:', error);
    process.exit(1);
});
