const xrpl = require("xrpl");
require("dotenv").config();
const Xrplclass = require("./xrplclass.js");
class Algo {
  constructor(xrplClass) {
    this.BotCurrentBid = 0;
    this.BotCurrentAsk = 0;
    this.BotBuySequence = 0;
    this.BotSellSequence = 0;
    this.xrplClass = xrplClass;
  }

  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async run() {
    //Get Orders
    let result = await this.xrplClass.getOrders();
    let offerObjArray = [];

    offerObjArray = this.PopulateCurrentOffersArray(result.offers);

    let bestBid = 0;
    let bestAsk = 0;
    let secondBestBid = 0;
    let secondBestAsk = 0;
    if (result.offers != undefined) {
      //Get best bid/ask and calculate spread
      let responseAsks = await this.xrplClass.getOrderBookAsks();
      if (responseAsks.offers.length > 0) {
        bestAsk = parseFloat(responseAsks.offers[0].quality).toFixed(12);
        secondBestAsk = parseFloat(responseAsks.offers[1].quality).toFixed(12);
      } else {
        //No Orders in books
        return;
      }

      let responseBids = await this.xrplClass.getOrderBookBids();
      if (responseBids.offers.length > 0) {
        bestBid = parseFloat((1 / responseBids.offers[0].quality)).toFixed(12);
        secondBestBid = parseFloat((1 / responseBids.offers[1].quality)).toFixed(12);
      } else {
        //No Orders in books
        return;
      }

      if (offerObjArray.length == 0) {
        let spread = this.calcPercentage(bestAsk, bestBid);
        if (spread - 1 < process.env.LOWEST_SPREAD_THRESHOLD) {
          //Our spread is too small. Exit
          console.log(
            "Failed to place any orders, spread is lower than minimum threshold. Current Spread: " +
              parseFloat(spread).toFixed(2)
          );
          return;
        }

        console.log("Attempting to Add Orders");
        this.addOrders(bestBid, bestAsk);
      }
      if (offerObjArray.length == 1) {
        console.log(
          "An Order Executed and filled. Resetting orders and position sizes"
        );
        //An Order Executed, lets reset orders and position sizing
        await this.xrplClass.cancelOrders(offerObjArray);

        console.log("Attempting to Add Orders");
        this.addOrders(bestBid, bestAsk);
      }
      if (offerObjArray.length == 2) {

        //Pre-populate our existing orders
        for(let j = 0; j < offerObjArray.length; j++)
        {
            if(typeof offerObjArray[j].taker_gets == "string")
            {
                this.BotBuySequence = offerObjArray[j].seq;
                this.BotCurrentBid = parseFloat((1 / offerObjArray[j].quality)).toFixed(12);
            } else if (typeof offerObjArray[j].taker_gets == "object")
            {
                this.BotSellSequence = offerObjArray[j].seq;
                this.BotCurrentAsk = parseFloat(offerObjArray[j].quality).toFixed(12);
            }
        }
        //Both Bid/Ask are in, check to make sure we're the best bid and ask
        if (this.BotCurrentBid < parseFloat(bestBid).toFixed(12)) {
          console.log("Current placed bid is less best...Attempting to replace");
          if (this.BotBuySequence != 0) {

            let spread = this.calcPercentage(bestAsk, bestBid);
            console.log(spread,process.env.LOWEST_SPREAD_THRESHOLD )
            if ((spread - 0.5) < process.env.LOWEST_SPREAD_THRESHOLD) {
              //Our spread is too small. Exit
              console.log(
                "Failed to replace any orders, spread threshold is too low. Spread: " +
                  parseFloat(spread).toFixed(2)
              );
              if(this.calcPercentage(this.BotCurrentBid, secondBestBid) > 1.5)
              {
                  //re-adjust our position
                  console.log('Re-adjusting our buy position')
                  await this.replaceBuyOrder(secondBestBid);
              } else if(this.calcPercentage(secondBestAsk, this.BotCurrentAsk) > 1.5)
              {
                  //re-adjust our position
                  console.log('Re-adjusting our sell position')
                  await this.replaceSellOrder(secondBestAsk);
              }
              return;
            }

            await this.replaceBuyOrder(bestBid);
          }
        }
        else if (this.BotCurrentAsk > parseFloat(bestAsk).toFixed(12)) {
            console.log("Current placed ask is less best...Attempting to replace");
            if (this.BotBuySequence != 0) {
  
              let spread = this.calcPercentage(bestAsk, bestBid);
              if ((spread - 0.5) < process.env.LOWEST_SPREAD_THRESHOLD) {
                //Our spread is too small. Exit
                console.log(
                  "Failed to replace any orders, spread threshold is too low. Spread: " +
                    parseFloat(spread).toFixed(2)
                );
                if(this.calcPercentage(this.BotCurrentBid, secondBestBid) > 1.5)
                {
                    //re-adjust our position
                    console.log('Re-adjusting our buy position')
                    await this.replaceBuyOrder(secondBestBid);
                } else if(this.calcPercentage(secondBestAsk, this.BotCurrentAsk) > 1.5)
                {
                    //re-adjust our position
                    console.log('Re-adjusting our sell position')
                    await this.replaceSellOrder(secondBestAsk);
                }
                return;
              }
  
              await this.replaceSellOrder(bestAsk);
            }
        }
        else if(this.calcPercentage(this.BotCurrentBid, secondBestBid) > 1.5)
        {
            //re-adjust our position
            console.log('Re-adjusting our buy position')
            await this.replaceBuyOrder(secondBestBid);
        } else if(this.calcPercentage(secondBestAsk, this.BotCurrentAsk) > 1.5)
        {
            //re-adjust our position
            console.log('Re-adjusting our sell position')
            await this.replaceSellOrder(secondBestAsk);
        } else {
          let spread = this.calcPercentage(bestAsk, bestBid);
          if (spread < process.env.LOWEST_SPREAD_THRESHOLD) {
            //Our spread is too small. Exit
            console.log(
              "Spread is too low, cancelling orders: " +
                parseFloat(spread).toFixed(2)
            );
            await this.xrplClass.cancelOrders(offerObjArray);
            return;
          }
        }

      }
      if (offerObjArray.length > 2) {
        //An Order Executed, lets reset orders and position sizing
        await this.xrplClass.cancelOrders(offerObjArray);
      }
    }
  }

