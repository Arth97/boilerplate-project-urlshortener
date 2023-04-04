require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

var mongo = require("mongodb");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var dns = require("dns");


// Basic Configuration
const port = process.env.PORT || 3000;
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });

var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {
  console.log("Conectao!");
});

var urlSchema = new mongoose.Schema({
  id: Number,
  url: String
});
var urlModel = mongoose.model("url", urlSchema);

app.post("/api/shorturl", function(req, res) {
  let urlInput = req.body.url.slice(0, req.body.url.lastIndexOf('/'));
  console.log("urlInput", urlInput)
  //let urlRegex = /https:\/\/www.|http:\/\/www./g;
  let urlRegex = /https:\/\/|https:\/\/www.|http:\/\/www./g;
  let newUrl = urlInput.replace(urlRegex, "")
  console.log("newUrl", newUrl)
  
  dns.lookup(newUrl, (err, address, family) => {
    console.log("err", err)
    console.log("address", address)
    console.log("family", family)
    if (err) {
      res.json({"error":"invalid URL"});
    } else {
      urlModel
        .find()
        .exec()
        .then(data => {
          new urlModel({
            id: data.length + 1,
            url: req.body.url
          })
            .save()
            .then(() => {
              res.json({
                original_url: req.body.url,
                short_url: data.length + 1
              });
            })
            .catch(err => {
              res.json(err);
            });
        });
    }
  });
});

//get
app.get("/api/shorturl/:number", function(req, res) {
  urlModel
    .find({ id: req.params.number })
    .exec()
    .then(url => {
      res.redirect(url[0]["url"]);
    });
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
