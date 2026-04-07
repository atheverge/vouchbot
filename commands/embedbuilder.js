const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  ChannelType
} = require('discord.js');

const sessions = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embedbuilder')
    .setDescription('Create an embed using a UI builder'),

  async execute(interaction) {
    const userId = interaction.user.id;

    sessions.set(userId, {
      title: 'Embed Title',
      description: 'Embed Description',
      color: 0x2f3136,
      image: null,
      thumbnail: null,
      fields: [],
      channelId: interaction.channel.id
    });

    const getEmbed = () => {
      const data = sessions.get(userId);

      const embed = new EmbedBuilder()
        .setTitle(data.title)
        .setDescription(data.description)
        .setColor(data.color);

      if (data.image) embed.setImage(data.image);
      if (data.thumbnail) embed.setThumbnail(data.thumbnail);
      if (data.fields.length) embed.addFields(data.fields);

      return embed;
    };

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('edit_title').setLabel('Title').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('edit_desc').setLabel('Description').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('edit_color').setLabel('Color').setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('add_field').setLabel('Add Field').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('remove_field').setLabel('Remove Field').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('clear_fields').setLabel('Clear Fields').setStyle(ButtonStyle.Danger)
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('set_image').setLabel('Set Image').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('remove_image').setLabel('Remove Image').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('set_thumbnail').setLabel('Thumbnail').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('remove_thumbnail').setLabel('Remove Thumb').setStyle(ButtonStyle.Danger)
    );

    const row4 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('select_channel').setLabel('Channel').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('send_embed').setLabel('Send').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('cancel_embed').setLabel('Cancel').setStyle(ButtonStyle.Danger)
    );

    const msg = await interaction.reply({
      content: '🛠️ **Embed Builder**',
      embeds: [getEmbed()],
      components: [row1, row2, row3, row4],
      fetchReply: true
    });

    const collector = msg.createMessageComponentCollector({ time: 300000 });

    collector.on('collect', async i => {
      if (i.user.id !== userId)
        return i.reply({ content: 'Not your session.', ephemeral: true });

      // ===== MODALS =====
      const simpleModal = (id, title, label) => {
        const modal = new ModalBuilder().setCustomId(id).setTitle(title);
        modal.addComponents(new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('input')
            .setLabel(label)
            .setStyle(TextInputStyle.Short)
        ));
        return modal;
      };

      if (i.customId === 'edit_title') return i.showModal(simpleModal('title_modal', 'Set Title', 'Title'));
      if (i.customId === 'edit_color') return i.showModal(simpleModal('color_modal', 'HEX Color', '#000000'));
      if (i.customId === 'set_image') return i.showModal(simpleModal('image_modal', 'Image URL', 'https://...'));
      if (i.customId === 'set_thumbnail') return i.showModal(simpleModal('thumb_modal', 'Thumbnail URL', 'https://...'));

      if (i.customId === 'edit_desc') {
        const modal = new ModalBuilder()
          .setCustomId('desc_modal')
          .setTitle('Description');

        modal.addComponents(new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('input')
            .setLabel('Description')
            .setStyle(TextInputStyle.Paragraph)
        ));

        return i.showModal(modal);
      }

      if (i.customId === 'add_field') {
        const modal = new ModalBuilder()
          .setCustomId('field_modal')
          .setTitle('Add Field');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('name').setLabel('Field Name').setStyle(TextInputStyle.Short)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('value').setLabel('Field Value').setStyle(TextInputStyle.Paragraph)
          )
        );

        return i.showModal(modal);
      }

      // ===== FIELD CONTROLS =====
      if (i.customId === 'remove_field') {
        const data = sessions.get(userId);
        data.fields.pop();
        sessions.set(userId, data);

        await i.update({ embeds: [getEmbed()] });
      }

      if (i.customId === 'clear_fields') {
        const data = sessions.get(userId);
        data.fields = [];
        sessions.set(userId, data);

        await i.update({ embeds: [getEmbed()] });
      }

      // ===== IMAGE CONTROLS =====
      if (i.customId === 'remove_image') {
        const data = sessions.get(userId);
        data.image = null;
        sessions.set(userId, data);

        await i.update({ embeds: [getEmbed()] });
      }

      if (i.customId === 'remove_thumbnail') {
        const data = sessions.get(userId);
        data.thumbnail = null;
        sessions.set(userId, data);

        await i.update({ embeds: [getEmbed()] });
      }

      // ===== CHANNEL SELECT =====
      if (i.customId === 'select_channel') {
        const channels = interaction.guild.channels.cache
          .filter(c => c.type === ChannelType.GuildText)
          .first(25);

        const menu = new StringSelectMenuBuilder()
          .setCustomId('channel_menu')
          .setPlaceholder('Select channel')
          .addOptions(channels.map(c => ({ label: c.name, value: c.id })));

        return i.reply({
          content: 'Choose a channel:',
          components: [new ActionRowBuilder().addComponents(menu)],
          ephemeral: true
        });
      }

      if (i.customId === 'channel_menu') {
        sessions.get(userId).channelId = i.values[0];
        return i.update({ content: 'Channel set!', components: [] });
      }

      // ===== SEND / CANCEL =====
      if (i.customId === 'send_embed') {
        const data = sessions.get(userId);
        const channel = interaction.guild.channels.cache.get(data.channelId);

        if (!channel)
          return i.reply({ content: 'Invalid channel.', ephemeral: true });

        await channel.send({ embeds: [getEmbed()] });

        await i.update({ content: '✅ Sent!', embeds: [], components: [] });
        sessions.delete(userId);
        collector.stop();
      }

      if (i.customId === 'cancel_embed') {
        await i.update({ content: '❌ Cancelled.', embeds: [], components: [] });
        sessions.delete(userId);
        collector.stop();
      }
    });

    interaction.client.on('interactionCreate', async modal => {
      if (!modal.isModalSubmit()) return;
      if (modal.user.id !== userId) return;

      const data = sessions.get(userId);
      if (!data) return;

      const value = modal.fields.getTextInputValue('input');

      if (modal.customId === 'title_modal') data.title = value;
      if (modal.customId === 'desc_modal') data.description = value;
      if (modal.customId === 'color_modal')
        data.color = parseInt(value.replace('#', ''), 16) || 0x2f3136;
      if (modal.customId === 'image_modal') data.image = value;
      if (modal.customId === 'thumb_modal') data.thumbnail = value;

      if (modal.customId === 'field_modal') {
        data.fields.push({
          name: modal.fields.getTextInputValue('name'),
          value: modal.fields.getTextInputValue('value'),
          inline: false
        });
      }

      sessions.set(userId, data);

      await modal.reply({ content: 'Updated!', ephemeral: true });

      try {
        await msg.edit({ embeds: [getEmbed()] });
      } catch {}
    });
  }
};