  async replaceBuyOrder(bestBid) {
    let positionSize = await this.calculatePositionSizingBuy(bestBid);

    await this.xrplClass.addBuyOrder(
      positionSize.Buy.xrpAmount,
      positionSize.Buy.tokenAmount,
      this.BotBuySequence
    );
    this.BotCurrentBid = positionSize.Price.BidPrice;
  }

  async replaceSellOrder(bestAsk) {
    let positionSize = await this.calculatePositionSizingSell(bestAsk);

    await this.xrplClass.addSellOrder(
      positionSize.Sell.xrpAmount,
      positionSize.Sell.tokenAmount,
      this.BotSellSequence
    );
    this.BotCurrentAsk = positionSize.Price.AskPrice;
  }

  async addOrders(bestBid, bestAsk) {
    let positionSize = await this.calculatePositionSizing(bestBid, bestAsk);
    let buySequence = await this.xrplClass.addBuyOrder(
      positionSize.Buy.xrpAmount,
      positionSize.Buy.tokenAmount
    );
    await this.sleep(2000);
    let sellSequence = await this.xrplClass.addSellOrder(
      positionSize.Sell.xrpAmount,
      positionSize.Sell.tokenAmount
    );
    this.BotCurrentBid = positionSize.Price.BidPrice;
    this.BotCurrentAsk = positionSize.Price.AskPrice;
    this.BotBuySequence = buySequence;
    this.BotSellSequence = sellSequence;
  }

