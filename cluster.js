var cluster = require("cluster");
var numPairs = require("./pairs.json").length;
var getPair = require("./pairs");

if (cluster.isMaster) {
  var workers = {};
  for (var i = 0; i < numPairs; i++) {
    var worker = cluster.fork({ PAIR_INDEX: i });
    workers[worker.process.pid] = i;
  }
  console.log("Total number of pairs found: " + numPairs);

  cluster.on("exit", function (worker, code, signal) {
    console.log("worker " + worker.process.pid + " died");
    var index = workers[worker.process.pid];
    delete workers[worker.process.pid];
    var newWorker = cluster.fork({ PAIR_INDEX: index });
    workers[newWorker.process.pid] = index;
  });
} else {
  var pairIndex = process.env.PAIR_INDEX;
  var pair = getPair(pairIndex);
  var currency = pair.currency;
  var issuer = pair.currency_issuer;
  require("./bot.js")(currency, issuer, spread)
}
