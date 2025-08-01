const fs = require('node:fs');
const path = require('node:path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  try {
    const command = require(filePath);
    commands.push(command.data.toJSON());
  } catch (error) {
    console.error(`명령어 로드 중 오류 발생: ${filePath}`, error);
  }
}

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // Use this for guild-specific commands (fast updates)
    const guildId = process.env.GUILD_ID;
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
      { body: commands },
    );
    console.log(`Successfully reloaded application (/) commands for guild ${guildId}.`);

    // Use this for global commands (can take up to 1 hour to update)
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    console.log('Successfully reloaded global application (/) commands.');

  } catch (error) {
    console.error(error);
  }
})();
