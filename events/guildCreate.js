const Discord = require('discord.js')
const serverModels = require('../models/serverSchema');

module.exports = async (bot, guild) => {
    try {
        serverData = await serverModels.findOne({ serverID: guild.id });
        if (!serverData) {
            let profile = await serverModels.create({
                serverID: guild.id,
                movies: []
            });
            profile.save();
        }
    } catch (err) {
        console.log(err);
    }
}