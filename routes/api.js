/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const expect = require('chai').expect;
const MongoClient = require('mongodb');
const fetch = require('node-fetch');

const CONNECTION_STRING = process.env.DB;

function dbConn() {
  return MongoClient.connect(CONNECTION_STRING);
}

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res){
      const stock=req.query.stock;
      const like=req.query.like;
      const ip=req.ip;
      
      if(!Array.isArray(stock)){
        const url='https://api.iextrading.com/1.0/stock/'+stock+'/price'
        const text = await fetch(url).then(response => response.text());
        if(text==='Unknown symbol'){
          res.json('Unknown symbol');
          return;
        }
        const db= await dbConn();
        let updObj={$set: {stock: stock}};
        let upsert=false;
        if(like===true || like==="true") {
          updObj={$inc: {likes : 1}, $addToSet: {ips: ip}};
          upsert=true;
          const find= await db.collection('likes').findOne({stock: stock, ips: ip});
          if(find){
            updObj={$set: {stock: stock}};
            upsert=false;
          }
          const doc = await db.collection('likes').findOneAndUpdate({stock: stock}, updObj, {upsert: upsert, returnOriginal: false});
          res.json({stockdata: {stock: stock, price: text, likes: (doc.value) ? doc.value.likes : 0}});

        } else {
          const doc = await db.collection('likes').findOneAndUpdate({stock: stock}, updObj, {upsert: upsert, returnOriginal: false});
          res.json({stockdata: {stock: stock, price: text, likes: (doc.value) ? doc.value.likes : 0}});
        }
              
            
          
          
      } else {
        const urls=['https://api.iextrading.com/1.0/stock/'+stock[0]+'/price', 'https://api.iextrading.com/1.0/stock/'+stock[1]+'/price'];
        const promises=urls.map(url => fetch(url).then(response => response.text()).then(text=>text).catch(err => console.error(err)));
        Promise.all(promises)
          .then(function(prices) {
            let likes=[0, 0];
            MongoClient.connect(CONNECTION_STRING)
              .then(db => {
                db.collection('likes').findOne({stock: stock[0], ips: ip})
                  .then(doc => {
                    if(doc){
                      
                    }
                  })
              })
            res.json({stockdata: [{stock: stock[0], price: prices[0], likes: likes[0]}, {stock: stock[1], price: prices[1], likes: likes[1]}]});
          })
      }
    });
    
};
