const xrpl = require("xrpl");
require("dotenv").config();
const Algo = require("./algo.js");
const Xrplclass = require("./xrplclass.js");

async function main() {
  var xrplClass = new Xrplclass();
    try { 
        await xrplClass.connect();
        await runMain(xrplClass);

        setInterval(async function() {
            await runMain(xrplClass);
          }, 45000);

    } catch (err) {
      console.error(err);
    }
  }

async function runMain(xrplClass)
{
    try{
        let algo = new Algo(xrplClass);
        console.log("xrpl_Adam's Market Maker Bot...Running");
        await algo.run();
    } catch(err)
    {
        console.log(err)
    }
}


  main();