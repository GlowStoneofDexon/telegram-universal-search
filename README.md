# Telegram Universal Search

Create a @connector:telegram:"Telegram" Search bot using this bot. Using this bot, users shoulf be able to search accross inside @connector:telegram:"Telegram" With catagory (Channels, Chats, Groups, Files, Videos, Audios)



Bot Name: "Comb Search Bot" or @CombSearchBot (in @connector:telegram:"Telegram") 







PROJECT ARCHITECTURAL CONTEXT & REQUIREMENTS



1. Bot Type & Purpose:

We are building a 100% free, completely stateless (database-less) Telegram Universal Search engine. 

The system must allow users to input a keyword query, search the entire global Telegram network in real-time, and return matching public messages, channels, and groups on-the-fly.



2. API Protocol (Bypassing Standard Bot API):

- We are NOT using the standard Telegram Bot API (HTTP-based) because it is strictly restricted from searching global Telegram indices.

- Instead, we are using the official Telegram MTProto Client API via a Node.js client library like 'telegram' (GramJS).

- This allows our backend engine to act as a user-level client session that can natively execute universal network searches directly on Telegram's servers.



3. Authentication & Secrets Handling:

- The system connects to Telegram using developer credentials obtained from my.telegram.org.

- Secure Coding Practice: The 'App api_id' and 'App api_hash' must NEVER be hardcoded. 

- The application must read them exclusively at runtime from environment variables: process.env.TELEGRAM_API_ID and process.env.TELEGRAM_API_HASH.



4. Search Execution Logic:

- When a search query is triggered, invoke the native Telegram API method: Api.messages.SearchGlobal.

- Configure the request payload with a limit of 10 results and an empty message filter (Api.InputMessagesFilterEmpty).

- Capture the API response, extract the public channel names, usernames, and relevant text snippets.



5. Data Architecture:

- Zero Databases: The application must remain entirely database-free. No SQLite, PostgreSQL, MongoDB, or local file storage.

- It must function as a pure pass-through engine: accept the query, fetch from Telegram's MTProto API, format the JSON data, and instantly return it to the user.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/363e6eb5-3b2f-4c66-a093-e8d9acff5489).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
