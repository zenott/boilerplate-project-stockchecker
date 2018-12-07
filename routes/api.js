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
  return MongoClient.connect(CONNECTION_STRING).catch(err => console.error(err));
}

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res){
      let stock=req.query.stock;
      const like=req.query.like;
      const ip=req.ip;
      
      if(!Array.isArray(stock)){
        const url='https://api.iextrading.com/1.0/stock/'+stock+'/price'
        const text = await fetch(url).then(response => response.text()).catch(err => console.error(err));
        if(text==='Unknown symbol'){
          res.json('Unknown symbol');
          return;
        }
        const db= await dbConn();
        if(like===true || like==="true") {
          let updObj={$inc: {likes : 1}, $addToSet: {ips: ip}};
          let upsert=true;
          const find= await db.collection('likes').findOne({stock: stock, ips: ip}).catch(err => console.error(err));
          if(find){
            updObj={$set: {stock: stock}};
            upsert=false;
          }
          const doc = await db.collection('likes').findOneAndUpdate({stock: stock}, updObj, {upsert: upsert, returnOriginal: false}).catch(err => console.error(err));
          res.json({stockData: {stock: stock.toUpperCase(), price: Number(text), likes: (doc.value) ? doc.value.likes : 0}});

        } else {
          const doc = await db.collection('likes').findOne({stock: stock}).catch(err => console.error(err));
          res.json({stockData: {stock: stock.toUpperCase(), price: Number(text), likes: (doc) ? doc.likes : 0}});
        }
              
            
          
          
      } else {
        stock=stock.slice(0,2);
        const urls=stock.map(stockEle => 'https://api.iextrading.com/1.0/stock/'+stockEle+'/price');
        const promises=urls.map(url => fetch(url).then(response => response.text()).then(text=>text).catch(err => console.error(err)));
        const prices = await Promise.all(promises);
        const db = await dbConn();
        if(like===true || like==="true"){
          const docArr = await Promise.all(stock.map(async (stockEle) => {
            let updObj={$inc: {likes : 1}, $addToSet: {ips: ip}};
            let upsert=true;
            const find= await db.collection('likes').findOne({stock: stockEle, ips: ip}).catch(err => console.error(err));
            if(find){
              updObj={$set: {stock: stockEle}};
              upsert=false;
            }
            const doc = await db.collection('likes').findOneAndUpdate({stock: stockEle}, updObj, {upsert: upsert, returnOriginal: false}).catch(err => console.error(err));
            return doc.value;
          }));
          res.json({stockData: [{stock: stock[0].toUpperCase(), price: Number(prices[0]), likes: docArr[0].likes-docArr[1].likes}, {stock: stock[1].toUpperCase(), price: Number(prices[1]), likes: docArr[1].likes-docArr[0].likes}]});
        } else {
          const docArr = await Promise.all(stock.map(stockEle => db.collection('likes').findOne({stock: stockEle}))).catch(err => console.error(err));
          let likes=[0, 0];
          if(docArr[0]) likes[0] = docArr[0].likes;
          if(docArr[1]) likes[1] = docArr[1].likes;
          res.json({stockData: [{stock: stock[0].toUpperCase(), price: Number(prices[0]), likes: likes[0]-likes[1]}, {stock: stock[1].toUpperCase(), price: Number(prices[1]), likes: likes[1]-likes[0]}]});
        }
      }
    });
    
};
