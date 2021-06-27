const Discord = require('discord.js');
const axios = require('axios').default;
require('dotenv').config();

module.exports.run = async (bot, message, args, serverData) => {
    if (serverData.movies.length == 0) {
        message.channel.send("No movies added yet.");
        return;
    }

    let idx = 1;

    let descriptions = [];
    let currentDesc = '';

    for (const movie of serverData.movies) {
        const stringConcat =
            `**[${idx++}. ${movie.movieTitle}](https://www.imdb.com/title/${movie.movieID}/)** submitted by <@!${movie.addedBy}>, viewed on ${movie.dateAdded.toLocaleDateString('en-US')}\n\n`;

        if (currentDesc.length + stringConcat.length > 2048) {
            descriptions.push(currentDesc);
            currentDesc = '';
        }

        currentDesc += stringConcat;
    }

    if (currentDesc.length > 0) descriptions.push(currentDesc);


    if (descriptions.length == 1) {
        const embed = new Discord.MessageEmbed()
            .setTitle("Movies Viewed")
            .setDescription(descriptions[0]);
        message.channel.send(embed);
        return;
    }

    let page = 1;
    const embed = new Discord.MessageEmbed()
        .setTitle("Movies Viewed")
        .setDescription(descriptions[0])
        .setFooter(`Page ${page} of ${descriptions.length}`);

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

            collector.on('collect', async (reaction, user) => {
                if (reaction.emoji.name == '⬅️') {
                    msg.reactions.resolve('⬅️').users.remove(message.author.id);
                    if (page === 1) return;
                    --page;

                    embed
                        .setDescription(descriptions[page - 1])
                        .setFooter(`Page ${page} of ${descriptions.length}`);

                    msg.edit(embed);
                } else if (reaction.emoji.name == '❌') {
                    msg.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
                } else if (reaction.emoji.name == '➡️') {
                    msg.reactions.resolve('➡️').users.remove(message.author.id);
                    if (page === descriptions.length) return;
                    ++page;

                    embed
                        .setDescription(descriptions[page - 1])
                        .setFooter(`Page ${page} of ${descriptions.length}`);

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
    name: 'v',
    aliases: ['viewed', 'added']
}
