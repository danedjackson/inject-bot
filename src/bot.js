//Loads environment variables from the .env file
require('dotenv').config();
// console.log(process.env.BOT_TOKEN);

//Importing from discord.js module
const { Client } = require('discord.js');

//Create an instance of client
const client = new Client();

client.login(process.env.BOT_TOKEN);