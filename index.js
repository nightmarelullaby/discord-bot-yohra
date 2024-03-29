const { 
    Client, 
    Intents,
    MessageEmbed,
    ComponentType } = require('discord.js');

const {createChatCompletion} = require('./apis/chatgpt/create-chat-completion.js')

const play = require('play-dl');
const { VoiceConnectionStatus, 
        joinVoiceChannel, 
        createAudioPlayer,
        AudioPlayerStatus,
        NoSubscriberBehavior, 
        PlayerSubscription,
        StreamType,
        createAudioResource} = require('@discordjs/voice');
const { ConnectionService } = require('discord-api-types/v10');

require('dotenv').config()
// Create a new client instance
const myIntents = new Intents();
myIntents.add(
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS);

const client = new Client({ intents: myIntents });

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Bot running');
});
let connection
let subscription
let myPlayer
let resource
let i = 0
const arrayOfSongs = []

    
client.on("interactionCreate", async interaction => {
    if(!interaction.isCommand()) return;

    const {commandName} = interaction;

    if(commandName === "join"){


        const query = interaction.options.getString('query')
        const channel = interaction.options.getChannel('channel')

        let arrayWithResults = []
        let messageWithResults = ""

        let videoSearchFunc = await videoSearch(query)

        await videoSearchFunc.map((video,index) => {
            arrayWithResults.push({
                title:video["title"],
                url:video["url"],
                duration:video["durationRaw"],
                thumbnails:video["thumbnails"][0].url
            })

            messageWithResults +=`**${index+1})** ${arrayWithResults[index].title} - ${arrayWithResults[index].duration}\n \n`
           
        })
        
        await interaction.reply(messageWithResults)
        
        const filter = async i => {
            const regex = /[12345]/ig
            const userAuthor = i.author.id === interaction.user.id
            const content = i.content
            if(userAuthor && regex.test(content)) return true
        };

        let collector = interaction.channel.createMessageCollector({filter,time:1000000,max:1})

        collector.on("collect", async collect =>{

        const index = Number(collect.content) - 1 
        const url = await arrayWithResults[index].url
        
        const embedMessage = new MessageEmbed()
        .setColor(0x0099FF)
        .setTitle(arrayWithResults[index].title)
        .setURL(url)
        .setAuthor({ name:interaction.user.username,iconURL: interaction.user.avatarURL(), url: 'https://discord.js.org' })
        .setThumbnail("https://media.tenor.com/NCBOBzi6UdIAAAAM/2b.gif")
        .setImage(arrayWithResults[index].thumbnails)
        .setFooter({ text: 'Reproduciendo...', iconURL: 'https://media.tenor.com/NCBOBzi6UdIAAAAM/2b.gif' });
    
        await interaction.editReply({content:null,embeds:[embedMessage]})

        let stream = await play.stream(url,{discordPlayerCompatibility:true,quality:1})
        console.log(stream.type)
        
        resource = createAudioResource(stream.stream,{
            inputType:stream.type
        })
        //averigua por qué tarda tanto en decir 
        arrayOfSongs.concat(resource)
 
        if(!connection){
            console.log("this should executes one timeonly")
            connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator
            });
            myPlayer = createAudioPlayer({
                behaviors:{
                    noSubscriber:NoSubscriberBehavior.Pause,
                }
            });
    
            
        }
        myPlayer.on(AudioPlayerStatus.Playing,()=> {
            console.log("playing music!")
        })
        myPlayer.on(AudioPlayerStatus.Idle, ()=>{
            if(arrayOfSongs[i+1] === undefined){
                console.log("so there is nothing next")
                return;
            }
            if(!resource.ended){
                i+=1
                console.log("executing idle behavior")
                myPlayer.play(arrayOfSongs[i])
            }
        })

        if(myPlayer._state.status == 'playing'){
            await interaction.channel.send("canción añadida a la cola.")
            console.log("already playing something")
            return;
        }
        
        console.log("this code executes")

        myPlayer.play(resource)
        subscription = connection.subscribe(myPlayer)

        // if(subscription){
        //     setTimeout(()=> subscription.unsubscribe(), 205_000);
        // }
        

        })
        collector.on("end",collector=>{
            interaction.channel.send("el tiempo se acabó")
        })
            
    }

    if(commandName === "next"){
        if(arrayOfSongs[i+1] === undefined){
            await interaction.channel.send("There is nothing to skip")
            return;
        }
        if(myPlayer._state.status == 'playing'){
            i+=1
            myPlayer.play(arrayOfSongs[i])
            subscription = connection.subscribe(myPlayer)
            await interaction.channel.send("Skipped")
            return;
        }
        
    }
    if(commandName === "disconnect"){
        await interaction.reply("Bot desconectado")
        connection.destroy()
        connection = ""
    }
    if(commandName === "help"){
        const embedMessage = new MessageEmbed()
            .setTitle("Sobre mí")
            .setDescription("Soy 2B, miembro de la infantería de automatas YoRHa.")
            .setImage("https://2.bp.blogspot.com/-XeVlUSBvpQM/WeoFplt1xgI/AAAAAAAABOU/A2omiTzFtacqx5LGOiIKibgoVZZWQqJpgCLcBGAs/s1600/tumblr_onau3kD4Nm1v14hqvo3_r1_500.gif")
            await interaction.reply({embeds:[embedMessage]})
    }
    if(commandName === "chat-2b"){
        const input = interaction.options.getString('input').toString()
        

        const chatGPTResponse = await createChatCompletion(input)
        const response = chatGPTResponse.content
        await interaction.channel.send(`En respuesta a: **${input}**.\n \n${response}`)
    }

})

const videoSearch = async (params) => {
    try{
        const searched = await play.search(params, { limit : 5 })
        return searched

    } catch(error){
        console.log(error)
    }
}
// Login to Discord with your client's token
client.login(process.env.BOT_TOKEN);