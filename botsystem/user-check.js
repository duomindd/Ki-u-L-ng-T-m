const { EmbedBuilder } = require('discord.js');

const STATUS_LABELS = {
    online: '🟢 Online',
    idle: '🌙 Idle',
    dnd: '⛔ Do Not Disturb',
    offline: '⚫ Offline',
};

// Map tên flag của discord.js sang nhãn tiếng Việt dễ đọc
const BADGE_LABELS = {
    Staff: '👨‍💼 Discord Staff',
    Partner: '🤝 Discord Partner',
    Hypesquad: '🎉 HypeSquad Events',
    BugHunterLevel1: '🐛 Bug Hunter',
    BugHunterLevel2: '🐛 Bug Hunter (Gold)',
    HypeSquadOnlineHouse1: '🏠 HypeSquad Bravery',
    HypeSquadOnlineHouse2: '🏠 HypeSquad Brilliance',
    HypeSquadOnlineHouse3: '🏠 HypeSquad Balance',
    PremiumEarlySupporter: '🌟 Early Supporter',
    VerifiedDeveloper: '👨‍💻 Verified Bot Developer',
    CertifiedModerator: '🛡️ Certified Moderator',
    ActiveDeveloper: '⚙️ Active Developer',
};

function formatDate(date) {
    if (!date) return 'Không rõ';
    return `<t:${Math.floor(date.getTime() / 1000)}:F> (<t:${Math.floor(date.getTime() / 1000)}:R>)`;
}

async function getBadges(targetUser) {
    let flags = targetUser.flags;
    if (!flags) {
        try {
            flags = await targetUser.fetchFlags();
        } catch {
            flags = null;
        }
    }
    if (!flags) return [];

    return flags.toArray().map((flag) => BADGE_LABELS[flag] || flag);
}

async function handle(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;

    let member = null;
    try {
        member = await interaction.guild.members.fetch(targetUser.id);
    } catch {
        member = null;
    }

    const badges = await getBadges(targetUser);

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`👤 Thông tin: ${targetUser.tag}`)
        .addFields(
            { name: '🆔 ID', value: targetUser.id, inline: true },
            { name: '🤖 Là bot?', value: targetUser.bot ? 'Có' : 'Không', inline: true },
            { name: '📅 Ngày tạo tài khoản', value: formatDate(targetUser.createdAt), inline: false }
        )
        .setTimestamp();

    if (member) {
        const status = member.presence?.status;
        embed.addFields(
            { name: '📥 Ngày join server', value: formatDate(member.joinedAt), inline: false },
            { name: '📶 Trạng thái', value: STATUS_LABELS[status] || '⚫ Offline / Không xác định', inline: true },
            {
                name: `🏅 Badge (${badges.length})`,
                value: badges.length ? badges.join('\n') : 'Không có badge nào',
                inline: true,
            }
        );

        const roles = member.roles.cache
            .filter((role) => role.id !== interaction.guild.id)
            .sort((a, b) => b.position - a.position)
            .map((role) => `<@&${role.id}>`);

        embed.addFields({
            name: `🎭 Roles (${roles.length})`,
            value: roles.length ? roles.join(', ').slice(0, 1024) : 'Không có role nào',
            inline: false,
        });
    } else {
        embed.addFields(
            {
                name: `🏅 Badge (${badges.length})`,
                value: badges.length ? badges.join('\n') : 'Không có badge nào',
                inline: false,
            },
            {
                name: '⚠️ Lưu ý',
                value: 'Người dùng này không còn ở trong server, chỉ hiển thị được thông tin cơ bản.',
                inline: false,
            }
        );
    }

    await interaction.reply({ embeds: [embed] });
}

function setupInteraction(client) {
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (interaction.commandName === 'user') {
            await handle(interaction);
        }
    });
}

module.exports = {
    handle,
    setupInteraction,
};