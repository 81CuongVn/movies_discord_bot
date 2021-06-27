const Discord = require('discord.js');
const axios = require('axios').default;
const serverModels = require('../models/serverSchema');
require('dotenv').config();

class moviePage {
    constructor(movie) {
        this.title = movie.Title,
            this.description = movie.Plot,
            this.image = (movie.Poster != 'N/A') ? movie.Poster : '',
            this.actors = movie.Actors,
            this.genre = movie.Genre,
            this.runtime = movie.Runtime,
            this.release = movie.Released,
            this.imdbRating = movie.imdbRating,
            this.rtRating = (movie.Ratings.find(el => el.Source == 'Rotten Tomatoes') != null) ?
                movie.Ratings.find(el => el.Source == 'Rotten Tomatoes').Value : 'N/A',
            this.boxOffice = movie.BoxOffice,
            this.imdbID = movie.imdbID
    };
}

module.exports.run = async (bot, message, args, serverData) => {
    const embed = new Discord.MessageEmbed()
        .setTitle('Help')
        .setDescription('The Command Prefix is ";"')
        .addField(';s', 'Search for a movie.')
        .addField(';a', 'Set movie as viewed.')
        .addField(';r', 'Remove a movie from viewed.')
        .addField(';v', 'List of viewed movies.')
        .addField(';h', 'Help :) it just opens this up.')
        .setColor('#0099ff')
        .setFooter('movies! help menu');

    message.channel.send(embed);
}

module.exports.config = {
    name: 'h',
    aliases: ['help']
}
