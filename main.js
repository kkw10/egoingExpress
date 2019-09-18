const express = require('express');
const app = express();
const fs = require('fs');
const template = require('./lib/template');
const bodyParser = require('body-parser');
const compression = require('compression');
const indexRouter= require('./routes/index');
const topicRouter = require('./routes/topic');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression());

app.get('*', (req, res, next) => {
  fs.readdir('./data', function(error, filelist) {
    req.list = filelist;
    next();
  })
})

app.use('/', indexRouter)
app.use('/topic', topicRouter)

app.use((req, res, next) => {
  res.status(404).send("404 not found...")
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send("Somthing broke...")
})

app.listen(3000, () => {
  console.log('Server is running...')
})

