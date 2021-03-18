//Loads environment variables from the .env file
require('dotenv').config();
// console.log(process.env.BOT_TOKEN);

//Importing from discord.js module
const Discord = require('discord.js');
const ftp = require('basic-ftp');
const fs = require('fs');
const axios = require('axios');
const express = require('express');
const updateCount = require('./server_pop.js');

const token = process.env.BOT_TOKEN;
const prefix = process.env.PREFIX;
const ftpLocation = process.env.FTPLOCATION;
const ftpPort = process.env.FTPPORT;
const ftpusername = process.env.FTPUSERNAME;
const ftppassword = process.env.FTPPASSWORD;
const dinoPrices = JSON.parse(fs.readFileSync("prices.json"));
const adultNames = JSON.parse(fs.readFileSync("names.json"));

var app = express();
var steamID;
var dinoName;
var cash;
var price;
var bank;
var serverCount;
var paymentMethod;


//Create an instance of client
const client = new Discord.Client();
const ftpClient = new ftp.Client();

//Keep Bot alive on Heruko
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Running on port ${ PORT }`);
});
app.get('/',(req,res) => {
    return res.send('Hello');
    });

client.on("ready", () => {
    console.log(`${client.user.tag} logged in.`)
    client.user.setActivity('with babu Dibbles.');
});

function serverCountLoop() {
    setTimeout(async function() {
        await getServerCount();
        await updateCount(client, serverCount);
        serverCountLoop();
    }, 5000);
}

serverCountLoop();

client.on("message", async message => {
    if (message.author.bot) return

    if (message.content.startsWith(prefix)) {
        // console.log(`${message.guild.id} | ${message.author.id} | ${message.author.tag}: ${message.content}`);
        //Assigning the bot command to respective variables using the spreader operator ...
        const [cmdName, ...args] = message.content
            .trim()
            .substring(prefix.length)
            .split(/ +/g);

        if (cmdName === 'grow'){
            if(args.length != 2) {
                return message.reply(
                    'please tell me your steam ID and the dino you are requesting with the format:\n' +
                    `${prefix}grow [your steam ID] [dinosaur on server to grow]`);
            }
            steamID = args[0];
            dinoName = args[1];
            if(dinoName.length < 3) {
                return message.reply(
                    `I do not know a dino by the name of ${dinoName}.`
                );
            }
            //waits for axios to finish its call to assign cash and bank values.
            await getUserAmount(message.guild.id, message.author.id);

            //Getting price of dinosaur from json object.
            for (var x = 0; x < dinoPrices.length; x++){
                if (dinoPrices[x].Dino.toLowerCase()
                                .indexOf(dinoName.toLowerCase()) !== -1){
                    price = parseInt(dinoPrices[x].Price);
                    break;
                }
            }
            if(bank > price) {
                //Start ftp chain call
                paymentMethod = "bank";
                await ftpDownload(message);
            } else if(cash >= price) {
                paymentMethod = "cash";
                await ftpDownload(message);
            } else if (cash <= price && bank < price) {
                return message.reply('you do not have enough points for this dino.');
            } else {
                return message.reply(`I'm having trouble growing that dino.`);
            }
        } else if (cmdName === 'buy'){
            await getDinoPrices(message);
        }
    }
});

//APIs
async function getServerCount() {
    return await axios.get("https://server-count.herokuapp.com/serv-count")
        .then(function (response){
            serverCount = response.data;
        })
        .catch(function (error) {
            console.log("Error fetching server count: " + error);
        })
        .then(function () {
        })
}

async function getUserAmount(guildID, userID) {
    return await axios.get(process.env.MONEY_BOT_URL + "/guilds/" + guildID + "/users/" + userID, {
            headers: {
                'Authorization': process.env.MONEY_BOT_AUTH
            }
        })
        .then(function (response) {
            // handle success
            bank = response.data.bank;
            cash = response.data.cash;
        })
        .catch(function (error) {
            // handle error
            console.log("Error: " + error.message);
        })
        .then(function () {
            // always executed
        }
    );
}

async function deductUserAmountCash(guildID, userID, price) {
    return await axios.patch(process.env.MONEY_BOT_URL + "/guilds/" + guildID + "/users/" + userID, 
    {
        cash: "-" + price,
        bank: "0"
    }, 
    {
        headers: {
            'Authorization': process.env.MONEY_BOT_AUTH
        }
    })
    .then(function (response) {
        // console.log(response.data);
    })
    .catch(function (error) {
        console.log("Error: " + error.message);
    })
    .then(function () {

    });
}
async function deductUserAmountBank(guildID, userID, price) {
    return await axios.patch(process.env.MONEY_BOT_URL + "/guilds/" + guildID + "/users/" + userID, 
    {
        cash: "0",
        bank: "-" + price
    }, 
    {
        headers: {
            'Authorization': process.env.MONEY_BOT_AUTH
        }
    })
    .then(function (response) {
        // console.log(response.data);
    })
    .catch(function (error) {
        console.log("Error: " + error.message);
    })
    .then(function () {

    });
}

