module.exports = function (client, count) {
    const guildID = process.env.GUILDID;

    var updateCount = guild => {
        client.user.setActivity(`${count} / 150 players.`, { type: 'WATCHING' });
    }

    const guild = client.guilds.cache.get(guildID);
    updateCount(guild);
}
