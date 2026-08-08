const { AttachmentBuilder } = require('discord.js');

function setupPingReply(client) {
    client.on('messageCreate', async (message) => {
        if (message.author.bot || !message.guild || !message.member) return;

        // Phản hồi khi bị ping hoặc reply tin nhắn của bot
        const isMentioned = message.mentions.has(client.user);
        let isReplyToBot = false;
        
        if (message.reference && message.reference.messageId) {
            try {
                const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
                isReplyToBot = referencedMessage.author.id === client.user.id;
            } catch (error) {
                // Không thể fetch tin nhắn được reply, bỏ qua
            }
        }
        
        // Check nếu là reply vào tin nhắn của bot hoặc ping trực tiếp
        if (client.user && (isMentioned || isReplyToBot) && !message.mentions.everyone) {
            try {
                const imagePath = __dirname + '/../klt.png';
                const attachment = new AttachmentBuilder(imagePath, { name: 'klt.png' });
                return await message.reply({
                    content: 'các iem gọi a lmj đấy <:kieuluongtam:1521190088376324206>',
                    files: [attachment],
                });
            } catch (error) {
                console.error(`❌ Lỗi gửi file klt.png:`, error);
                return message.reply(`❌ Không tìm thấy file \`klt.png\`!`);
            }
        }
    });
}

module.exports = {
    setupPingReply,
};
