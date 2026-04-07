module.exports = {
  data: {
    name: 'ping'
  },

  async execute(interaction) {
    await interaction.reply('🏓 Pong from modular system!');
  }
};