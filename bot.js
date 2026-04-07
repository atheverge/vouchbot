const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} = require('discord.js');

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// 🔑 CONFIG
const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1490115338224926921';
const GUILD_ID = '1463256694816510115';
const CHANNEL_ID = '1486916243956174940';

// 🔒 ROLES
const STAFF_ROLE_NAME = 'Staff';
const MUTE_ROLE_NAME = 'Muted';
const LOG_CHANNEL_NAME = 'mod-logs';

// 🔹 CLIENT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Map();

// 🔹 SAFE COMMAND LOADER (FIXED)
const foldersPath = path.join(__dirname, 'commands');

if (fs.existsSync(foldersPath)) {
  let items;
try {
  items = fs.readdirSync(foldersPath);
} catch (err) {
  console.log("⚠️ Failed to read commands folder:", err);
  items = [];
}

  for (const item of items) {
    const itemPath = path.join(foldersPath, item);

    // ✅ CASE 1: Folder
   let stat;
try {
  stat = fs.lstatSync(itemPath);
} catch (err) {
  continue;
}

if (stat.isDirectory()) {
      const commandFiles = fs.readdirSync(itemPath).filter(file => file.endsWith('.js'));

      for (const file of commandFiles) {
        const filePath = path.join(itemPath, file);
        const command = require(filePath);

        client.commands.set(command.data.name, command);
      }
    }

    // ✅ CASE 2: Single JS file directly in /commands
    else if (item.endsWith('.js')) {
      const command = require(itemPath);

      if (command.data) {
        client.commands.set(command.data.name, command);
      }
    }
  }
} else {
  console.log("⚠️ No /commands folder found — skipping command loading.");
}
// 🔹 CONTROL
let autoEnabled = false;
let announceEnabled = false;
const acceptedUsers = new Set();

// 🔒 ROLE CHECK
function isStaff(member) {
  return member.roles.cache.some(r => r.name === STAFF_ROLE_NAME);
}

// 🔹 LOG SYSTEM
function sendLog(guild, title, description) {
  const logChannel = guild.channels.cache.find(c => c.name === LOG_CHANNEL_NAME);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`📜 ${title}`)
    .setDescription(description)
    .setTimestamp();

  logChannel.send({ embeds: [embed] });
}

// 🔹 AUTO ANNOUNCE
function autoAnnounce(channel) {
  if (!announceEnabled) return;

  const messages = [
    "🔥 Trusted Middleman Services Available!",
    "💸 Safe trades happening daily!",
    "✅ Use /tos before trading!",
    "📢 Staff are online and ready!"
  ];

  const msg = messages[Math.floor(Math.random() * messages.length)];

  channel.send(`📢 ${msg}`);

  setTimeout(() => autoAnnounce(channel), Math.floor(Math.random() * 10 + 5) * 60000);
}

// 🔹 FAKE ID
function generateFakeID() {
  return Array.from({ length: 18 }, () => Math.floor(Math.random() * 10)).join('');
}

// 🔹 AVATAR
function getRandomAvatar() {
  const type = Math.floor(Math.random() * 2);

  if (type === 0) {
    return `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 5)}.png`;
  } else {
    return `https://api.dicebear.com/7.x/anime/svg?seed=${Math.floor(Math.random() * 1000)}`;
  }
}

// 🔹 ITEMS
function getRandomItem() {
  const items = [
    "MMed Harvester + Corrupt set",
    "Traded Icebreaker set",
    "Completed MM2 Godly bundle trade",
    "Traded Neon Frost Dragon",
    "Completed Mega Shadow Dragon trade",
    "MMed Blade Ball limited sword",
    "Purchased Blade Ball spins bundle",
    "MMed Roblox account (Headless)",
    "Purchased Roblox account with Korblox"
  ];

  return items[Math.floor(Math.random() * items.length)];
}

// 🔹 MIDDLEMAN
function getRandomMiddleman(guild) {
  const role = guild.roles.cache.find(r => r.name === 'Middleman');
  if (!role || role.members.size === 0) return 'None';
  return role.members.random();
}

// 🔹 DELAY
function getRandomDelay() {
  return Math.floor(Math.random() * (20 - 10 + 1) + 10) * 60 * 1000;
}

// 🔹 AUTO SYSTEM
function sendAutoVouch(client) {
  if (!autoEnabled) return;

  const guild = client.guilds.cache.get(GUILD_ID);
  const channel = client.channels.cache.get(CHANNEL_ID);
  if (!guild || !channel) return;

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle('📢 New Vouch Log')
    .setDescription(`╰➤ <@${generateFakeID()}> completed a trade.`)
    .addFields(
      { name: '📦 Transaction', value: getRandomItem() },
      { name: '👥 Middleman', value: `${getRandomMiddleman(guild)}` }
    )
    .setThumbnail(getRandomAvatar())
    .setFooter({ text: 'Timeless mm • Trusted Vouch System' })
    .setTimestamp();

  channel.send({ embeds: [embed] });

  setTimeout(() => sendAutoVouch(client), getRandomDelay());
}

