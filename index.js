const solanaWeb3 = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const express = require('express');
const nacl = require('tweetnacl');
const bs58 = require('bs58');
const { REST, Client, GatewayIntentBits, Routes } = require('discord.js');

const app = express();
const port = '53321';
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]});
const botAuthToken = 'BOT_AUTH_TOKEN';

const discordGuildId = 'DISCORD_GUILD_ID';
const discordRoleId = 'DISCORD_ROLE_ID';

const unsignedMessage = `Some fancy test message.`
const membershipTokenAddr = 'Fw8PqtznYtg4swMk7Yjj89Tsj23u5CJLfW5Bk8ro4G1s'; //Star Atlas Fimbul Airbike

async function getDiscordUserInfo(tokenType, accessToken) {
	let userId = fetch('https://discord.com/api/users/@me', {
		headers: {
			authorization: `${tokenType} ${accessToken}`,
		},
	})
	.then(result => result.json())
	.then(response => {
		const { username, discriminator, avatar, id} = response;
		console.log(`Discord userID: ${id}`);
		return id;
	})
	.catch(console.error);
	return userId;
}

async function getTokenAccounts(publickey, solanaConnection) {

    const filters = [
        {
          dataSize: 165,    //token accounts are 165 bytes
        },
        {
          memcmp: {
            offset: 32,     //owner's public key starts at 32 bytes
            bytes: publickey,  //search criteria, a base58 encoded string
          },            
        },
		{
          memcmp: {         //additional filter to return only the specified membership token
            offset: 0,
            bytes: membershipTokenAddr,
          },
		}];

    const accounts = await solanaConnection.getParsedProgramAccounts(TOKEN_PROGRAM_ID, {filters: filters});

	if (accounts.length > 0) {
		return true;
	}
}

client.on('ready', () => {
	console.log(`Logged in to Discord as ${client.user.tag}!`);
});

app.get('/', (request, response) => {
	return response.sendFile('index.html', { root: '.' });
});

app.get('/auth/discord', (request, response) => {
	return response.sendFile('dashboard.html', { root: '.' });
});

app.get('/link', async (request, response) => {
	let status = 'failed';
	let accessToken = request.header('accessToken');
	let tokenType = request.header('tokenType');
	let signature = request.header('signature');
	let publickey = request.header('publickey');
	
	let discordUserId = await getDiscordUserInfo(tokenType, accessToken);
	
	const signatureUint8 = Buffer.from(signature, 'base64');
	const messageUint8 = new TextEncoder().encode(unsignedMessage);
	const verificationStatus = nacl.sign.detached.verify(messageUint8, signatureUint8, bs58.decode(publickey));

	if (verificationStatus === true) {
		const connection = new solanaWeb3.Connection("https://solana-api.syndica.io/access-token/WPoEqWQ2auQQY1zHRNGJyRBkvfOLqw58FqYucdYtmy8q9Z84MBWwqtfVf8jKhcFh/rpc", "confirmed");
		let ownedBool = await getTokenAccounts(publickey, connection);

		console.log(`RESULT: ${ownedBool}`);
		if (ownedBool === true) {
			console.log('TRUE - adding role');
			const rest = new REST({ version: "9" }).setToken(client.token)
			rest.put(Routes.guildMemberRole(discordGuildId, discordUserId, discordRoleId))
			status = 'success';
		}
	}

	return response.json({'status': status});
});

client.login(botAuthToken);
app.listen(port, () => console.log(`App listening at http://localhost:${port}`));