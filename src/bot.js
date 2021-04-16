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
const ownerID = process.env.OWNERID;
const devID = process.env.DEVID;
const steamKey = process.env.STEAMKEY;
const adminRole = process.env.STEAMUPDATEROLE;

const dinoPrices = JSON.parse(fs.readFileSync("prices.json"));
const adultNames = JSON.parse(fs.readFileSync("names.json"));
const injectDinoPrices = JSON.parse(fs.readFileSync("inject-prices.json"));
const injectDinoNames = JSON.parse(fs.readFileSync("inject-names.json"));
const adminUsers = JSON.parse(fs.readFileSync("free_id.json"));

var app = express();
var isSteamValid;
var processing = false;

//Create an instance of client
const client = new Discord.Client();

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

function cancelCheck(message, msg) {
    if (msg === undefined || msg == null || msg == "") return true;
    if (msg.toLowerCase().indexOf("cancel") != -1) {
        message.reply("you cancelled the transaction.")
        return true;
    }
    return false;
}

client.on("message", async message => {
    if (message.author.bot) return
    
    var dinoName;
    var price;
    var cash;
    var bank;
    var steamID;
    var paymentMethod;
    var server;
    var gender;
    var permCheck = false;
    var isBuy = false;
    var serverSelection;

    if (message.content.startsWith(prefix)) {
        // console.log(`${message.guild.id} | ${message.author.id} | ${message.author.tag}: ${message.content}`);
        //Assigning the bot command to respective variables using the spreader operator ...
        const [cmdName, ...args] = message.content
            .trim()
            .substring(prefix.length)
            .split(/ +/g);
        
        //Await Message for interactive buying
        if (cmdName.toLowerCase() === 'buy') {
            if (args.length == 0) {
                var msg;
                var command;
                const filter = m => m.author.id === message.author.id;
                const options = {
                    max: 1,
                    time: 300000
                };
                const questions = new Discord.MessageEmbed()
                    .setTitle('Buy Interactive Menu')
                    .setColor('#DAF7A6')
                    .addFields(
                        {name: "Are you safelogged?",
                        value: "Please type either:\nyes\nno"}
                    )
                    .setFooter(`User order: ${message.author.username}`);
                //Send initial embed
                message.reply(questions);
                var timedOut = false;
                var safelogged;
                await message.channel.awaitMessages(filter, options).then((collected)=>{safelogged = collected.first().content}).catch(collected => {return timedOut = true;});
                if (safelogged == undefined || safelogged == null || safelogged == "" || safelogged.toLowerCase() == "no" || safelogged.toLowerCase() == "n"){
                    return message.reply(`please safelog before continuing.`);
                }
                if (safelogged.toLowerCase().localeCompare("yes") !== 0 && safelogged.toLowerCase().localeCompare("y") !== 0){
                    return message.reply(`please enter yes or no.`);                    
                }

                if(timedOut) {return false;}
                questions.fields = [];
                questions.addFields({name: "Do you want to grow? Or do you want to inject?\n(Type cancel at any point to end process)",
                                    value: "Please type either:\ngrow\ninject"}
                                    );
                message.reply(questions);
                await message.channel.awaitMessages(filter, options).then((collected)=>{command = collected.first().content}).catch(collected => {message.reply(`time ran out. Please try again`); return timedOut = true;});
                if(cancelCheck(message, command)) return false;
                if(command.toLowerCase().localeCompare("grow") !== 0 && command.toLowerCase().localeCompare("inject") !== 0) {
                    return message.reply(`please type either "grow" or "inject".`);
                }

                //Remove current embed fields and replacing it as process goes along
                if(timedOut) {return false;}
                questions.fields = [];
                questions.addFields({name: "Which server?", value: "Please type either 1 or 2:\n1 - New Beginnings [High AI]\n2 - New Beginnings [High AI #2]"});
                message.reply(questions);
                await message.channel.awaitMessages(filter, options).then((collected)=>{server = collected.first().content}).catch(collected => {message.reply(`time ran out. Please try again`); return timedOut = true;});
                if(cancelCheck(message, server)) return false;
                if(server.localeCompare("1") === -1 && server.localeCompare("2") === -1) {
                    return message.reply(`please type either 1 or 2.`);
                }

                if (command.toLowerCase() != "grow") {
                    if(timedOut) {return false;}
                    questions.fields = [];
                    questions.addFields({name: "Male or female?", value: "Please type either:\nm\nf"});
                    message.reply(questions);
                    await message.channel.awaitMessages(filter, options).then((collected)=>{gender = collected.first().content}).catch(collected => {message.reply(`time ran out. Please try again`); return timedOut = true;});
                    if(cancelCheck(message, gender)) return false;
                    if(gender.toLowerCase().localeCompare("m") !== 0 && gender.toLowerCase().localeCompare("f") !== 0 
                            && gender.toLowerCase().localeCompare("female") !== 0 && gender.toLowerCase().localeCompare("male") !== 0) {
                        return message.reply(`please type either m or f.`);
                    }
                }
                if (command.toLowerCase() == "inject"){
                    if(timedOut) {return false;}
                    questions.fields = [];
                    var msg = "";
                    for (var x = 0; x < injectDinoPrices.length; x++) {
                        msg += `${injectDinoPrices[x].ShortName}: $${injectDinoPrices[x].Price.toLocaleString()}\n`;
                    }
                    questions.addFields({name: "Type the name of the dinosaur you desire", value: msg});
                    message.reply(questions);
                    await message.channel.awaitMessages(filter, options).then((collected)=>{dinoName = collected.first().content}).catch(collected => {message.reply(`time ran out. Please try again`); return timedOut = true;});
                    if(cancelCheck(message, dinoName)) return false;
                }
                if (command.toLowerCase() == "grow"){
                    if(timedOut) {return false;}
                    questions.fields = [];
                    var msg = "";
                    for (var x = 0; x < dinoPrices.length; x++) {
                        if(dinoPrices[x].Growable.toLowerCase() == "y") {
                            msg += `${dinoPrices[x].ShortName}: $${dinoPrices[x].Price.toLocaleString()}\n`;
                        }
                    }
                    questions.addFields({name: "Type the name of the dinosaur you desire", value: msg});
                    message.reply(questions);
                    await message.channel.awaitMessages(filter, options).then((collected)=>{dinoName = collected.first().content}).catch(collected => {message.reply(`time ran out. Please try again`); return timedOut = true;});
                    if(cancelCheck(message, dinoName)) return false;
                }

                if(timedOut) {return false;}
                questions.fields = [];
                if (command.toLowerCase() != "inject"){
                    questions.addFields({name: "Enter your steam ID", value: "Either click the 17 digit code next to your name in game to copy it and paste it here.\n\nOr go to Steam > View > Settings > Interface > Check 'Display web address bars when available' > Go to your profile. Your steam ID is the 17 digit code in the address bar."});
                    message.reply(questions);
                    await message.channel.awaitMessages(filter, options).then((collected)=>{steamID = collected.first().content}).catch(collected => {message.reply(`time ran out. Please try again`); return timedOut = true;});
                    if(cancelCheck(message, steamID)) return false;
                }

                var confirm;

                if(timedOut) {return false;}
                questions.fields = [];
                questions.addFields({name: "Confirm?", value: "type either:\nyes\nno"});
                message.reply(questions)
                await message.channel.awaitMessages(filter, options).then((collected)=>{confirm = collected.first().content}).catch(collected => {message.reply(`time ran out. Please try again`); return timedOut = true;});
                if(timedOut) {return false;}
                if (confirm.toLowerCase() == "no" || confirm.toLowerCase() == "n") {
                    return message.reply(`you cancelled this request.`);
                }
                if(confirm.toLowerCase().localeCompare("yes") !== 0 && confirm.toLowerCase().localeCompare("y") !== 0) {
                    return message.reply(`please enter yes or no.`);
                }

                if(timedOut) {return false;}
                questions.fields = [];
                questions.setTitle("Please wait . . .");
                message.reply(questions);

                isBuy = true;
                for (var x = 0; x < adminUsers.length; x++) {
                    if (message.member.roles.cache.has(adminUsers[x].id)){
                        permCheck = true;
                        break;
                    } 
                }
                if (command.toLowerCase() === "inject") {
                    if (await getSteamID(message.author.id) == false) return message.reply(`in order to use inject, you must link your steam ID\nuse ~link [steam ID here]`);
                    steamID = await getSteamID(message.author.id);
                    if(dinoName.length < 3) {
                        return message.reply(
                            `I do not know a dino by the name of ${dinoName}.`
                        );
                    }
                    //Trike check
                    if(dinoName.toLowerCase() == "trike") dinoName = "triceratops";
                    let money = await getUserAmount(message.guild.id, message.author.id);
                    bank = parseInt(money[0]);
                    cash = parseInt(money[1]);
                    price = null;
        
                    for (var x = 0; x < injectDinoPrices.length; x++) {
                        if(injectDinoPrices[x].Dino.toLowerCase()
                                        .indexOf(dinoName.toLowerCase().replace(" ", "").replace("-", "")) != -1) {
                            price = parseInt(injectDinoPrices[x].Price);
                            break;
                        }
                    }
                    
                    if(!price) {
                        return message.reply(`that dino cannot be injected.`);
                    }
                    if (processing) {
                        questions.fields = [];
                        questions.addFields({name: "waiting on other user(s) to complete their order", value: ". . ."});
                        message.reply(questions);
                    }
                    if(bank >= price) {
                        paymentMethod = "bank";
                        // if(processing) message.reply(`waiting on other user(s) to complete their order. . .`);
                        while (processing){
                            console.log(`${message.author.username}[${message.author.id}] is waiting in queue. . .`);
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                        await ftpDownload(message, server, "inject", dinoName, price, steamID, paymentMethod, gender, permCheck, isBuy, serverSelection);
                    } else if(cash >= price) {
                        paymentMethod = "cash";
                        // if (processing) message.reply(`waiting on other user(s) to complete their order. . .`);
                        while (processing){
                            console.log(`${message.author.username}[${message.author.id}] is waiting in queue. . .`);
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                        await ftpDownload(message, server, "inject", dinoName, price, steamID, paymentMethod, gender, permCheck, isBuy, serverSelection);
                    } else if (cash < price && bank < price) {
                        return message.reply('you do not have enough points for this dino.');
                    } else {
                        return message.reply(`I'm having trouble growing that dino.`);
                    }
                } else if (command.toLowerCase() === "grow") {
                    if(dinoName.length < 3) {
                        return message.reply(
                            `I do not know a dino by the name of ${dinoName}.`
                        );
                    }
                    //Trike check
                    if(dinoName.toLowerCase() == "trike") dinoName = "triceratops";
                    //waits for axios to finish its call to assign cash and bank values.
                    let money = await getUserAmount(message.guild.id, message.author.id);
                    bank = parseInt(money[0]);
                    cash = parseInt(money[1]);
                    price = null;
        
                    //Getting price of dinosaur from json object.
                    for (var x = 0; x < dinoPrices.length; x++){
                        if (dinoPrices[x].Dino.toLowerCase()
                                        .indexOf(dinoName.toLowerCase().replace(" ", "").replace("-", "")) != -1){
                            price = parseInt(dinoPrices[x].Price);
                            break;
                        }
                    }
                    if (processing) {
                        questions.fields = [];
                        questions.addFields({name: "waiting on other user(s) to complete their order", value: ". . ."});
                        message.reply(questions);
                    }
                    if(bank >= price) {
                        //Start ftp chain call
                        paymentMethod = "bank";
                        // if(processing) message.reply(`waiting on other user(s) to complete their order. . .`);
                        while (processing){
                            console.log(`${message.author.username}[${message.author.id}] is waiting in queue. . .`);
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                        await ftpDownload(message, server, "grow", dinoName, price, steamID, paymentMethod, gender, permCheck, isBuy, serverSelection);
                    } else if(cash >= price) {
                        paymentMethod = "cash";
                        // if(processing) message.reply(`waiting on other user(s) to complete their order. . .`);
                        while (processing){
                            console.log(`${message.author.username}[${message.author.id}] is waiting in queue. . .`);
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                        await ftpDownload(message, server, "grow", dinoName, price, steamID, paymentMethod, gender, permCheck, isBuy, serverSelection);
                    } else if (cash < price && bank < price) {
                        isBuy = false;
                        permCheck = false;
                        return message.reply('you do not have enough points for this dino.');
                    } else {
                        isBuy = false;
                        permCheck = false;
                        return message.reply(`I'm having trouble growing that dino.`);
                    }
                }
                isBuy = false;
                permCheck = false;
            }
            else {
                message.reply(`please use ~buy`);
            }
        }

        if (cmdName.toLowerCase() === 'link') {
            isSteamValid = null;
            if (args.length != 1) return message.reply(`please paste your steam ID with the format:\n${prefix}link [Your Steam ID Here]`);
            if(await addSteamID(message.author.id, args[0]) == false) return message.reply(`that does not seem to be a valid steam ID, or it is already in use. Please try again.`);
            return message.reply(`your steam ID has been linked.`);
        }

        if (cmdName.toLowerCase() === 'updatesteamid') {
            isSteamValid = null;
            if (args.length != 2) return message.reply(`please use this format:\n${prefix}updatesteamid [@User to update] [Updated Steam ID]`);
            if (message.member.roles.cache.find(r => r.name.toLowerCase() === adminRole.toLowerCase())) {
                if(await updateSteamID(args[0], args[1]) == false) return message.reply(`that steam ID may already exist or is invalid. Please try again`);
                return message.reply(`${args[0]}'s steam ID has been updated.`)
            } else return message.reply(`you do not have rights to use this command.`);
        }

        if (cmdName.toLowerCase() === 'inject') {
            permCheck = false;
            for (var x = 0; x < adminUsers.length; x++) {
                if (message.member.roles.cache.has(adminUsers[x].id)){
                    permCheck = true;
                    break;
                } 
            }
            if (!permCheck) {
                return message.reply(`you do not have the permissions to use this command.`);
            }
            if(args.length != 4) {
                return message.reply(
                    'please tell me the dino you are requesting with the format:\n' +
                    `${prefix}inject [server(1/2)] [gender(m/f)] [dinosaur name to inject] [steam ID]`);
            }
            server = args[0];
            gender = args[1];
            dinoName = args[2];
            steamID = args[3];
            // steamID = await getSteamID(message.author.id);
            // if (await getSteamID(message.author.id) == false) return message.reply(`in order to use inject, you must link your steam ID\nuse ~link [steam ID here]`);
            if(dinoName.length < 3) {
                return message.reply(
                    `I do not know a dino by the name of ${dinoName}.`
                );
            }
            //Trike check
            if(dinoName.toLowerCase() == "trike") dinoName = "triceratops";
            if(processing) message.reply(`waiting on other user(s) to complete their order. . .`);
            while (processing){
                console.log(`${message.author.username}[${message.author.id}] is waiting in queue. . .`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            await ftpDownload(message, server, "inject", dinoName, price, steamID, paymentMethod, gender, permCheck, isBuy, serverSelection);
        }

        if (cmdName.toLowerCase() === 'grow'){
            permCheck = false;
            for (var x = 0; x < adminUsers.length; x++) {
                if (message.member.roles.cache.has(adminUsers[x].id)){
                    permCheck = true;
                    break;
                } 
            }
            if (!permCheck) {
                return message.reply(`you do not have the permissions to use this command.`);
            }
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
            //Trike check
            if(dinoName.toLowerCase() == "trike") dinoName = "triceratops";
            if(processing) message.reply(`waiting on other user(s) to complete their order. . .`);
            while (processing){
                console.log(`${message.author.username}[${message.author.id}] is waiting in queue. . .`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            await ftpDownload(message, server, "grow", dinoName, price, steamID, paymentMethod, gender, permCheck, isBuy, serverSelection);
        } 

        if (cmdName === 'price'){
            await getDinoPrices(message);
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
            console.error("Error: " + error.message);
        })
        .then(function () {
            // always executed
            return [bank, cash];
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
        console.error("Error: " + error.message);
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
        console.error("Error: " + error.message);
    })
    .then(function () {

    });
}

async function checkIDValid(id) {
    return await axios.get(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${steamKey}&format=json&steamids=${id}`)
        .then(function(response) {
            if (response.data.response.players == "" || response.data.response.players== null || response.data.response.players == undefined ) {
                isSteamValid = false;
            } else {
                isSteamValid = true;
            }
        })
        .catch(function (error) {
            console.error("Error fetching server count: " + error);
        })
        .then(function () {
        })
}

//FTP Connections
async function ftpDownload(message, server, option, dinoName, price, steamID, paymentMethod, gender, permCheck, isBuy, serverSelection) {
    //server checks
    processing = true;
    if(server === "1") serverSelection = "/" + ftpLocation +"_14000/TheIsle/Saved/Databases/Survival/Players/";
    if(server === "2") serverSelection = "/" + ftpLocation +"_14200/TheIsle/Saved/Databases/Survival/Players/";
    var fileId = steamID;
    let ftpClient = new ftp.Client();
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
        await ftpClient.downloadTo(fileId + ".json", serverSelection + fileId + ".json");

    } catch(err){
        processing = false;
        console.error("Error downloading file: " + err.message);
        return message.reply('something went wrong trying to grow your dino.\nDid you enter the correct steam ID? Or do you have a dinosaur on the server?');
    }
    // ftpClient.close();
    await editJson(message, server, option, fileId, dinoName, price, paymentMethod, gender, permCheck, isBuy, serverSelection);
}

async function editJson(message, server, option, fileId, dinoName, price, paymentMethod, gender, permCheck, isBuy, serverSelection) {
    let data = fs.readFileSync(fileId + ".json", "utf-8");
    var contents;
    if (option.toLowerCase() === "grow"){
        try {
            contents = JSON.parse(data);
            //Spino check ;)
            if (contents.CharacterClass.toLowerCase().indexOf("spino") != -1 && contents.bGender == true) {
                processing = false;
                deleteLocalFile(fileId);
                return message.reply(`Spinosaurus has to be male to receive a grow.`);
            }
            //Switch trike name for this check
            if(dinoName.toLowerCase() == "triceratops") dinoName = "trike";
            if (contents.CharacterClass.toLowerCase().indexOf(dinoName.toLowerCase()) !== -1 
                    || dinoName.toLowerCase().indexOf(contents.CharacterClass.toLowerCase()) !== -1
                    || (dinoName.toLowerCase().replace(" ", "").replace("-", "").indexOf("subrex") !== -1 
                    && (contents.CharacterClass.toLowerCase().indexOf("rexjuvs") !== -1 || contents.CharacterClass.toLowerCase().indexOf("rexsubs") !== -1))){
                //"cera" gets mistaken for Triceratops, and "Trike" is what is compared on the file.
                if(dinoName.toLowerCase() === 'cera') dinoName = 'ceratosaurus';
                if(dinoName.toLowerCase() === 'trike') dinoName = 'Triceratops';

                //Check if the pleb's bleeding or has broken leg
                if(contents.bBrokenLegs === true || contents.BleedingRate.localeCompare("0") !== 0) {
                    processing = false;
                    deleteLocalFile(fileId);
                    return message.reply(`your dino is either bleeding or has a broken leg. Try again when the leg is healed or when you have stopped bleeding.`);
                }

                //Change the value of juvi to Adult from the list of adult names defined
                for(var i = 0; i < adultNames.length; i++) {
                    if(adultNames[i].Dino.toLowerCase().indexOf(dinoName.toLowerCase().trim().replace(" ", "").replace("-", "")) != -1) {
                        console.log(`${message.author.username} [${message.author.id}] current Dino: ${contents.CharacterClass} | Requesting a grow (${adultNames[i].Name})`);
                        contents.CharacterClass = adultNames[i].Name;
                        break;
                    }
                    
                }
                //Adding 0.5 to Z axis
                if (server === "1") {
                    var locationParts;
                    locationParts = contents.Location_Isle_V3.split("Z=", 2);
                    locationParts[1] = parseFloat(locationParts[1]);
                    locationParts[1] += 0.9;
                    locationParts[0] += "Z=";
                    locationParts[1] = locationParts[1].toString();
                    var completed = locationParts[0] + locationParts[1];
                    contents.Location_Isle_V3 = completed;
                }

                if (server === "2") {
                var locationParts;
                    locationParts = contents.Location_Thenyaw_Island.split("Z=", 2);
                    locationParts[1] = parseFloat(locationParts[1]);
                    locationParts[1] += 0.9;
                    locationParts[0] += "Z=";
                    locationParts[1] = locationParts[1].toString();
                    var completed = locationParts[0] + locationParts[1];
                    contents.Location_Thenyaw_Island = completed;
                }
                contents.Growth = "1.0";
                contents.Hunger = "9999";
                contents.Thirst = "9999";
                contents.Stamina = "9999";
                contents.Health = "15000";
            } else {
                deleteLocalFile(fileId);
                console.error(`${message.author.username} [${message.author.id}]: Error - user may be trying to grow a dino which they do not have.`);
                processing = false;
                return message.reply(`you do not have a '${dinoName}' on the server.\nMake sure you have already created a dino, safelogged and checked the spelling.`);
            }
        } catch (err) {
            console.error("Error editing local JSON: " + err);
            deleteLocalFile(fileId);
            console.error(`${message.author.username} [${message.author.id}]: Error - there was an issue making changes to the user's dino`);
            processing = false;
            return message.reply('something went wrong trying to grow your dino. Please try again later.');
        }
        fs.writeFileSync(fileId + ".json", JSON.stringify(contents, null, 4));
        await ftpUpload(message, server, option, fileId, price, paymentMethod, permCheck, isBuy, serverSelection);
    }
    if (option.toLowerCase() === "inject"){
        try {
            contents = JSON.parse(data);

            //Check if the pleb's bleeding or has broken leg
            if(contents.bBrokenLegs === true || contents.BleedingRate.localeCompare("0") !== 0) {
                processing = false;
                deleteLocalFile(fileId);
                return message.reply(`your dino is either bleeding or has a broken leg. Try again when the leg is healed or when you have stopped bleeding.`);
            }

            for(var i = 0; i < injectDinoNames.length; i++) {
                if(injectDinoNames[i].Dino.toLowerCase().indexOf(dinoName.toLowerCase()) != -1) {
                    console.log(`${message.author.username} [${message.author.id}] current Dino: ${contents.CharacterClass} | Requesting an inject as: ${injectDinoNames[i].Name}`);
                    contents.CharacterClass = injectDinoNames[i].Name;
                }
            }
            //Adding 0.5 to Z axis
            if (server === "1") {
                var locationParts;
                locationParts = contents.Location_Isle_V3.split("Z=", 2);
                locationParts[1] = parseFloat(locationParts[1]);
                locationParts[1] += 0.9;
                locationParts[0] += "Z=";
                locationParts[1] = locationParts[1].toString();
                var completed = locationParts[0] + locationParts[1];
                contents.Location_Isle_V3 = completed;
            }

            if (server === "2") {
                var locationParts;
                locationParts = contents.Location_Thenyaw_Island.split("Z=", 2);
                locationParts[1] = parseFloat(locationParts[1]);
                locationParts[1] += 0.9;
                locationParts[0] += "Z=";
                locationParts[1] = locationParts[1].toString();
                var completed = locationParts[0] + locationParts[1];
                contents.Location_Thenyaw_Island = completed;
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
            processing = false;
            deleteLocalFile(fileId);
            console.error(`${message.author.username} [${message.author.id}]: Error - there was an issue making changes to the user's dino`);
            return message.reply('something went wrong trying to inject your dino. Please try again later.');
        }
        fs.writeFileSync(fileId + ".json", JSON.stringify(contents, null, 4));
        await ftpUpload(message, server, option, fileId, price, paymentMethod, permCheck, isBuy, serverSelection);
    }
}

async function ftpUpload(message, server, option, fileId, price, paymentMethod, permCheck, isBuy, serverSelection) {
    if(server === "1") serverSelection = "/" + ftpLocation +"_14000/TheIsle/Saved/Databases/Survival/Players/";
    if(server === "2") serverSelection = "/" + ftpLocation +"_14200/TheIsle/Saved/Databases/Survival/Players/";

    let ftpClient = new ftp.Client();
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
        if(!permCheck){
            //This should be in bot if blocks since admins should pay for ~buy command
            if(!price) {
                console.error(`${message.author.username} [${message.author.id}]: Error - no price defined for the requested dino.`);
                processing = false;
                return message.reply(`something went wrong, please try again later.`);
            }
            if(paymentMethod.indexOf("cash") != -1) {
                await deductUserAmountCash(message.guild.id, message.author.id, price);
            } 
            if(paymentMethod.indexOf("bank") != -1) {
                await deductUserAmountBank(message.guild.id, message.author.id, price);
            }
        }
        if(isBuy === true && permCheck === true) {
            //This should be in bot if blocks since admins should pay for ~buy command
            if(!price) {
                console.error(`${message.author.username} [${message.author.id}]: Error - no price defined for the requested dino.`);
                processing = false;
                return message.reply(`something went wrong, please try again later.`);
            }
            if(paymentMethod.indexOf("cash") != -1) {
                await deductUserAmountCash(message.guild.id, message.author.id, price);
            } 
            if(paymentMethod.indexOf("bank") != -1) {
                await deductUserAmountBank(message.guild.id, message.author.id, price);
            }
        }
        await ftpClient.uploadFrom(fileId + ".json", serverSelection+fileId + ".json");
        if(option.toLowerCase() === "grow"){
            console.log(`${message.author.username} [${message.author.id}] grown successfully.`);
            message.reply('dino grown successfully.');
        } else if (option.toLowerCase() === "inject") {
            console.log(`${message.author.username} [${message.author.id}] injected successfully.`);
            message.reply(`dino injected successfully.`);
        }
    } catch(err){
        console.error("Error uploading JSON file: " + err.message);
        deleteLocalFile(fileId);
        ftpClient.close();
        console.error(`${message.author.username} [${message.author.id}] had problems with this transaction.`);
        processing = false;
        return message.reply('something went wrong trying to grow your dino. Please try again later.');
    }
    processing = false;
    deleteLocalFile(fileId);
    ftpClient.close();
}

async function deleteLocalFile(fileId) {
    console.log("Deleting local files . . .");
    fs.unlink("./" + fileId + ".json", (err) => {
        if (err) console.error(err);
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
    .setTitle('To request a grow, use the command:\n~buy')
    .setColor('#DAF7A6')
    .addFields(
        {name: "\n🦎__**DINOSAUR PRICES (Points)**__🦎\n\n",
        value: msg}
    )
    
    return message.reply(embed);
}

async function getSteamID (id) {
    var steamInfo = JSON.parse(fs.readFileSync("steam-id.json"));
    for (var x = 0; x < steamInfo.length; x++) {
        if (id == steamInfo[x].User)
            return steamInfo[x].SteamID;
    }
    return false;
}
async function updateSteamID (id, newID) {
    let userID = id.substring(3, id.length-1);
    await checkIDValid(newID);
    if (isSteamValid == false) return false;
    var steamInfo = JSON.parse(fs.readFileSync("steam-id.json"));
    //Search if new ID already exists
    for (var i = 0; i < steamInfo.length; i++) {
        if(newID == steamInfo[i].SteamID) {
            return false;
        }
    }
    //Search for user
    for (var x = 0; x < steamInfo.length; x++) {
        //Found user
        if (userID == steamInfo[x].User){
            //Update user
            steamInfo[x].SteamID = newID;
            fs.writeFileSync("steam-id.json", JSON.stringify(steamInfo, null, 4));
            await sendFile(steamInfo); 
            return true;
        }
    }
    return false;
}
async function addSteamID (userID, steamID) {
    await checkIDValid(steamID);
    if (isSteamValid == false) return false;
    var steamInfo = JSON.parse(fs.readFileSync("steam-id.json"));
    //Search for user
    for (var x = 0; x < steamInfo.length; x++) {
        //Found user
        if (userID == steamInfo[x].User)
            //User already exists
            return false;
    }
    //Check if steam id already exists
    for (var i = 0; i < steamInfo.length; i++) {
        if (steamID == steamInfo[i].SteamID){
            return false;
        }
    }
    steamInfo.push({
        "User": userID,
        "SteamID": steamID
    });
    fs.writeFileSync("steam-id.json", JSON.stringify(steamInfo, null, 4));
    await sendFile(steamInfo);
    return true;
}

//sending message to owner for lives backup
async function sendFile(info) {
    let ftpClient = new ftp.Client();
    ftpClient.ftp.ipFamily = 4;
    try {
        await ftpClient.access({
            host: ftpLocation,
            port: ftpPort,
            user: ftpusername,
            password: ftppassword
        });
        await ftpClient.uploadFrom("steam-id.json", "/" + ftpLocation +"_14200/TheIsle/Saved/Databases/steam-id.json");
    } catch(err){
        console.error("Error uploading steam-id JSON file: " + err.message);
    }
    ftpClient.close();

    // client.users.fetch(ownerID, false).then((user) => {
    //     user.send("||" + JSON.stringify(info, null, 4) + "||");
    // });
    // client.users.fetch(devID, false).then((user) => {
    //     user.send("||" + JSON.stringify(info, null, 4) + "||");
    // });
}
client.login(token);