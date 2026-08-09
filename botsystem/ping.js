const { EmbedBuilder, version: djsVersion } = require('discord.js');
const os = require('os');

const WS_STATUS_LABELS = {
    0: '🟢 Sẵn sàng (Ready)',
    1: '🟡 Đang kết nối...',
    2: '🔄 Đang kết nối lại...',
    3: '💤 Rảnh (Idle)',
    4: '🟡 Gần sẵn sàng',
    5: '🔴 Mất kết nối',
    6: '⏳ Đang chờ dữ liệu server',
    7: '🟡 Đang xác thực',
    8: '🔄 Đang khôi phục phiên',
};

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days) parts.push(`${days} ngày`);
    if (hours) parts.push(`${hours} giờ`);
    if (minutes) parts.push(`${minutes} phút`);
    parts.push(`${seconds} giây`);

    return parts.join(' ');
}

function formatBytes(bytes) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatGB(bytes) {
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatWsLatency(ping) {
    if (ping < 0) return '`Đang cập nhật...`';
    return `\`${ping} ms\``;
}

async function getSlashCommandCount(client) {
    try {
        const commands = await client.application.commands.fetch();
        return commands.size;
    } catch {
        return client.application?.commands?.cache?.size ?? 0;
    }
}

// Đo độ trễ vòng lặp sự kiện (event loop lag) - phản ánh mức bot có đang bị "nghẽn" hay không
function measureEventLoopLag() {
    return new Promise((resolve) => {
        const start = process.hrtime.bigint();
        setImmediate(() => {
            const end = process.hrtime.bigint();
            resolve(Number(end - start) / 1_000_000); // ra ms
        });
    });
}

async function handle(interaction) {
    console.log(`🏓 [Ping] Lệnh /ping từ ${interaction.user.tag}`);
    const t0 = Date.now();
    const sent = await interaction.reply({ content: '🏓 Đang đo tất cả chỉ số...', withResponse: true });
    const t1 = Date.now();

    const client = interaction.client;

    // ===== Các loại độ trễ =====
    const commandLatency = sent.resource.message.createdTimestamp - interaction.createdTimestamp;
    const interactionLatency = t1 - t0;
    const wsLatency = client.ws.ping;

    const apiRequestStart = Date.now();
    await client.channels.fetch(interaction.channelId).catch(() => null);
    const apiLatency = Date.now() - apiRequestStart;

    const eventLoopLag = await measureEventLoopLag();

    // ===== Thông tin hệ thống / process =====
    const mem = process.memoryUsage();
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    const cpuUsage = process.cpuUsage();

    // ===== Thông tin bot =====
    const slashCommandCount = await getSlashCommandCount(client);
    const wsStatusLabel = WS_STATUS_LABELS[client.ws.status] ?? `❓ Không xác định (${client.ws.status})`;

    const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🏓 Pong! — Thông tin bot')
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
            // Độ trễ
            { name: '📡 Độ trễ Websocket', value: formatWsLatency(wsLatency), inline: true },
            { name: '⌨️ Độ trễ Lệnh', value: `\`${commandLatency} ms\``, inline: true },
            { name: '🔁 Độ trễ Tương tác', value: `\`${interactionLatency} ms\``, inline: true },
            { name: '🌐 Độ trễ API (REST)', value: `\`${apiLatency} ms\``, inline: true },
            { name: '🧠 Độ trễ Event Loop', value: `\`${eventLoopLag.toFixed(1)} ms\``, inline: true },
            { name: '🧩 Shard hiện tại', value: `\`#${client.ws.shards?.first()?.id ?? 0}\``, inline: true },
            { name: '📶 Trạng thái kết nối', value: `\`${wsStatusLabel}\``, inline: true },

            // Bot
            { name: '⏱️ Thời gian hoạt động', value: `\`${formatDuration(client.uptime)}\``, inline: true },
            { name: '⚡ Số slash command', value: `\`${slashCommandCount}\``, inline: true },
            { name: '🤖 Tên bot', value: `\`${client.user.tag}\``, inline: true },

            // Process / máy chủ
            { name: '💾 RAM tiến trình (RSS)', value: `\`${formatBytes(mem.rss)}\``, inline: true },
            { name: '📦 Heap Used / Total', value: `\`${formatBytes(mem.heapUsed)} / ${formatBytes(mem.heapTotal)}\``, inline: true },
            { name: '📉 External / ArrayBuffers', value: `\`${formatBytes(mem.external)} / ${formatBytes(mem.arrayBuffers)}\``, inline: true },
            { name: '🖴 RAM hệ thống (Free/Total)', value: `\`${formatGB(os.freemem())} / ${formatGB(os.totalmem())}\``, inline: true },
            { name: '📊 CPU Load Avg (1/5/15p)', value: `\`${loadAvg.map((n) => n.toFixed(2)).join(' / ')} (${cpus.length} nhân)\``, inline: true },
            { name: '⚙️ CPU Time (User/System)', value: `\`${(cpuUsage.user / 1000).toFixed(0)}ms / ${(cpuUsage.system / 1000).toFixed(0)}ms\``, inline: true },
            { name: '🖥️ Hệ thống', value: `\`${process.platform} (${process.arch}) — ${os.hostname()}\``, inline: true },
            { name: '📚 Phiên bản', value: `\`Node ${process.version} • djs v${djsVersion}\``, inline: true }
        )
        .setFooter({ text: `🆔 Process ID: ${process.pid}` })
        .setTimestamp();

    await interaction.editReply({ content: null, embeds: [embed] });
}

function setupInteraction(client) {
    console.log('   🔧 [Ping] Setup ping command handler');
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (interaction.commandName === 'ping') {
            await handle(interaction);
        }
    });
}

module.exports = {
    handle,
    setupInteraction,
};