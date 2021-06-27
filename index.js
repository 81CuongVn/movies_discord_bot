const Discord = require('discord.js');
const client = new Discord.Client();
require('dotenv').config();
const mongoose = require('mongoose');

const { loadCommands } = require('./utils/loadCommands');
require('./utils/loadEvents')(client);

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
client.snipes = new Discord.Collection();

loadCommands(client);

mongoose.connect(process.env.MONGODB_SRV, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}).then(() => {
    console.log('Connected to the database!');
}).catch(err => {
    console.log(err);
});

client.login(process.env.BOT_TOKEN);
