module.exports = async function (client, count) {
    const guildID = process.env.GUILDID;

    async function updateCount () {
        if(count){
            console.log(`Updating user count with value ... ${count}`);
            client.user.setActivity(`${count} / 150 players.`, { type: 'WATCHING' });
        }
    }

    const guild = client.guilds.cache.get(guildID);
    return await updateCount();
}
