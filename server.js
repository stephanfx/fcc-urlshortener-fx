'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cors = require('cors');
var dns = require('dns');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI, {useNewUrlParser: true});

var Schema = mongoose.Schema;
var UrlSchema = new Schema({
  original_url: String,
  short_url: Number
});
var UrlModel = mongoose.model('Url', UrlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}))

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.post('/api/shorturl/new', function(req, res){
  // first a regex to get the hostname to do a dns lookup
  let regex = /^(?:https?:\/\/)?(?:www\.)?([^:\/]+)/;
  let hostname = req.body.url.match(regex);
  if (!hostname){
    res.send({error: 'Invalid URL'});
  }
  dns.lookup(hostname[1], function(err, data){
    if (err) {
      res.send({error: 'Invalid URL'});
    } else {
      // dns lookup succeeded, now we count the document collection and 
      // save the new document with an incremented counter
      UrlModel.countDocuments({}, function(err, countData){
        let count = countData + 1;
        var url = new UrlModel({original_url: req.body.url, short_url: count});
        url.save(function(err, data){
          console.log('err', err);
          console.log(data);
          res.send(data);
        });
      }); 
    }
  });
});

app.get('/api/shorturl/:shortId', function(req, res){
  UrlModel.findOne({short_url: req.params.shortId}, function(err, data){
    if (err) console.log(err);
    if (!data){
      res.send({'error': 'No data found'}); 
    } else {
      res.redirect(301, data.original_url);
    }
  });
  
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});