  convertOrderToXRPAmount(quality, type) {
    if (type == "ask") {
      return parseFloat(quality / 1000000).toFixed(12);
    }
    if (type == "bid") {
      return parseFloat(1 / (quality * 1000000)).toFixed(12);
    }
  }

  calcPercentage(ask, bid) {
    return ((ask - bid) / bid) * 100;
  }

  percentage(num, per) {
    return (num / 100) * per;
  }

  async calculatePositionSizing(bestBid, bestAsk) {
    //Get Account Info
    let availableXRPBalance = await this.xrplClass.getAvailableXrpBalance();
    let availableTokenBalance = await this.xrplClass.getAvailableTokenBalance();

    let positionBid = this.percentage(
      availableXRPBalance,
      process.env.POSITION_SIZE
    );
    let positionAsk = this.percentage(
      availableTokenBalance,
      process.env.POSITION_SIZE
    );

    //Create 1% less Spread
    let positionBidPrice = parseFloat(bestBid) + parseFloat(bestBid * 0.005);
    positionBidPrice = positionBidPrice.toFixed(12)

    let positionAskPrice = parseFloat(bestAsk) - parseFloat(bestAsk * 0.005);
    positionAskPrice = positionAskPrice.toFixed(12)

    return {
      Buy: {
        xrpAmount: Math.round(positionBid).toString(),
        tokenAmount: parseFloat(
          (positionBid / positionBidPrice).toFixed(6)
        ).toString(),
      },
      Sell: {
        tokenAmount: parseFloat(positionAsk.toFixed(6)).toString(),
        xrpAmount: Math.round(positionAsk * positionAskPrice).toString(),
      },
      Price: {
        BidPrice: Math.round(positionBid),
        AskPrice: Math.round(positionAsk * positionAskPrice),
      },
    };
  }

  async calculatePositionSizingBuy(bestBid) {
    //Get Account Info
    let availableXRPBalance = await this.xrplClass.getAvailableXrpBalance();

    let positionBid = this.percentage(
      availableXRPBalance,
      process.env.POSITION_SIZE
    );

    //Create 1% less Spread
    let positionBidPrice = parseFloat(bestBid) + parseFloat(bestBid * 0.005);
    positionBidPrice = positionBidPrice.toFixed(12)

    return {
      Buy: {
        xrpAmount: Math.round(positionBid).toString(),
        tokenAmount: parseFloat(
          (positionBid / positionBidPrice).toFixed(6)
        ).toString(),
      },
      Price: {
        BidPrice: Math.round(positionBid),
      },
    };
  }

  async calculatePositionSizingSell(bestAsk) {
    //Get Account Info
    let availableTokenBalance = await this.xrplClass.getAvailableTokenBalance();

    let positionAsk = this.percentage(
      availableTokenBalance,
      process.env.POSITION_SIZE
    );

    //Create 1% less Spread
    let positionAskPrice = parseFloat(bestAsk) - parseFloat(bestAsk * 0.005);
    positionAskPrice = positionAskPrice.toFixed(12)

    return {
      Sell: {
        tokenAmount: parseFloat(positionAsk.toFixed(6)).toString(),
        xrpAmount: Math.round(positionAsk * positionAskPrice).toString(),
      },
      Price: {
        AskPrice: Math.round(positionAsk * positionAskPrice),
      },
    };
  }

  PopulateCurrentOffersArray(offers)
  {
    let offerReturnObj = [];
    if (offers != undefined) {
        for(let j = 0; j < offers.length; j++)
        {
            if(typeof offers[j].taker_gets == "object")
            {
                if(offers[j].taker_gets.currency == process.env.CURRENCY)
                {
                    offerReturnObj.push(offers[j])
                }
            } else if(typeof offers[j].taker_pays == "object")
            {
                if(offers[j].taker_pays.currency == process.env.CURRENCY)
                {
                    offerReturnObj.push(offers[j])
                }
            }
        }
    }
    return offerReturnObj;
  }
}

module.exports = Algo;
