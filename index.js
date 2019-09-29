var express = require("express");
var multer = require("multer");
var bodyParser = require("body-parser");
var path = require("path");
var nodemailer = require("nodemailer");
var mongoose = require("mongoose");
var ejs = require("ejs");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
mongoose.connect("mongodb://localhost/intern", { useNewUrlParser: true });
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function callback() {
  console.log("connected to db sucessfully");
});
var reff;
var Schema = mongoose.Schema;
var userSchema = new Schema({
  _id: { type: String }, //username PK
  password: { type: String },
  ussername: { type: String },
  date: { type: Date },
  idd: { type: String },
  code: { type: String },
  urls: { type: Array }
});
var user = mongoose.model("requests", userSchema);

var app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded());
app.use(express.json());

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    let name = file.originalname.substring(
      0,
      file.originalname.lastIndexOf(".") + 1
    );
    cb(null, name + "-" + Date.now() + path.extname(file.originalname));
  }
});
var upload = multer({ storage: storage });

// API for Signup
app.get("/api/signup/:usernamee/:passwordd", function(req, res) {
  var username = req.params.usernamee;
  var password = req.params.passwordd;
  user.find({ _id: username }).exec(function(err, docs) {
    if (docs.length) {
      console.log("Name exists already");
      res.send("USERNAME ALREADY EXISTS");
    } else {
      //INSERT-------------------------------------
      var ObjectID = require("mongodb").ObjectID;
      var user = {
        _id: username,
        password: password,
        created_at: Date(),
        idd: new ObjectID()
      };
      db.collection("requests").insertOne(user);
      res.send("SIGN UP SUCESSFULL");
      //-----------------------------------------
    }
  });
});

//API for login
app.get("/api/login/:usernameee/:passworddd", function(req, res) {
  var iusername = req.params.usernameee;
  var ipassword = req.params.passworddd;
  console.log("iusername:" + iusername);
  console.log("ipassword:" + ipassword);
  user.find({ _id: iusername }, function(err, docs) {
    if (docs[0].password === ipassword) {
      res.send("LOGIN SUCESSFULL, " + iusername);
    } else {
      res.send("LOGIN UN-SUCESSFULL");
    }
  });
  
  //API to upload media
  app.get("/api/media/upload", function(req, res) {
    res.render("uploads");
  });

  //Uploading
  app.post("/upload", function(req, res) {
    var upload = multer({
      storage: storage,
      limits: { fileSize: 100000000 }
    }).single("myImage");
    upload(req, res, function(err) {
      if (err) {
        console.log(err);
        res.send("UPLOAD UN-SUCESSFUL");
      } else {
        var imagePath = "/uploads/" + req.file.filename;

        var updateee;
        user.find({ _id: iusername }, function(err, docs) {
          updateee = docs[0];
          updateee.urls.push(imagePath);
          user.findOneAndUpdate({ _id: iusername }, updateee, function(
            err,
            docs
          ) {});

          res.end("PATH = " + imagePath);
        });
      }
    });
    var x;
    var linkss;
    user.find({ _id: iusername }, function(err, docs) {
      x = docs[0].urls;
      linkss = JSON.stringify(x);
      console.log(linkss);
    });
  });
  
  //API to get all uploaded media links
  app.get("/api/getallmedia", function(req, res) {
    var x;
    var linkss;
    user.find({ _id: iusername }, function(err, docs) {
      x = docs[0].urls;
    });
    app.get("/api/getallmediaa", function(req, res) {
      res.json(x);
    });
    res.redirect("/api/getallmediaa");
  });
});

//API for forgot password (sending mail)
app.get("/api/forgot/:usernameeee/:passwordddd", function(req, res) {
  var iiusername = req.params.usernameeee;
  var iipassword = req.params.passwordddd;
  user.find({ _id: iiusername }, function(err, docs) {
    var updatee;
    var recoverycode = "12ed"; // a sample code taken can be made random
    user.find({ _id: iiusername }, function(err, docs) {
      updatee = docs[0];
      updatee.code = recoverycode;
      user.findOneAndUpdate({ _id: iiusername }, updatee, function(
        err,
        docs
      ) {});
      res.send("PASSWORD RESET CODE SENT");
    });
    //sendgrid api giving some issue , due to maintenance, rest all funcionalities are working the secret code
    //=================================================================================
    // const msg = {
    //   to: "kartikag1@yahoo.com",
    //   from: "kartikag1@yahoo.com",
    //   subject: "Sending with Twilio SendGrid is Fun",
    //   text: "and easy to do anywhere, even with Node.js",
    //   html: "<strong>and easy to do anywhere, even with Node.js</strong>"
    // };
    // sgMail.send(msg);
    //==================================================================================
  });
});

//API to verify sent code and change the password to the new one 
app.get("/api/verify/:usernameeee/:passwordddd/:code/:newpass", function(
  req,
  res
) {
  var veriusername = req.params.usernameeee;
  var veripassword = req.params.passwordddd;
  var update;
  user.find({ _id: veriusername }, function(err, docs) {
    update = docs[0];
    update.password = req.params.newpass;
    if (docs[0].code === req.params.code) {
      user.findOneAndUpdate({ _id: veriusername }, update, function(
        err,
        docs
      ) {});
      res.send("PASSWORD UPDATED");
    } else {
      res.send("PASSWORD NOT UPDATED");
    }
  });
});

app.listen(5000);
