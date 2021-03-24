module.exports = async function (client, count) {
    const guildID = process.env.GUILDID;

    async function updateCount () {
        if(count){
            client.user.setActivity(`New Beginnings#1${count} / 150 dinosaurs.`, { type: 'WATCHING' });
        }
    }

    const guild = client.guilds.cache.get(guildID);
    return await updateCount();
}
