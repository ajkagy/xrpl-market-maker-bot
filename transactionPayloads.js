require("dotenv").config();
class TransactionPayloads {

    constructor(currency, issuer) {
        this.currency = currency;
        this.issuer = issuer;
    }

OfferCancelPayload(offerSequence)
{
    return {
        "TransactionType": "OfferCancel",
        "Account": process.env.XRPL_ACCOUNT_ADDRESS,
        "Fee": process.env.TXN_FEE,
        "Flags": 0,
        "OfferSequence": offerSequence
    }
}

OfferCreateBuyPayload(xrpAmount, currencyAmount) {
    return {
        "TransactionType": "OfferCreate",
        "Account": process.env.XRPL_ACCOUNT_ADDRESS,
        "Fee": process.env.TXN_FEE,
        "Flags": 0,
        "TakerGets": xrpAmount,
        "TakerPays": {
          "currency": this.currency,
          "issuer": this.issuer,
          "value": currencyAmount
        }
    };
  } 

OfferCreateSellPayload(xrpAmount, currencyAmount) {
    return {
        "TransactionType": "OfferCreate",
        "Account": process.env.XRPL_ACCOUNT_ADDRESS,
        "Fee": process.env.TXN_FEE,
        "Flags": 0,
        "TakerGets": {
            "currency": this.currency,
            "issuer": this.issuer,
            "value": currencyAmount
          },
        "TakerPays": xrpAmount
    };
  }

    GetAskBook()
    {
        return {
            "command": "book_offers",
            "taker_gets": {
            "currency": this.currency,
            "issuer": this.issuer
            },
            "taker_pays": {
            "currency": "XRP"
            },
            "limit": 2
        }
    }

    GetBidBook()
    {
        return {
            "command": "book_offers",
            "taker_gets": {
                "currency": "XRP"
            },
            "taker_pays": {
            "currency": this.currency,
            "issuer": this.issuer
            },
            "limit": 2
        }
    }
} 

module.exports = TransactionPayloads;