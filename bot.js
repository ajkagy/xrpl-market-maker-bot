const xrpl = require("xrpl");
require("dotenv").config();
const Algo = require("./algo.js");
const Xrplclass = require("./xrplclass.js");

async function main(currency, issuer, spread) {
  var xrplClass = new Xrplclass(currency, issuer);
    try { 
        await xrplClass.connect();
        await runMain(xrplClass, currency, issuer, spread);

        setInterval(async function() {
            await runMain(xrplClass, currency, issuer, spread);
          }, 45000);

    } catch (err) {
      console.error(err);
    }
  }

async function runMain(xrplClass, currency, issuer, spread)
{
    try{
        console.log(currency, issuer, spread)
        let algo = new Algo(xrplClass, currency, issuer);
        console.log("xrpl_Adam's Market Maker Bot...Running");
        await algo.run();
    } catch(err)
    {
        console.log(err)
    }
}


module.exports = main;