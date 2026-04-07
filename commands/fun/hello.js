// commands/fun/hello.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hello')
    .setDescription('Say hello'),

  async execute(interaction) {
    await interaction.reply('👋 Hello from auto system!');
  }
};