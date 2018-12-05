/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var fetch = require('node-fetch');

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res){
      const stock=req.query.stock;
      const like=req.query.like;
      
      if(!Array.isArray(stock)){
        const url='https://api.iextrading.com/1.0/stock/'+stock+'/price'
        fetch(url)
          .then(function(response) {
            return response.text();
          })
          .then(function(text) {
            if(text==='Unknown symbol'){
              res.json('Unknown symbol');
              return;
            }
            const likes=0;
            console.log(text);
            res.json({stockdata: {stock: stock, price: text, likes: likes}});
          })
          .catch(function(error) {
            console.log(error);
          });
      } else {
        const urls=['https://api.iextrading.com/1.0/stock/'+stock[0]+'/price', 'https://api.iextrading.com/1.0/stock/'+stock[1]+'/price'];
        const promises=urls.map(url => fetch(url).then(response => response.text()).then(text=>text));
        Promise.all(promises)
          .then(function(prices) {
            let likes=[];
            res.json({stockdata: [{stock: stock[0], price: prices[0], likes: likes[0]}, {stock: stock[1], price: prices[1], likes: likes[1]}]});
          })
      }
    });
    
};
