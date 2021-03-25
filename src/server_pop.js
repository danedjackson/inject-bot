module.exports = async function (client, count) {
    const guildID = process.env.GUILDID;

    async function updateCount () {
        if(count){
            client.user.setActivity(`grows`, { type: 'WATCHING' });
        }
    }

    const guild = client.guilds.cache.get(guildID);
    return await updateCount();
}
