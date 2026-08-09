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

async function handle(interaction) {
    console.log(`📝 [Text] Lệnh /text từ ${interaction.user.tag}`);
    if (interaction.user.id !== process.env.OWNER_ID) {
        console.log(`   ⚠️ [Text] User không có quyền sử dụng lệnh này`);
        return interaction.reply({ content: '⚠️ Chỉ người được phép mới có thể dùng lệnh này.', ephemeral: true });
    }

    const text = interaction.options.getString('noi-dung')?.trim();
    const messageId = interaction.options.getString('id-tin-nhan');
    const attachment = interaction.options.getAttachment('anh');

    if (!text && !attachment) {
        return interaction.reply({ content: '⚠️ Bạn cần nhập nội dung hoặc gửi ít nhất 1 ảnh.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
        const messageOptions = {};
        if (text) {
            messageOptions.content = text;
        }
        if (attachment) {
            messageOptions.files = [attachment];
        }

        if (messageId) {
            const targetMessage = await interaction.channel?.messages.fetch(messageId);
            if (targetMessage) {
                await targetMessage.reply(messageOptions);
            }
        } else {
            await interaction.channel?.send(messageOptions);
        }

        await interaction.editReply({ content: '✅ Đã gửi tin nhắn.' });
        setTimeout(() => interaction.deleteReply().catch(() => {}), 1000);
    } catch (error) {
        console.error('❌ Lỗi gửi tin nhắn từ slash command:', error);
        await interaction.editReply({ content: '❌ Không thể gửi tin nhắn lúc này.' });
        setTimeout(() => interaction.deleteReply().catch(() => {}), 1000);
    }
}

function setupInteraction(client) {
    console.log('   🔧 [Text] Setup text command handler');
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (interaction.commandName === 'text') {
            await handle(interaction);
        }
    });
}

module.exports = {
    handle,
    setupInteraction,
};
