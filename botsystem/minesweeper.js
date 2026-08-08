const fs = require('fs');
const path = require('path');

const minesweeperState = new Map(); // guildId -> boolean
const DATA_FILE = path.join(__dirname, '../data.json');

function loadState() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            for (const [guildId, enabled] of Object.entries(data)) {
                minesweeperState.set(guildId, enabled);
            }
            console.log(`✅ Đã tải trạng thái mute random cho ${minesweeperState.size} server`);
        }
    } catch (error) {
        console.error('❌ Lỗi tải trạng thái:', error);
    }
}

function saveState() {
    try {
        const data = {};
        minesweeperState.forEach((value, key) => {
            data[key] = value;
        });
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('❌ Lỗi lưu trạng thái:', error);
    }
}

async function handleRandommute(interaction, minesweeperState, saveState) {
    const currentState = minesweeperState.get(interaction.guild.id) || false;
    const newState = !currentState;
    minesweeperState.set(interaction.guild.id, newState);
    saveState();

    const status = newState ? '✅ Đã BẬT' : '❌ Đã TẮT';
    return interaction.reply({ content: `${status} chế độ bắt cóc xuống tầng hầm trong server này!` });
}

function setupInteraction(client, minesweeperState, saveState) {
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (interaction.commandName === 'randommute') {
            await handleRandommute(interaction, minesweeperState, saveState);
        }
    });
}

function setupMessageHandler(client) {
    client.on('messageCreate', async (message) => {
        if (message.author.bot || !message.guild || !message.member) return;

        // Minigame Random Mute - Chỉ hoạt động khi được bật
        const isMinesweeperEnabled = minesweeperState.get(message.guild.id) || false;
        if (isMinesweeperEnabled) {
            const randomChance = Math.floor(Math.random() * 100) + 1;
            if (randomChance <= 1) {
                try {
                    const botMember = await message.guild.members.fetch(message.client.user.id);
                    const permissions = botMember.permissionsIn(message.channel);

                    if (!permissions.has('ModerateMembers')) {
                        await message.reply(`🎉 CHÚC MỪNG IEM <@${message.author.id}> ĐÃ BỊ BẮC CÓC (Bot thiếu quyền mute!)`);
                        return;
                    }

                    const muteDurationMs = 5 * 60 * 1000;
                    console.log(`🎉 ${message.author.tag} (${message.author.id}) đã bị mute 5 phút`);
                    await message.member.timeout(muteDurationMs, 'Bắt cóc xuống tầng hầm');
                    await message.reply(`🎉 CHÚC MỪNG IEM <@${message.author.id}> ĐÃ BỊ BẮC CÓC XUỐNG TẦNG HẦM NHÀ ANH, thôi ráng chịu ở dưới đấy 5 phút nhé 😛`);
                    return;
                } catch (error) {
                    if (error.code === 50013) {
                        const errorMessages = [
                            `🎉 CHÚC MỪNG IEM <@${message.author.id}> ĐÃ BỊ BẮC CÓC XUỐNG TẦNG HẦM NHÀ ANH ( m bel quá 🐷, a del đẩy m xuống đc 🤣 )`,
                            `🎉 CHÚC MỪNG IEM <@${message.author.id}> ĐÃ BỊ BẮC CÓC XUỐNG TẦNG HẦM NHÀ ANH ( m gầy quá 💀, anh vừa vứt m xuống dưới đã phải đưa mày đến bệnh viện rồi 🏥 )`,
                            `🎉 CHÚC MỪNG IEM <@${message.author.id}> ĐÃ BỊ BẮC CÓC XUỐNG TẦNG HẦM NHÀ ANH ( m gọi mẹ m vào nhà a lmj 😨, nó ăn hết cả tủ lạnh nhà a rồi, sao mà có thức ăn cho mấy thg ở dưới nữa 😭 )`,
                            `🎉 CHÚC MỪNG IEM <@${message.author.id}> ĐÃ BỊ BẮC CÓC XUỐNG TẦNG HẦM NHÀ ANH ( nhìn m cx "bén" đấy 😋, thôi nay a tha 😘 )`,
                            `🎉 CHÚC MỪNG IEM <@${message.author.id}> ĐÃ BỊ BẮC CÓC XUỐNG TẦNG HẦM NHÀ ANH ( thôi nay a ăn kiêng, k bắt m nx 😁 )`,
                        ];
                        const randomMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];
                        await message.reply(randomMessage);
                    } else {
                        console.error('❌ Lỗi mute người dùng:', error);
                    }
                }
            }
        }
    });
}

module.exports = {
    minesweeperState,
    loadState,
    saveState,
    handleRandommute,
    setupInteraction,
    setupMessageHandler,
};
