const Discord = require('discord.js');
const axios = require('axios').default;
const serverModels = require('../models/serverSchema');
const ObjectId = require('mongodb').ObjectID;
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
    if (args.length == 0) return;

    if (serverData.movies.length == 0) {
        message.channel.send("No movies added yet.");
        return;
    }

    const query = args.join(' ');
    const queryURL = 'https://www.omdbapi.com/?apikey=' + process.env.OMDB_API_KEY + '&s=' + query;

    let response = null;

    try {
        response = await axios.get(queryURL);
    } catch (err) {
        console.log(err);
        message.channel.send('Sorry! Couldn\'t find anything!');
    }

    let moviesRes = [];

    for (const tempMovie of response.data.Search) {
        moviesRes.push(tempMovie.imdbID)
    }

    let matches = [];

    for (const tempMovie of serverData.movies) {
        if (moviesRes.includes(tempMovie.movieID)) {
            matches.push({
                imdbID: tempMovie.movieID,
                id: tempMovie._id,
                title: tempMovie.movieTitle
            });
        }
    }

    if (matches.length == 1) {
        const apiRequest = 'https://www.omdbapi.com/?apikey=' + process.env.OMDB_API_KEY + '&i=' + matches[0].imdbID;

        let movieData = undefined;

        try {
            movieData = await axios.get(apiRequest);
        } catch (err) {
            console.log(err);
        }

        movieData = new moviePage(movieData.data);

        const embed = new Discord.MessageEmbed()
            .setTitle(movieData.title)
            .setDescription(movieData.description)
            .setImage(movieData.image)
            .setAuthor(movieData.actors)
            .addField("Genre", movieData.genre, true)
            .addField("Runtime", movieData.runtime, true)
            .addField("Release", movieData.release, true)
            .addField("IMDB Rating", movieData.imdbRating, true)
            .addField("RT Rating", movieData.rtRating, true)
            .addField("Box Office", movieData.boxOffice, true);

        message.channel.send(embed).then(async msg => {
            try {
                await msg.react('✅');
                await msg.react('❌');

                const reactionFilter = (reaction, user) =>
                    (reaction.emoji.name === '✅' ||
                        reaction.emoji.name === '❌') &&
                    user.id === message.author.id;

                const collector = msg.createReactionCollector(reactionFilter, {
                    time: 60000
                });

                collector.on('collect', async (reaction, user) => {
                    if (reaction.emoji.name == '✅') {
                        try {
                            await serverModels.findOneAndUpdate(
                                {
                                    serverID: message.guild.id,
                                },
                                {
                                    $pull:
                                    {
                                        movies:
                                        {
                                            "_id": ObjectId(matches[0].id),
                                        },
                                    },
                                },
                            );
                        } catch (err) {
                            console.log(err);
                        }
                        message.channel.send(`Successfully removed ${matches[0].title} from viewed.`);

                        msg.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
                    } else if (reaction.emoji.name == '❌') {
                        msg.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
                    }
                });

                collector.on('end', _ => {
                    msg.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
                });
            } catch (err) {
                console.log(err);
            }
        });

        return;
    }



    const moviePages = [];
    const movie_ids = [];

    for (const tmp of matches) {
        const apiRequest = 'https://www.omdbapi.com/?apikey=' + process.env.OMDB_API_KEY + '&i=' + tmp.imdbID;

        try {
            const movieData = await axios.get(apiRequest);
            moviePages.push(new moviePage(movieData.data));
            movie_ids.push(tmp.id);
        } catch (err) {
            console.log(err);
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
            await msg.react('✅');
            await msg.react('➡️');

            const reactionFilter = (reaction, user) =>
                (reaction.emoji.name === '⬅️' ||
                    reaction.emoji.name === '✅' ||
                    reaction.emoji.name === '➡️') &&
                user.id === message.author.id;

            const collector = msg.createReactionCollector(reactionFilter, {
                time: 60000
            });

            collector.on('collect', async (reaction, user) => {
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
                } else if (reaction.emoji.name == '✅') {
                    try {
                        await serverModels.findOneAndUpdate(
                            {
                                serverID: message.guild.id,
                            },
                            {
                                $pull:
                                {
                                    movies:
                                    {
                                        "_id": ObjectId(movie_ids[page - 1].id),
                                    },
                                },
                            },
                        );
                    } catch (err) {
                        console.log(err);
                    }
                    message.channel.send(`Successfully removed ${matches[0].title} from viewed.`);

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
                        .addField("IMDB Ratnig", moviePages[page - 1].imdbRating, true)
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
    name: 'r',
    aliases: ['remove', 'd', 'delete']
}
