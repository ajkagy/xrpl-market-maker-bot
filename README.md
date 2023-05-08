# xrpl-market-maker-bot
a rough proof of concept market making bot for the XRPL dex

Steps to install
1. clone the repo
2. run npm i
3. Add the .env File with the following values below. Change the appropriate values to what currency on the XRPL dex you'd like to trade with.
4. run node bot.js

XRPL_RPC=wss://s1.ripple.com/

XRPL_ACCOUNT_ADDRESS=

XRPL_ACCOUNT_SECRET=

LOWEST_SPREAD_THRESHOLD=15

POSITION_SIZE=75

TXN_FEE=15

to run the script run `node cluster.js`
update the pairs.json file with each pair you want to market make

-need to add in spread definition for each individual pair