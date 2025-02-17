import {Bot} from "../Struct/Bot";
import {ApplicationCommandOptionType, ChatInputCommandInteraction, Interaction} from "discord.js";
import YouTube from "youtube-sr";
import {loopMode} from "../Struct/Queue";

module.exports = {
    name: "music",
    description: "music system",
    category: "Music",
    options: [
        {
            type: ApplicationCommandOptionType.SubcommandGroup,
            name: "play",
            description: "play music",
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "twitch",
                    description: "play music from twitch",
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: "username",
                            description: "username",
                            required: true,
                            autocomplete: true,
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "youtube",
                    description: "Play a track from youtube",
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: "name",
                            description: "Youtube query",
                            required: true,
                            autocomplete: true,
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "spotify",
                    description: "Play a track from spotify",
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: "name",
                            description: "name",
                            required: true,
                            autocomplete: true,
                        }
                    ]
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.SubcommandGroup,
            name: "search",
            description: "search music",
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "twitch",
                    description: "search music from twitch",
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: "user_login",
                            description: "user_login",
                            required: false
                        },
                        {
                            type: ApplicationCommandOptionType.String,
                            name: "language",
                            description: "language",
                            required: false,
                            choices: [
                                {
                                    name: "English",
                                    value: "en"
                                },
                                {
                                    name: "Francais",
                                    value: "fr",
                                },
                                {
                                    name: "Español",
                                    value: "es"
                                }
                            ]
                        },
                        {
                            type: ApplicationCommandOptionType.Boolean,
                            name: "type",
                            description: "live or not",
                            required: false,
                            choices: [
                                {
                                    name: "live",
                                    value: true
                                },
                                {
                                    name: "all",
                                    value: false
                                }
                            ]
                        },
                        {
                            type: ApplicationCommandOptionType.Integer,
                            name: 'limit',
                            description: 'limit',
                            required: false
                        }
                    ]
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "stop",
            description: "Stop the song"
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "volume",
            description: "Change the volume",
            options: [
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: "volume",
                    description: "Volume",
                    required: true
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "pause",
            description: "Pause the song",
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "mode",
                    description: "Mode",
                    required: true,
                    choices: [
                        {
                            name: "pause",
                            value: "pause"
                        },
                        {
                            name: "resume",
                            value: "resume"
                        }
                    ]
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "skip",
            description: "Skip the song"
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "queue",
            description: "Show the queue",
            options: [
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: "page",
                    description: "Page",
                    required: false
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "loop",
            description: "Loop the song",
            options: [
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: "mode",
                    description: "Mode",
                    required: true,
                    choices: [
                        {
                            name: "off",
                            value: loopMode.OFF
                        },
                        {
                            name: "track",
                            value: loopMode.TRACK
                        },
                        {
                            name: "queue",
                            value: loopMode.QUEUE
                        },
                        {
                            name: "random",
                            value: loopMode.RANDOM
                        }
                    ]
                }
            ]
        }
    ],

    execute: async (interaction: ChatInputCommandInteraction, client: Bot) => {
        const subcommandGroup = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();

        const queue = client.player.getQueue(interaction.guildId!);

        require(`./music/${subcommandGroup ? subcommandGroup + '/' : ''}${subcommand}`)(interaction, client, queue);
    },

    handleAutoComplete: async (interaction: Interaction, client: Bot, query: string) => {
        if (interaction.isAutocomplete()) {
            const subcommand = interaction.options.getSubcommand();
            const subcommandGroup = interaction.options.getSubcommandGroup();

            if (subcommandGroup === 'play') {

                try {
                    new URL(query);
                    return await interaction.respond([]);
                } catch {}


                if (subcommand === 'youtube') {

                    if (query.length < 3) return await interaction.respond([]);

                    const fetch = await YouTube.search(query, { type: "video", limit : 7});

                    if (!fetch?.length) return await interaction.respond([]);

                    interaction.respond(fetch.map((track: any) => ({
                        name: track.channel.name + ' - ' + (track.title.length + track.channel.name.length > 90 ? track.title.slice(0, 90 - track.channel.name.length) + '...' : track.title),
                        value: track.id
                    })));

                } else if (subcommand === 'twitch') {
                    if (query.length < 3) return await interaction.respond([]);

                    const fetch = await client.twitchApi.fetchQuery(encodeURIComponent(query), (5));

                    if (fetch?.data?.length < 1) return interaction.respond([]);

                    interaction.respond(fetch?.data?.map((user: any) => ({
                        name: (`${user.broadcaster_language} - ${user.display_name} - ${user.title}`).length > 90 ? (`${user.broadcaster_language} - ${user.display_name} - ${user.title}`).slice(0, 90) + '...' : (`${user.broadcaster_language} - ${user.display_name} - ${user.title}`),
                        value: user.broadcaster_login
                    })));
                } else if (subcommand === 'spotify') {
                    if (query.length < 3) return await interaction.respond([]);

                    const tracks = (await client.player.spotifyClient.search(query, 10)).tracks;

                    if (!tracks || tracks.length < 1) return;

                    interaction.respond(tracks.map((track: any) => ({
                        name: (track.artists[0].name + ' - ' + track.name + (track.album ? ' - album : ' + track.album.name : '')).length > 90 ? (track.artists[0].name + ' - ' + track.name + (track.album ? ' - album : ' + track.album.name : '')).slice(0, 90) + '...' : (track.artists[0].name + ' - ' + track.name + (track.album ? ' - album : ' + track.album.name : '')),
                        value: track.uri || track.externalURL.spotify
                    })))
                }
            }
        }
    }
}