// 🔹 READY
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  const guild = client.guilds.cache.get(GUILD_ID);
  await guild.members.fetch();
await registerCommands();
});
// 🔌 AUTO REGISTER SLASH COMMANDS (SAFE ADD)
async function registerCommands() {
  const commands = [];

  const basePath = path.join(__dirname, 'commands');

  if (!fs.existsSync(basePath)) return;

  const items = fs.readdirSync(basePath);

  for (const item of items) {
    const itemPath = path.join(basePath, item);

    let stat;
    try {
      stat = fs.lstatSync(itemPath);
    } catch (err) {
      continue; // skip anything unreadable
    }

    // ✅ Folder
    if (stat.isDirectory()) {
      const files = fs.readdirSync(itemPath).filter(file => file.endsWith('.js'));

      for (const file of files) {
        const commandPath = path.join(itemPath, file);

        try {
          const command = require(commandPath);
          if (command.data && command.data.toJSON) {
            commands.push(command.data.toJSON());
          }
        } catch (err) {
          console.log(`⚠️ Failed to load command: ${commandPath}`);
        }
      }
    }

    // ✅ Single JS file
    else if (item.endsWith('.js')) {
      try {
        const command = require(itemPath);
        if (command.data && command.data.toJSON) {
          commands.push(command.data.toJSON());
        }
      } catch (err) {
        console.log(`⚠️ Failed to load command: ${itemPath}`);
      }
    }
  }

  const rest = new REST({ version: '10' }).setToken(TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log('✅ Auto-registered slash commands');
}
  const commands = [];

  const basePath = path.join(__dirname, 'commands');

  if (!fs.existsSync(basePath)) return;

  const folders = fs.readdirSync(basePath);

  for (const folder of folders) {
    const folderPath = path.join(basePath, folder);
    const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

    for (const file of files) {
      const command = require(path.join(folderPath, file));
      if (command.data && command.data.toJSON) {
        commands.push(command.data.toJSON());
      }
    }
  }

  const rest = new REST({ version: '10' }).setToken(TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log('✅ Auto-registered slash commands');
}
// 🔹 SLASH COMMANDS
const commands = [
  new SlashCommandBuilder().setName('vouch').setDescription('Generate vouch'),

  new SlashCommandBuilder()
    .setName('auto')
    .setDescription('Control auto vouch system')
    .addStringOption(option =>
      option.setName('action')
        .setDescription('start or stop')
        .setRequired(true)
        .addChoices(
          { name: 'start', value: 'start' },
          { name: 'stop', value: 'stop' }
        )
    ),

  new SlashCommandBuilder().setName('tos').setDescription('View TOS')
];

// 🔹 INTERACTIONS (FIXED)
client.on('interactionCreate', async interaction => {

  if (interaction.isButton()) {
    if (interaction.customId === 'accept') {
      acceptedUsers.add(interaction.user.id);
      return interaction.reply({ content: '✅ TOS accepted.', ephemeral: true });
    }

    if (interaction.customId === 'decline') {
      return interaction.reply({ content: '❌ You must accept TOS.', ephemeral: true });
    }
  }

  if (!interaction.isChatInputCommand()) return;
// 🔌 COMMAND HANDLER EXECUTION (SAFE ADD)
const command = client.commands.get(interaction.commandName);
if (command && command.execute) {
  try {
    return await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    return interaction.reply({ content: '❌ Command error.', ephemeral: true });
  }
}
  if (!isStaff(interaction.member)) {
    return interaction.reply({ content: '❌ No permission.', ephemeral: true });
  }

  if (!acceptedUsers.has(interaction.user.id) && interaction.commandName !== 'tos') {
    return interaction.reply({ content: '❌ Accept TOS using /tos', ephemeral: true });
  }

  if (interaction.commandName === 'tos') {
    const embed = new EmbedBuilder()
      .setColor(0xff9900)
      .setTitle('📜 Timeless MM • Terms of Service')
      .setDescription(
        '**1. All trades are at your own risk**\n' +
        '**2. No responsibility for scams**\n' +
        '**3. Follow instructions**\n' +
        '**4. No mid-trade changes**\n' +
        '**5. Using service = agreement**'
      )
      .setFooter({ text: 'Timeless mm • Trusted Vouch System' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('accept').setLabel('Accept').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('decline').setLabel('Decline').setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({ embeds: [embed], components: [row] });
  }

  if (interaction.commandName === 'vouch') {
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('📢 New Vouch Log')
      .setDescription(`╰➤ <@${generateFakeID()}> completed a trade.`)
      .addFields(
        { name: '📦 Transaction', value: getRandomItem() },
        { name: '👥 Middleman', value: `${getRandomMiddleman(interaction.guild)}` }
      )
      .setThumbnail(getRandomAvatar())
      .setFooter({ text: 'Timeless mm • Trusted Vouch System' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === 'auto') {
    const action = interaction.options.getString('action');

    if (action === 'start') {
      if (autoEnabled) return interaction.reply({ content: 'Already running', ephemeral: true });
      autoEnabled = true;
      sendAutoVouch(client);
      return interaction.reply('✅ Auto started');
    }

    if (action === 'stop') {
      autoEnabled = false;
      return interaction.reply('🛑 Auto stopped');
    }
  }
});

// 🔹 MESSAGE COMMANDS (UNCHANGED)
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!isStaff(message.member)) return;

  const args = message.content.split(' ');
  const cmd = args[0].toLowerCase();

  if (cmd === '.hb') {
    let userId = message.mentions.users.first()?.id || args[1];
    if (!userId) return message.reply('❌ Provide a user mention or ID');

    const bans = await message.guild.bans.fetch();

    if (bans.has(userId)) {
      await message.guild.members.unban(userId);
      message.reply(`🔓 Unbanned <@${userId}>`);
      sendLog(message.guild, "Unban", `<@${userId}> unbanned by ${message.author}`);
    } else {
      await message.guild.members.ban(userId, {
        reason: `Hard banned by ${message.author.tag}`
      });
      message.reply(`🔨 Banned <@${userId}>`);
      sendLog(message.guild, "Hard Ban", `<@${userId}> banned by ${message.author}`);
    }
  }

  if (cmd === '.mute') {
    const member = message.mentions.members.first();
    const role = message.guild.roles.cache.find(r => r.name === MUTE_ROLE_NAME);
    if (!member || !role) return;

    await member.roles.add(role);
    message.reply('Muted.');
    sendLog(message.guild, "Mute", `${member} muted by ${message.author}`);
  }

  if (cmd === '.unmute') {
    const member = message.mentions.members.first();
    const role = message.guild.roles.cache.find(r => r.name === MUTE_ROLE_NAME);
    if (!member || !role) return;

    await member.roles.remove(role);
    message.reply('Unmuted.');
    sendLog(message.guild, "Unmute", `${member} unmuted by ${message.author}`);
  }

  if (cmd === '.lock') {
    await message.channel.permissionOverwrites.edit(
      message.guild.roles.everyone,
      { SendMessages: false }
    );
    message.reply('🔒 Locked.');
    sendLog(message.guild, "Lock", `${message.channel} locked by ${message.author}`);
  }

  if (cmd === '.unlock') {
    await message.channel.permissionOverwrites.edit(
      message.guild.roles.everyone,
      { SendMessages: true }
    );
    message.reply('🔓 Unlocked.');
    sendLog(message.guild, "Unlock", `${message.channel} unlocked by ${message.author}`);
  }

  if (cmd === '.purge') {
    const amount = parseInt(args[1]);
    if (!amount || amount > 100) return message.reply('❌ Max 100');

    await message.channel.bulkDelete(amount, true);
    message.channel.send(`🧹 Deleted ${amount}`).then(m => setTimeout(() => m.delete(), 3000));

    sendLog(message.guild, "Purge", `${amount} messages deleted by ${message.author}`);
  }

  if (cmd === '.embed') {
    const text = args.slice(1).join(' ');
    if (!text) return message.reply('❌ Provide text');

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setDescription(text)
      .setFooter({ text: `Sent by ${message.author.tag}` });

    message.channel.send({ embeds: [embed] });
  }

  if (cmd === '.announce') {
    if (args[1] === 'start') {
      announceEnabled = true;
      autoAnnounce(message.channel);
      return message.reply('📢 Auto announce started');
    }

    if (args[1] === 'stop') {
      announceEnabled = false;
      return message.reply('🛑 Auto announce stopped');
    }
  }

  if (cmd === '.help') {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🤖 Server Control Panel')
      .setDescription('**Full command list for your bot**')
      .addFields(
        { name: '🔨 Moderation', value: '.hb .mute .unmute .purge' },
        { name: '🔒 Channel', value: '.lock .unlock' },
        { name: '📢 Systems', value: '.announce start/stop' },
        { name: '🧱 Utility', value: '.embed <text>' },
        { name: '📜 Logs', value: 'All actions logged in mod-logs' }
      )
      .setFooter({ text: 'Timeless MM • Control System' });

    message.channel.send({ embeds: [embed] });
  }
});
// 🔁 STATUS ROTATION SYSTEM (ADDED — DOES NOT MODIFY ANY EXISTING CODE)
const statuses = [
  "💸 MMing trades",
  "🎫 Handling tickets",
  "✅ Trusted middleman",
  "🔥 Active trades daily",
  "🛡️ Secure & safe trading",
  "💎 Premium MM Service",
  "⚡ Fast & Trusted Deals",
  "🔒 Safe Trading Only",
  "🚀 Growing Daily",
  "👑 Trusted by the community"
];

// 🔁 EXTRA READY LISTENER FOR STATUS
client.on('ready', () => {
  setInterval(() => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    client.user.setPresence({
      activities: [{ name: status, type: 3 }], // Watching
      status: 'online'
    });

  }, 10000);
});
client.login(TOKEN);