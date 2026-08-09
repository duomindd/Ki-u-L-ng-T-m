const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');

const voiceState = new Map();

function cleanupConnection(guildId) {
    const state = voiceState.get(guildId);
    if (!state?.connection) return;

    state.connection.removeAllListeners();
    state.connection.destroy();
    voiceState.delete(guildId);
}

function joinAndStay(voiceChannel) {
    const guildId = voiceChannel.guild.id;

    if (voiceState.has(guildId)) {
        cleanupConnection(guildId);
    }

    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    voiceState.set(guildId, {
        connection,
        channel: voiceChannel,
        reconnectAttempts: 0,
    });

    connection.on(VoiceConnectionStatus.Ready, () => {
        const state = voiceState.get(guildId);
        if (state) state.reconnectAttempts = 0;
        console.log(`✅ Voice connected: ${voiceChannel.name} (${voiceChannel.guild.name})`);
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        const state = voiceState.get(guildId);
        if (!state) return;

        console.log(`⚠️ Mất kết nối tại ${voiceChannel.name}, đang thử reconnect...`);

        try {
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
            ]);
            console.log('🔄 Discord đang tự reconnect...');
        } catch {
            if (state.reconnectAttempts >= 5) {
                console.error(`❌ Đã thử 5 lần, bỏ cuộc.`);
                cleanupConnection(guildId);
                return;
            }

            state.reconnectAttempts += 1;
            console.log(`🔁 Thử rejoin lần ${state.reconnectAttempts}/5...`);
            cleanupConnection(guildId);

            setTimeout(() => {
                const channel = state.channel;
                const freshChannel = channel.guild.channels.cache.get(channel.id);
                if (freshChannel) {
                    joinAndStay(freshChannel);
                } else {
                    console.error('❌ Kênh voice không còn tồn tại.');
                    voiceState.delete(guildId);
                }
            }, 3000);
        }
    });

    return connection;
}

async function handleJoin(interaction) {
    console.log(`🎤 [Voice] Lệnh /join từ ${interaction.user.tag}`);
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
        console.log(`   ⚠️ [Voice] User không ở trong voice channel`);
        return interaction.reply({ content: '❌ Bạn phải vào một kênh voice chat trước!', ephemeral: true });
    }

    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!permissions?.has('Connect') || !permissions?.has('Speak')) {
        console.log(`   ⚠️ [Voice] Bot thiếu quyền Connect hoặc Speak`);
        return interaction.reply({ content: '❌ Bot thiếu quyền Connect hoặc Speak trong kênh này!', ephemeral: true });
    }

    try {
        console.log(`   ✅ [Voice] Đang join vào kênh ${voiceChannel.name} (${voiceChannel.id})`);
        joinAndStay(voiceChannel);
        return interaction.reply({ content: `✅ Đã kết nối và treo máy tại kênh: **${voiceChannel.name}**!` });
    } catch (error) {
        console.error('❌ Lỗi join voice:', error);
        return interaction.reply({ content: '❌ Có lỗi xảy ra khi vào kênh voice.', ephemeral: true });
    }
}

async function handleLeave(interaction, voiceState, cleanupConnection) {
    console.log(`🎤 [Voice] Lệnh /leave từ ${interaction.user.tag}`);
    const state = voiceState.get(interaction.guild.id);
    if (!state) {
        console.log(`   ⚠️ [Voice] Bot không ở trong voice channel nào`);
        return interaction.reply({ content: '❌ Bot hiện không ở trong kênh voice nào!', ephemeral: true });
    }

    console.log(`   ✅ [Voice] Đang rời voice channel`);
    cleanupConnection(interaction.guild.id);
    return interaction.reply({ content: '👋 Đã rời kênh voice!' });
}

function setupInteraction(client) {
    console.log('   🔧 [Voice] Setup voice command handler');
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        switch (interaction.commandName) {
            case 'join':
                await handleJoin(interaction);
                break;
            case 'leave':
                await handleLeave(interaction, voiceState, cleanupConnection);
                break;
        }
    });
}

module.exports = {
    voiceState,
    cleanupConnection,
    joinAndStay,
    handleJoin,
    handleLeave,
    setupInteraction,
};
