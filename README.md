# Solana-Based-Discord-Roles
This is a proof of concept demonstrating the ability to assign a role to a Discord user based on ownership of a Solana SFT/NFT.

## Data flow
The point of entry is a web application since that allows communication to Discord, Solana, and most Solana wallet interfaces.

The user clicks a link which redirects to Discord's OAuth2 endpoint. This endpoint requires a unique Discord application Client ID to associate the login event with the appropriate application. This URL also includes a "scope" parameter, which defines the permissions that the authenticated user will grant to this application.
To verify the user, this application *ONLY* needs the "identify" permission. Anything more exposes your user to unnecessary risk.

Discord handles the user's login attempt and returns two pieces of data to the client-side web application - access_token and token_type.

After logging in to Discord, the client-side web application initiates a request for the user to sign a message with their Solana account. This is an off-chain transaction which we will use as proof that the user is the owner of the specified Solana account.

The Discord access_token and token_type along with the message signed by the Solana account are then passed to the web application server.


#### Server-side
This Discord access_token and token_type allows our server-side application to interact with Discord on behalf of the user within the confines of the "scope" defined in the login request.
In the case of the "identify" scope, this interaction is restricted to retrieving minimal data about the authenticated user - id, username, discriminator, avatar, locale, etc.
This token is used to retrieve the Discord User ID of the authenticated user.

The signed message is validated using the TweetNaCl library, which validates that the user owns the specified Solana account.

If the signed message is valid, the server-side application queries Solana to check if the validated Solana account owns a specific SFT/NFT. If so, the server-side application communicates with the Discord REST API to add the specified role to the validated Discord user.


## Setup
##### index.html
Update the href value of the login anchor tag to include your Discord application's Client ID (found on the Discord Developer Portal under Applications > [App] > OAuth2 > General > Client information).

##### index.js
Set botAuthToken to your Discord bot's authentication token (found on the Discord Developer Portal under Applications > [App] > Bot > TOKEN). NOTE: this is different from the Client ID)
Set discordGuildId to the numerical ID for your Discord server.
Set discordRoleId to the numerical ID for the Discord role that you wish to assign.
Set membershipTokenAddr to the Solana SPL Token Address of the SFT/NFT for which you wish to check ownership.
Set unsignedMessage to the message that you wish the user to sign. This is a simple text string.

##### dashboard.html
Set unsignedMessage to THE SAME string as configured in index.js.