//FTP Connections
async function ftpDownload(message) {
    console.log("Downloading file. . .");
    //ftpClient.ftp.verbose = true;
    ftpClient.ftp.ipFamily = 4;
    try {
        await ftpClient.access({
            host: ftpLocation,
            port: ftpPort,
            user: ftpusername,
            password: ftppassword
        });
        await ftpClient.downloadTo(steamID + ".json", "/23.227.165.234_14010/TheIsle/Saved/Databases/Sandbox/Players/"  + steamID + ".json");
    } catch(err){
        console.error("Error downloading file: " + err.message);
        return message.reply('something went wrong trying to grow your dino. Did you enter the correct steam ID?');
    }
    ftpClient.close();
    await editJson(message);
}

async function editJson(message) {
    let data = fs.readFileSync(steamID + ".json", "utf-8");
    var contents;
    try {
        contents = JSON.parse(data);
        //Spino check ;)
        if (contents.CharacterClass.toLowerCase().indexOf("spino") != -1 && contents.bGender == true) {
            deleteLocalFile();
            return message.reply(`Spinosaurus has to be male to receive a grow.`);
        }
        if (contents.CharacterClass.toLowerCase().indexOf(dinoName.toLowerCase()) != -1 
                || dinoName.toLowerCase().indexOf(contents.CharacterClass.toLowerCase()) != -1){
            if(dinoName.toLowerCase() === 'cera') dinoName = 'ceratosaurus';
            //Change the value of juvi to Adult from the list of adult names defined
            for(var i = 0; i < adultNames.length; i++) {
                if(adultNames[i].Dino.toLowerCase().indexOf(dinoName.toLowerCase()) != -1) {
                    contents.CharacterClass = adultNames[i].Name;
                }
            }
            contents.Growth = "1.0";
            contents.Hunger = "9999";
            contents.Thirst = "9999";
            contents.Stamina = "9999";
            contents.Health = "9999";
        } else {
            deleteLocalFile();
            return message.reply(`you do not have a '${dinoName}' on the server.\nMake sure you have already created a dino, safelogged and checked the spelling.`);
        }
    } catch (err) {
        console.error("Error editing local JSON: " + err);
        deleteLocalFile();
        return message.reply('something went wrong trying to grow your dino. Please try again later.');
    }
    fs.writeFileSync(steamID + ".json", JSON.stringify(contents));
    await ftpUpload(message);
}

async function ftpUpload(message) {
    console.log("Uploading file. . .");
    //ftpClient.ftp.verbose = true;
    ftpClient.ftp.ipFamily = 4;
    try {
        await ftpClient.access({
            host: ftpLocation,
            port: ftpPort,
            user: ftpusername,
            password: ftppassword
        });
        if(paymentMethod.indexOf("cash") != -1) {
            await deductUserAmountCash(message.guild.id, message.author.id, price);
        } 
        if(paymentMethod.indexOf("bank") != -1) {
            await deductUserAmountBank(message.guild.id, message.author.id, price);
        }
        await ftpClient.uploadFrom(steamID + ".json", "/23.227.165.234_14010/TheIsle/Saved/Databases/Sandbox/Players/" +steamID + ".json");
        message.reply('dino grown successfully.');
    } catch(err){
        console.error("Error uploading JSON file: " + err.message);
        return message.reply('something went wrong trying to grow your dino. Please try again later.');
    }
    deleteLocalFile();
    ftpClient.close();
}

async function deleteLocalFile() {
    console.log("Deleting local files . . .");
    fs.unlink("./" + steamID + ".json", (err) => {
        if (err) throw err;
    });
}

//Misc
async function getDinoPrices(message) {
    let file = fs.readFileSync('prices.json');
    var data = JSON.parse(file);
    var msg = "";

    for (var x = 0; x < data.length; x++){
        msg += data[x].Dino + ": $" + data[x].Price.toLocaleString() + "\n\n";
    }

    const embed = new Discord.MessageEmbed()
    .setTitle('To request a grow, use the command:\n~grow [YOUR  STEAM ID] [DINOSAUR TO GROW]')
    .setColor('#DAF7A6')
    .addFields(
        {name: "\n🦎__**DINOSAUR PRICES (Points)**__🦎\n\n",
        value: msg}
    )
    
    return message.reply(embed);
}
client.login(token);