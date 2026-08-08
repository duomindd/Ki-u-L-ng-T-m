const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
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

function setupWelcome(client) {
    client.on('guildMemberAdd', async (member) => {
        if (member.guild.id !== process.env.MY_GUILD_ID) return;

        const channel = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
        if (!channel) {
            return console.warn('⚠️ Không tìm thấy kênh chào mừng. Kiểm tra lại WELCOME_CHANNEL_ID!');
        }

        const message = '<a:agahi:1534090120091930706> Chào iem **<@{userId}>** đã đến server của anh! Mấy thằng đệ của a đâu r ra đón bạn mới đê!!!  @everyone <:kieuluongtam:1521190088376324206>'.replace('{userId}', member.id);

        try {
            await channel.send(message);
        } catch (error) {
            console.error('❌ Lỗi gửi tin nhắn chào mừng:', error);
        }
    });
}

module.exports = {
    setupWelcome,
};
