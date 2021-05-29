const Discord = require('discord.js');

async function confirmTransfer(message, amount){
    const filter = m => m.author.id === message.author.id;
    const options = {
        max: 1,
        time: 300000
    };
    var timedOut = false;
    var confirm;

    var confirmEmbed = new Discord.MessageEmbed()
        .setTitle('Confirm Transfer')
        .setColor('#00FFFF')
        .addFields(
            {name: `From user: `, value: `${message.author.username}`},
            {name: `To user: `, value: `${message.mentions.members.first().displayName}`},
            {name: `Amount: `, value: `${amount}`},
            {name: `Confirm transfer?`, value: `Please type either:\nyes\nno`}
        );
        message.reply(confirmEmbed);
        await message.channel.awaitMessages(filter, options).then((collected)=>{confirm = collected.first().content}).catch(collected => {message.reply(`time ran out. Please try again`); return timedOut = true;});
        if (timedOut) return false
        if (confirm.toLowerCase() == "no" || confirm.toLowerCase() == "n") {
            message.reply(`you cancelled this request.`);
            return false;
        }
        if(confirm.toLowerCase().localeCompare("yes") !== 0 && confirm.toLowerCase().localeCompare("y") !== 0) {
            message.reply(`you entered an invalid response, please try again.`);
            return false;
        }
        confirmEmbed.fields = [];
        confirmEmbed.setTitle("Please wait . . .");
        message.reply(confirmEmbed);
        return true;
}

//TODO: Add the rest of the embeds here

module.exports = { confirmTransfer }