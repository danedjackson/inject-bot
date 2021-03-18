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
const { POINT_CONVERSION_COMPRESSED } = require('constants');

const token = process.env.BOT_TOKEN;
const prefix = process.env.PREFIX;
const ftpLocation = process.env.FTPLOCATION;
const ftpPort = process.env.FTPPORT;
const ftpusername = process.env.FTPUSERNAME;
const ftppassword = process.env.FTPPASSWORD;
const dinoPrices = JSON.parse(fs.readFileSync("prices.json"));
const adultNames = JSON.parse(fs.readFileSync("names.json"));
const injectDinoPrices = JSON.parse(fs.readFileSync("inject-prices.json"));
const injectDinoNames = JSON.parse(fs.readFileSync("inject-names.json"));

var app = express();
var steamID;
var dinoName;
var cash;
var price;
var bank;
var serverCount;
var paymentMethod;
var server;
var gender;


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
        if (cmdName === 'inject') {
            if(args.length != 4) {
                return message.reply(
                    'please tell me your steam ID and the dino you are requesting with the format:\n' +
                    `${prefix}inject [server(1/2)] [gender(m/f)] [dinosaur name to inject] [your steam ID]`);
            }
            server = args[0];
            gender = args[1];
            dinoName = args[2];
            steamID = args[3];
            if(dinoName.length < 3) {
                return message.reply(
                    `I do not know a dino by the name of ${dinoName}.`
                );
            }
            await getUserAmount(message.guild.id, message.author.id);
            price = null;

            for (var x = 0; x < injectDinoPrices.length; x++) {
                if(injectDinoPrices[x].Dino.toLowerCase()
                                .indexOf(dinoName.toLowerCase()) !== -1) {
                    price = parseInt(injectDinoPrices[x].Price);
                    break;
                }
            }
            
            if(!price) {
                return message.reply(`that dino cannot be injected.`);
            }
            if(bank > price) {
                paymentMethod = "bank";
                await ftpDownload(message, server, "inject");
            } else if(cash >= price) {
                paymentMethod = "cash";
                await ftpDownload(message, server, "inject");
            } else if (cash <= price && bank < price) {
                return message.reply('you do not have enough points for this dino.');
            } else {
                return message.reply(`I'm having trouble growing that dino.`);
            }
        }

        if (cmdName === 'grow'){
            if(args.length != 3) {
                return message.reply(
                    'please tell me your steam ID and the dino you are requesting with the format:\n' +
                    `${prefix}grow [server] [dinosaur on server to grow] [your steam ID] `);
            }
            server = args[0];
            dinoName = args[1];
            steamID = args[2];
            if(dinoName.length < 3) {
                return message.reply(
                    `I do not know a dino by the name of ${dinoName}.`
                );
            }
            //waits for axios to finish its call to assign cash and bank values.
            await getUserAmount(message.guild.id, message.author.id);
            price = null;

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
                await ftpDownload(message, server, "grow");
            } else if(cash >= price) {
                paymentMethod = "cash";
                await ftpDownload(message, server, "grow");
            } else if (cash <= price && bank < price) {
                return message.reply('you do not have enough points for this dino.');
            } else {
                return message.reply(`I'm having trouble growing that dino.`);
            }
        } else if (cmdName === 'price'){
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
async function ftpDownload(message, server, option) {
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
        //server checks
        if (server == 1){
            await ftpClient.downloadTo(steamID + ".json", "/23.227.165.234_14010/TheIsle/Saved/Databases/Sandbox/Players/"  + steamID + ".json");
        } else {
            return message.reply(`type either 1 or 2 for server selection.`)
        }
    } catch(err){
        console.error("Error downloading file: " + err.message);
        return message.reply('something went wrong trying to grow your dino.\nDid you enter the correct steam ID? Or do you have a dinosaur on the server?');
    }
    ftpClient.close();
    await editJson(message, option);
}

async function editJson(message, option) {
    let data = fs.readFileSync(steamID + ".json", "utf-8");
    var contents;
    if (option === "grow"){
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
                contents.Health = "15000";
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
    if (option === "inject"){
        try {
            contents = JSON.parse(data);
            for(var i = 0; i < injectDinoNames.length; i++) {
                if(injectDinoNames[i].Dino.toLowerCase().indexOf(dinoName.toLowerCase()) != -1) {
                    contents.CharacterClass = injectDinoNames[i].Name;
                }
            }
            contents.Growth = "1.0";
            contents.Hunger = "9999";
            contents.Thirst = "9999";
            contents.Stamina = "9999";
            contents.Health = "15000";
            if (gender.toLowerCase().charAt(0) === "m") {
                contents.bGender = false;
            } else if (gender.toLowerCase().charAt(0) === "f") {
                contents.bGender = true;
            }
        } catch (err) {
            console.error("Error editing local JSON: " + err);
            deleteLocalFile();
            return message.reply('something went wrong trying to inject your dino. Please try again later.');
        }
        fs.writeFileSync(steamID + ".json", JSON.stringify(contents));
        await ftpUpload(message, option);
    }
}

async function ftpUpload(message, option) {
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

        if(option === "grow"){
            message.reply('dino grown successfully.');
        } else if (option === "inject") {
            message.reply(`dino injected successfully.`);
        }
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