var createError = require('http-errors');
const { buildSetup,startCreating } =require('./src/main');

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const basePath = process.cwd();
const fs = require('fs');
const multer = require('multer');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/uploads')));
// Where fileName is name of the file and response is Node.js Reponse. 
responseFile = (fileName, response) => {
  const filePath = "./output.zip"; // or any file format

  // Check if file specified by the filePath exists
  fs.exists(filePath, function (exists) {
      if (exists) {
          // Content-type is very interesting part that guarantee that
          // Web browser will handle response in an appropriate manner.
          response.writeHead(200, {
              "Content-Type": "application/octet-stream",
              "Content-Disposition": "attachment; filename=" + fileName
          });
          fs.createReadStream(filePath).pipe(response);
          return;
      }
      response.writeHead(400, { "Content-Type": "text/plain" });
      response.end("ERROR File does not exist");
  });
}
const storage = multer.diskStorage({
destination: (req, file, cb) => {
  

// console.log(req.body.la)
 const {layer} = req.body;
  const dir = `./layers/${layer}`
  fs.exists(dir, exist => {
    if(exist) {
    fs.rm(dir,{recursive:true},err => {})}
  if (!exist) {
    return fs.mkdir(dir, error => cb(null, dir))
  }
  return cb(null, dir)
  })
},
filename: (req, file, cb) => {
  const { layer } = req.body
  cb(null,`${file.originalname}`)
}
})

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png/
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = filetypes.test(file.mimetype)

  if (extname && mimetype) {
    return cb(null, true)
  } else {
    cb('Images only!')
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb)
  },
})


app.post('/uploads',  upload.array('images'), (req, res,err) => {

  
  console.log('yes')
  console.log(req.body)
  res.send(req.body)
  if(err)
  {
    console.log(err)
  }
})
app.post('/', function(req,res,err){
  if(req.body)
  {
  
    process.env.NAME=req.body.name;
    process.env.QUANTITY=req.body.quantity;
    process.env.DESCRIPTION=req.body.description;
    var layerorder = req.body.layerorder
    console.log(layerorder)
    console.log(layerorder,req.body.name,req.body.quantity)
    buildSetup()

    startCreating(layerorder)
    responseFile('out',res)
    
    
  }
  
}
);
app.get('/', function(req,res,err){

  const testFolder = './layers/';
  const fs = require('fs');
  var arr=[];
  fs.readdirSync(testFolder).forEach(file => {
    arr.push(file)
    console.log(file)
  });
  res.send(arr)
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
