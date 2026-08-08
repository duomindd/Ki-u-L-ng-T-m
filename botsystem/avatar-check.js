const { EmbedBuilder } = require('discord.js');

async function handle(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    
    // Fetch user để lấy thông tin banner
    const fetchedUser = await targetUser.fetch();
    
    const avatarUrl = targetUser.displayAvatarURL({ size: 4096 });
    const bannerUrl = fetchedUser.bannerURL({ size: 4096 });

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`🖼️ Avatar & Banner: ${targetUser.tag}`)
        .setTimestamp();

    if (bannerUrl) {
        embed.setImage(bannerUrl);
        embed.setThumbnail(avatarUrl);
        embed.addFields({ name: '🖼️ Avatar', value: `[Xem avatar tại đây](${avatarUrl})`, inline: false });
        embed.addFields({ name: '🎨 Banner', value: `[Xem banner tại đây](${bannerUrl})`, inline: false });
    } else {
        embed.setImage(avatarUrl);
        embed.addFields({ name: '🖼️ Avatar', value: `[Xem avatar tại đây](${avatarUrl})`, inline: false });
        embed.addFields({ name: '🎨 Banner', value: 'Người dùng này không có banner', inline: false });
    }

    await interaction.reply({ embeds: [embed] });
}

function setupInteraction(client) {
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (interaction.commandName === 'avatar') {
            await handle(interaction);
        }
    });
}

module.exports = {
    handle,
    setupInteraction,
};