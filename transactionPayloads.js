require("dotenv").config();
class TransactionPayloads {


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
          "currency": process.env.CURRENCY,
          "issuer": process.env.CURRENCY_ISSUER,
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
            "currency": process.env.CURRENCY,
            "issuer": process.env.CURRENCY_ISSUER,
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
            "currency": process.env.CURRENCY,
            "issuer": process.env.CURRENCY_ISSUER
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
            "currency": process.env.CURRENCY,
            "issuer": process.env.CURRENCY_ISSUER
            },
            "limit": 2
        }
    }
} 

module.exports = TransactionPayloads;