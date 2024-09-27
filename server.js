// Većina koda u server.js je preuzeta sa predavanja i prilagođena za ovaj projekt.

const express = require("express");
const path = require("path");
const multer = require("multer");
const fse = require("fs-extra");
const httpPort = process.env.PORT || 10000;

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  console.log(new Date().toLocaleString() + " " + req.url);
  next();
});

app.use(express.static(path.join(__dirname)));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const UPLOAD_PATH = path.join(__dirname, "uploads");
var uploadSnaps = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, UPLOAD_PATH);
    },
    filename: function (req, file, cb) {
      let fn = file.originalname.replaceAll(":", "-");
      cb(null, fn);
    },
  }),
}).single("image");

app.post("/saveSnap", function (req, res) {
  uploadSnaps(req, res, async function (err) {
    if (err) {
      //console.log(err);
      res.json({
        success: false,
        error: {
          message: "Upload failed:: " + JSON.stringify(err),
        },
      });
    } else {
      console.log(req.body);
      res.json({ success: true, id: req.body.id });
    }
  });
});
app.get("/snaps", function (req, res) {
  let files = fse.readdirSync(UPLOAD_PATH);
  files = files.reverse().slice(0, 10);
  console.log("In", UPLOAD_PATH, "there are", files);
  res.json({
    files,
  });
});

app.listen(httpPort, function () {
  console.log(`HTTP listening on: http://localhost:${httpPort}`);
});