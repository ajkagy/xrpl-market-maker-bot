const xrpl = require("xrpl");
require("dotenv").config();
const Algo = require("./algo.js");
const Xrplclass = require("./xrplclass.js");

async function main(currency, issuer) {
  var xrplClass = new Xrplclass(currency, issuer);
    try { 
        await xrplClass.connect();
        await runMain(xrplClass, currency, issuer);

        setInterval(async function() {
            await runMain(xrplClass, currency, issuer);
          }, 45000);

    } catch (err) {
      console.error(err);
    }
  }

async function runMain(xrplClass, currency, issuer)
{
    try{
        console.log(currency,  issuer)
        let algo = new Algo(xrplClass, currency, issuer);
        console.log("xrpl_Adam's Market Maker Bot...Running");
        await algo.run();
    } catch(err)
    {
        console.log(err)
    }
}


module.exports = main;