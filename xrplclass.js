const xrpl = require("xrpl");
const TransactionPayloads = require("./transactionPayloads.js");
require("dotenv").config();
class Xrplclass {

    sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    constructor(currency, issuer, spread) {
        this.transactionPayloads = new TransactionPayloads(currency, issuer);
        this.client = new xrpl.Client(process.env.XRPL_RPC);
        this.currency = currency;
        this.issuer = issuer;
        this.spread = spread;
    }

    async connect()
    {
        await this.client.connect();
    }

    async disconnect()
    {
        await this.client.disconnect();
    }

    async getOrders() {
        const response = await this.client.request({
          command: "account_offers",
          account: process.env.XRPL_ACCOUNT_ADDRESS
        });
        return response.result;
      }

    async getOrderBookBids()
    {
        const response = await this.client.request(this.transactionPayloads.GetBidBook());
        return response.result;
    }

    async getOrderBookAsks()
    {
        const response = await this.client.request(this.transactionPayloads.GetAskBook());
        return response.result;
    }

    async getAvailableXrpBalance() {
        const response = await this.client.request({
          command: "account_info",
          account: process.env.XRPL_ACCOUNT_ADDRESS,
          ledger_index: "validated",
        });
        return response.result.account_data.Balance - 10000000;
      }

    async getAvailableTokenBalance() {
        const response = await this.client.request({
          command: "account_lines",
          account: process.env.XRPL_ACCOUNT_ADDRESS
        });
        console.log('currency: ', this.currency)
        console.log('issuer: ', this.issuer)
        if(response.result.lines.length > 0)
        {
            for(let i = 0; i < response.result.lines.length; i++)
            {
                if(response.result.lines[i].currency == this.currency && response.result.lines[i].account == this.issuer)
                {
                    return response.result.lines[i].balance;
                }
            }
        } else {
            //No Account Lines
            return 0;
        }
        console.log('line 73: ',response)
        return response.result.account_data.Balance - 10000000;
      }

    async addBuyOrder(xrpAmount, currencyAmount, sequence = 0) {
        let txn = this.transactionPayloads.OfferCreateBuyPayload(xrpAmount, currencyAmount);
        if(sequence != 0)
        {
            txn.OfferSequence = sequence; 
        }
        let prepared = await this.signandautofill(txn, this.client)
        const pay_result = await this.client.submitAndWait(prepared.tx_blob)
        return pay_result.result.Sequence;
    }

    async addSellOrder(xrpAmount, currencyAmount, sequence = 0) {
        let txn = this.transactionPayloads.OfferCreateSellPayload(xrpAmount, currencyAmount);
        if(sequence != 0)
        {
            txn.OfferSequence = sequence; 
        }
        let prepared = await this.signandautofill(txn, this.client)
        const pay_result = await this.client.submitAndWait(prepared.tx_blob)
        return pay_result.result.Sequence;
    }

    async cancelOrders(offers) {
        for(let i = 0; i< offers.length; i++)
        {
            let txn = this.transactionPayloads.OfferCancelPayload(offers[i].seq);
            let prepared = await this.signandautofill(txn, this.client)
            let pay_result = await this.client.submitAndWait(prepared.tx_blob)
            await this.sleep(3000);
        }
    }

    async signandautofill(transaction, client)
    {
        let wallet = xrpl.Wallet.fromSeed(process.env.XRPL_ACCOUNT_SECRET);
        const pay_prepared = await this.client.autofill(transaction)
        let signedMessage = await wallet.sign(pay_prepared);
        return signedMessage;
    }

}

module.exports = Xrplclass;