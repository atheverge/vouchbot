const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Advanced embed builder')

    .addStringOption(o => o.setName('title').setDescription('Embed title'))
    .addStringOption(o => o.setName('description').setDescription('Embed description'))
    .addStringOption(o => o.setName('color').setDescription('Hex color (#5865F2)'))

    .addStringOption(o => o.setName('footer').setDescription('Footer text'))
    .addStringOption(o => o.setName('author').setDescription('Author name'))

    .addStringOption(o => o.setName('image').setDescription('Image URL (supports GIF)'))
    .addStringOption(o => o.setName('thumbnail').setDescription('Thumbnail URL'))

    .addStringOption(o => o.setName('field1').setDescription('Field 1 (name | value)'))
    .addStringOption(o => o.setName('field2').setDescription('Field 2 (name | value)'))
    .addStringOption(o => o.setName('field3').setDescription('Field 3 (name | value)'))

    .addStringOption(o => o.setName('video').setDescription('Video URL (YouTube, etc)')),

  async execute(interaction) {

    const embed = new EmbedBuilder();

    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const color = interaction.options.getString('color');
    const footer = interaction.options.getString('footer');
    const author = interaction.options.getString('author');
    const image = interaction.options.getString('image');
    const thumbnail = interaction.options.getString('thumbnail');
    const video = interaction.options.getString('video');

    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    if (color) embed.setColor(color);
    if (footer) embed.setFooter({ text: footer });
    if (author) embed.setAuthor({ name: author });
    if (image) embed.setImage(image); // GIF SUPPORT
    if (thumbnail) embed.setThumbnail(thumbnail);

    // FIELDS
    const fields = ['field1', 'field2', 'field3'];

    fields.forEach(f => {
      const value = interaction.options.getString(f);
      if (value && value.includes('|')) {
        const [name, val] = value.split('|');
        embed.addFields({ name: name.trim(), value: val.trim(), inline: false });
      }
    });

    // SEND
    if (video) {
      // Discord auto-embeds video links
      await interaction.reply({ content: video, embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed] });
    }
  }
};