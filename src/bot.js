//Loads environment variables from the .env file
require('dotenv').config();
// console.log(process.env.BOT_TOKEN);

//Importing from discord.js module
const { Client } = require('discord.js');
const ftp = require('basic-ftp');
const fs = require('fs');
const axios = require('axios');
const express = require('express');

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


//Create an instance of client
const client = new Client();
const ftpClient = new ftp.Client();

//Keep Bot alive on Heruko
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});
app.get('/',(req,res) => {
    return res.send('Hello');
    });

client.on("ready", () => {
    console.log(`${client.user.tag} logged in.`)
    client.user.setActivity('in VSCODE.');
});

client.on("message", async message => {
    console.log(`${message.guild.id} | ${message.author.id} | ${message.author.tag}: ${message.content}`);
    if (message.author.bot) return

    if (message.content.startsWith(prefix)) {
        //Assigning the bot command to respective variables using the spreader operator ...
        const [cmdName, ...args] = message.content
            .trim()
            .substring(prefix.length)
            .split(/ +/g);
        if (cmdName === 'grow'){
            if(args.length != 2) {
                return message.reply(
                    'please tell me your steam ID and the Dino you are requesting with the format:\n' +
                    `${prefix}grow [your steam ID] [dinosaur on server to grow]`);
            }
            steamID = args[0];
            dinoName = args[1];
            if(dinoName.length < 3) {
                return message.reply(
                    `I do not know a dino by the name of ${dinoName}`
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
            if(cash > price) {
                //Start ftp chain call
                await ftpDownload(message);
            } else {
                return message.reply('You do not have enough funds for this dino.');
            }
        } else if (cmdName === ''){

        }
    }
});

//APIs
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

async function deductUserAmount(guildID, userID, price) {
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
        console.log(response.data);
    })
    .catch(function (error) {
        console.log("Error: " + error.message);
    })
    .then(function () {

    });
}

//FTP Connections
async function ftpDownload(message) {
    //ftpClient.ftp.verbose = true;
    ftpClient.ftp.ipFamily = 4;
    try {
        await ftpClient.access({
            host: ftpLocation,
            port: ftpPort,
            user: ftpusername,
            password: ftppassword
        });
        await ftpClient.downloadTo(steamID + ".zip", "512KB.zip");
        // await ftpClient.downloadTo("Injection.json", steamID + ".json");
    } catch(err){
        console.error("Error downloading file: " + err.message);
        return message.reply('something went wrong trying to grow your dino. Did you enter the correct steam ID?');
    }
    ftpClient.close();
    await editJson(message);
}

async function editJson(message) {
    // let data = fs.readFileSync(steamID + ".json", "utf-8");
    let data = fs.readFileSync("injection.json", "utf-8");
    var contents;
    try {
        contents = JSON.parse(data);
        if (contents.CharacterClass.toLowerCase().indexOf(dinoName.toLowerCase()) != -1){
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
        } else {
            return message.reply(`you do not have a ${dinoName} on the server.\nHave you created one and safelogged?`);
        }
    } catch (err) {
        console.error("Error editing local JSON: " + err);
        return message.reply('something went wrong trying to grow your dino. Please try again later');
    }
    fs.writeFileSync(steamID + ".json", JSON.stringify(contents));
    await ftpUpload(message);
}

async function ftpUpload(message) {
    console.log("Uploading file. . .")
    //ftpClient.ftp.verbose = true;
    ftpClient.ftp.ipFamily = 4;
    try {
        await ftpClient.access({
            host: ftpLocation,
            port: ftpPort,
            user: ftpusername,
            password: ftppassword
        });
        await ftpClient.uploadFrom(steamID + ".json", steamID + ".json");
        await deductUserAmount(message.guild.id, message.author.id, price);
        message.reply('Dino grown successfully.');
    } catch(err){
        console.error("Error uploading JSON file: " + err.message);
        return message.reply('something went wrong trying to grow your dino. Please try again later');
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
client.login(token);