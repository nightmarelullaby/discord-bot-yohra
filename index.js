const { Client, Intents } = require('discord.js');
const {MessageEmbed } = require('discord.js');
const { ComponentType } = require('discord.js');


const { createReadStream,createWriteStream } = require('fs');
const play = require('play-dl');
const { VoiceConnectionStatus, 
        joinVoiceChannel, 
        createAudioPlayer,
        AudioPlayerStatus,
        NoSubscriberBehavior, 
        PlayerSubscription,
        StreamType,
        createAudioResource} = require('@discordjs/voice');
const { join } = require('node:path');

require('dotenv').config()
// Create a new client instance
const myIntents = new Intents();
myIntents.add(Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES,Intents.FLAGS.GUILD_MESSAGES);

const client = new Client({ intents: myIntents });

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});
let connection
client.on("interactionCreate", async interaction => {
    if(!interaction.isCommand()) return;

    const {commandName} = interaction;
    

    if(commandName === "join"){

        const url = interaction.options.getString('url')
        const query = interaction.options.getString('query')
        
        let arrayWithResults = []
        let messageWithResults = ""

        let videoSearchFunc = await videoSearch(query)

        videoSearchFunc.map((video,index) => {
            arrayWithResults.push({
                title:video["title"],
                url:video["url"],
                duration:video["durationRaw"],
                thumbnails:video["thumbnails"][0].url
            })

            messageWithResults +=`**${index+1})** ${arrayWithResults[index].title} - ${arrayWithResults[index].duration}\n \n`
           
        })
        
    
        await interaction.reply(messageWithResults)
        
        const filter = i => {
            return i.content.includes("1" || "2" || "3" || "4" || "5")
        };
        let collector = interaction.channel.createMessageCollector({filter,time:60000,max:1})

        collector.on("collect", async collect =>{
        interaction.channel.send("Elegiste la opcion " + collect.content)

        const index = Number(collect.content)

        const url = await arrayWithResults[index].url
        let stream = await play.stream(url)
        let resource = createAudioResource(stream.stream,{
           inputType:stream.type
        })
      
        const myPlayer = createAudioPlayer({
            behaviors:{
                noSubscriber:NoSubscriberBehavior.Pause,
            }
        });
        myPlayer.on(AudioPlayerStatus.Playing,()=> console.log("playing audio"))
        myPlayer.on('error',error=>console.log(error))

        myPlayer.play(resource)

        const channel = interaction.options.getChannel('channel')
        connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: interaction.guildId,
            adapterCreator: interaction.guild.voiceAdapterCreator
        });
        
        const subscription = connection.subscribe(myPlayer)

        if(subscription){
            setTimeout(()=> subscription.unsubscribe(), 205_000);
        }
        

        })
        collector.on("end",collector=>{
            interaction.channel.send("el tiempo se acabó")
        })
            
        

        
        

        // await interaction.reply({files:["https://i.ytimg.com/vi/TR3Vdo5etCQ/hqdefault.jpg?sqp=-oaymwEbCKgBEF5IVfKriqkDDggBFQAAiEIYAXABwAEG&rs=AOn4CLD0nBw9hgkPnNC_tNZNTFY95Wn53Q"]}):

        
        // const videoInfo = await videoRequest(url)
        // const {title,video_url,author,thumbnails} = await videoInfo

        // const embedMessage = new MessageEmbed()
        // .setColor(0x0099FF)
        // .setTitle(title)
        // .setURL(video_url)
        // .setAuthor({ name: author.name, iconURL: author.thumbnails[1].url, url: 'https://discord.js.org' })
        // .setThumbnail("https://media.tenor.com/NCBOBzi6UdIAAAAM/2b.gif")
        // .setImage(thumbnails[3].url)
        // .setFooter({ text: 'Reproduciendo...', iconURL: 'https://media.tenor.com/NCBOBzi6UdIAAAAM/2b.gif' });
    
        
        // await interaction.editReply({embeds:[embedMessage]})
       
    }

   

    if(commandName === "disconnect"){
        await interaction.reply("Bot desconectado")
        connection.destroy()
    }
    if(commandName === "help"){
        const embedMessage = new MessageEmbed()
        .setTitle("Sobre mí")
        .setDescription("Soy 2B, miembro de la infantería de automatas YoRHa.")
        .setImage("https://2.bp.blogspot.com/-XeVlUSBvpQM/WeoFplt1xgI/AAAAAAAABOU/A2omiTzFtacqx5LGOiIKibgoVZZWQqJpgCLcBGAs/s1600/tumblr_onau3kD4Nm1v14hqvo3_r1_500.gif")
        await interaction.reply({embeds:[embedMessage]})
    }

})
client.on("messageCreate",message=>{
    if(message.content === "why"){
        message.channel.send("hey, whats going up?")
    }
})


// const videoRequest = async (url) => {
//     try{
//         const req = await getInfo(url)
//         const {videoDetails} = await req
//         return videoDetails;
//     }catch(error){
//         console.log(error)
//     }
// }
const videoSearch = async (params) => {
    try{
        const searched = await play.search(params, { limit : 5 })
        return searched // YouTube Video Search but returns only 1 video.

    } catch(error){
        console.log(error)
    }
}
// Login to Discord with your client's token
client.login(process.env.BOT_TOKEN);