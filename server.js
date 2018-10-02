"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var cors = require("cors");
var urlExists = require("url-exists-deep");
var Schema = mongoose.Schema;
//var autoIncrement = require('mongoose-auto-increment');

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/*************************************************************************/

var urlSchema = new Schema({
	original_url: {
		type: String,
		minlength: 5,
		trim: true
	},
	short_url: {
		type: Number,
    default:0
	}
});

var UrlModel = mongoose.model("Url", urlSchema);

var connection=mongoose.connect(process.env.MONGOLAB_URI);

/*************************************************************************/

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded());

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function(req, res) {
	res.sendFile(process.cwd() + "/views/index.html");
});

// your first API endpoint...
app.get("/api/hello", function(req, res) {
	res.json({ greeting: "hello API" });
});

/*************************************************************************/

app.post("/api/shorturl/new", function(req, res) {
  
	var original_url = req.body.url;
	var error = "invalid URL";

	  urlExists(original_url).then(function(response) {
    
          UrlModel.findOne({ original_url }).then((data_exists) => {

                      if (!data_exists)
                      {
                            UrlModel.find().sort('-short_url').limit(1).then(function(biggest_url){
                              
                                let short_url=biggest_url[0].short_url+1;
                                UrlModel.create({ original_url , short_url}).then((result) =>res.json({original_url: result.original_url,short_url: result.short_url})).catch((e) => res.json({ error: "Database error."}));
                              
                            }).catch((e) => UrlModel.create({ original_url }).then((result) =>res.json({original_url: result.original_url,short_url: result.short_url})).catch((e) => res.json({ error: "Database error."})))
                      }            
                      else res.json({error: "Short Url already exists",short_url: data_exists.short_url});
            

          }).catch((e) => res.json({ error: "Database error." }));
    
		}).catch((e) => res.json({ error }));
    
});

/***********************************************************************/

app.all("/api/shorturl/:short_url?", function(req, res) {
  
	var short_url = req.params.short_url;

	UrlModel.findOne({ short_url }).then(
		(result) => {
			if (!result) {
				res.json({ error: "No Url in database" });
			} else {
				res.redirect(301, result.original_url);
			}
		},
		(e) => res.json({ error: "Database error." })
	);
});

/*************************************************************************/

app.listen(port, function() {
	console.log("Node.js listening ...");
});
