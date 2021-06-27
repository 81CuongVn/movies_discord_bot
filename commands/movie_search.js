const Discord = require('discord.js');
const axios = require('axios').default;
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
            this.boxOffice = movie.BoxOffice
    };
}

module.exports.run = async (bot, message, args) => {
    const query = args.join(' ');
    const queryURL = 'https://www.omdbapi.com/?apikey=' + process.env.OMDB_API_KEY + '&s=' + query;

    let response = null;

    try {
        response = await axios.get(queryURL);
    } catch (err) {
        console.log(err);
        message.channel.send('Sorry! Couldn\'t find anything!');
    }

    const movieList = response.data.Search;
    const moviePages = [];

    for (const [idx, el] of movieList.entries()) {
        const apiRequest = 'https://www.omdbapi.com/?apikey=' + process.env.OMDB_API_KEY + '&i=' + el.imdbID;

        try {
            const movieData = await axios.get(apiRequest);
            moviePages.push(new moviePage(movieData.data));
        } catch (err) {
            console.log(err);
            message.channel.send('Sorry! Couldn\'t find anything!');
            return;
        }
    }

    let page = 1;
    const embed = new Discord.MessageEmbed()
        .setTitle(moviePages[0].title)
        .setDescription(moviePages[0].description)
        .setImage(moviePages[0].image)
        .setAuthor(moviePages[0].actors)
        .addField("Genre", moviePages[0].genre, true)
        .addField("Runtime", moviePages[0].runtime, true)
        .addField("Release", moviePages[0].release, true)
        .addField("IMDB Rating", moviePages[0].imdbRating, true)
        .addField("RT Rating", moviePages[0].rtRating, true)
        .addField("Box Office", moviePages[0].boxOffice, true)
        .setFooter(`Page ${page} of ${moviePages.length}`);

    message.channel.send(embed).then(async msg => {
        try {
            await msg.react('⬅️');
            await msg.react('❌');
            await msg.react('➡️');

            const reactionFilter = (reaction, user) =>
                (reaction.emoji.name === '⬅️' ||
                    reaction.emoji.name === '❌' ||
                    reaction.emoji.name === '➡️') &&
                user.id === message.author.id;

            const collector = msg.createReactionCollector(reactionFilter, {
                time: 60000
            });

            collector.on('collect', (reaction, user) => {
                if (reaction.emoji.name == '⬅️') {
                    msg.reactions.resolve('⬅️').users.remove(message.author.id);
                    if (page === 1) return;
                    --page;
                    embed.fields = [];

                    embed
                        .setTitle(moviePages[page - 1].title)
                        .setDescription(moviePages[page - 1].description)
                        .setImage(moviePages[page - 1].image)
                        .setAuthor(moviePages[page - 1].actors)
                        .addField("Genre", moviePages[page - 1].genre, true)
                        .addField("Runtime", moviePages[page - 1].runtime, true)
                        .addField("Release", moviePages[page - 1].release, true)
                        .addField("IMDB Rating", moviePages[page - 1].imdbRating, true)
                        .addField("RT Rating", moviePages[page - 1].rtRating, true)
                        .addField("Box Office", moviePages[page - 1].boxOffice, true)
                        .setFooter(`Page ${page} of ${moviePages.length}`);

                    msg.edit(embed);
                } else if (reaction.emoji.name == '❌') {
                    msg.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
                } else if (reaction.emoji.name == '➡️') {
                    msg.reactions.resolve('➡️').users.remove(message.author.id);
                    if (page === moviePages.length) return;
                    ++page;
                    embed.fields = [];

                    embed
                        .setTitle(moviePages[page - 1].title)
                        .setDescription(moviePages[page - 1].description)
                        .setImage(moviePages[page - 1].image)
                        .setAuthor(moviePages[page - 1].actors)
                        .addField("Genre", moviePages[page - 1].genre, true)
                        .addField("Runtime", moviePages[page - 1].runtime, true)
                        .addField("Release", moviePages[page - 1].release, true)
                        .addField("IMDB Rating", moviePages[page - 1].imdbRating, true)
                        .addField("RT Rating", moviePages[page - 1].rtRating, true)
                        .addField("Box Office", moviePages[page - 1].boxOffice, true)
                        .setFooter(`Page ${page} of ${moviePages.length}`);

                    msg.edit(embed);
                }
            });

            collector.on('end', _ => {
                msg.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
            });
        } catch (err) {
            console.log(err);
        }
    });
}

module.exports.config = {
    name: 's',
    aliases: ['search']
}
