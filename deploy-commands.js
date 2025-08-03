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

    // Delete existing guild commands
    const guildId = process.env.GUILD_ID;
    console.log(`Deleting existing application (/) commands for guild ${guildId}...`);
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
      { body: [] },
    );
    console.log(`Successfully deleted existing application (/) commands for guild ${guildId}.`);

    // Register new guild commands
    console.log(`Registering ${commands.length} application (/) commands for guild ${guildId}.`);
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
      { body: commands },
    );
    console.log(`Successfully registered application (/) commands for guild ${guildId}.`);

    // Delete existing global commands
    console.log('Deleting existing global application (/) commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: [] },
    );
    console.log('Successfully deleted existing global application (/) commands.');

    // Register new global commands
    console.log(`${commands.length}개의 전역 애플리케이션 (/) 명령어 등록 중.`);
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
        console.log('전역 애플리케이션 (/) 명령어 등록 완료.');

  } catch (error) {
    console.error(error);
  }
})();
