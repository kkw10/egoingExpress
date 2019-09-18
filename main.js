const express = require('express');
const app = express();
const fs = require('fs');
const qs = require('querystring');
const template = require('./lib/template');
const path = require('path');
const sanitizeHtml = require('sanitize-html');
const bodyParser = require('body-parser');
const compression = require('compression');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression());

app.get('*', (req, res, next) => {
  fs.readdir('./data', function(error, filelist) {
    req.list = filelist;
    next();
  })
})

app.get('/', (req, res) => {
  let title = 'Welcome';
  let description = 'Hello, Node.js';
  let list = template.list(req.list);
  let html = template.HTML(title, list,
    `<h2>${title}</h2>${description}
     <img src="/images/room.jpg" style="width:500px; display:block; margin-top:10px" />
    `,
    `<a href="/topic/create">create</a>`
  );

  res.send(html)
})

app.get('/topic/create', (req, res) => {
  let title = 'WEB - create';
  let list = template.list(req.list);
  let html = template.HTML(title, list, `
    <form action="/topic/create_process" method="post">
      <p><input type="text" name="title" placeholder="title"></p>
      <p>
        <textarea name="description" placeholder="description"></textarea>
      </p>
      <p>
        <input type="submit">
      </p>
    </form>
  `, '');
  res.send(html);
})

app.post('/topic/create_process', (req, res) => {
  let post = req.body;
  let title = post.title;
  let description = post.description;
  fs.writeFile(`data/${title}`, description, 'utf8', function(err){
    res.redirect(`/topic/${title}`)
  })  
})

app.get('/topic/update/:pageID', (req, res) => {
  let filteredId = path.parse(req.params.pageID).base;
  fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
    let title = req.params.pageID;
    let list = template.list(req.list);
    let html = template.HTML(title, list,
      `
      <form action="/topic/update_process" method="post">
        <input type="hidden" name="id" value="${title}">
        <p><input type="text" name="title" placeholder="title" value="${title}"></p>
        <p>
          <textarea name="description" placeholder="description">${description}</textarea>
        </p>
        <p>
          <input type="submit">
        </p>
      </form>
      `,
      `<a href="/topic/create">create</a> <a href="/topic/update/${title}">update</a>`
    );
      res.send(html)
  });
})

app.post('/topic/update_process', (req, res) => {
  let post = req.body;
  let id = post.id;
  let title = post.title;
  let description = post.description;
  fs.rename(`data/${id}`, `data/${title}`, function(error){
    fs.writeFile(`data/${title}`, description, 'utf8', function(err){
      res.redirect(`/topic/${title}`)
    })
  });
})

app.post('/topic/delete_process', (req, res) => {
  let post = req.body;
  let id = post.id;
  let filteredId = path.parse(id).base;
  fs.unlink(`data/${filteredId}`, function(error){
    res.redirect('/')
  })
})

app.get('/topic/:pageID', (req, res, next) => {
  fs.readdir('./data', function(err, filelist){
    let filteredId = path.parse(req.params.pageID).base;
    fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
      if(!err) {
        let title = req.params.pageID;
        let sanitizedTitle = sanitizeHtml(title);
        let sanitizedDescription = sanitizeHtml(description, {
          allowedTags:['h1']
        });
        let list = template.list(filelist);
        let html = template.HTML(sanitizedTitle, list,
          `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
          ` <a href="/topic/create">create</a>
            <a href="/topic/update/${sanitizedTitle}">update</a>
            <form action="/topic/delete_process" method="post">
              <input type="hidden" name="id" value="${sanitizedTitle}">
              <input type="submit" value="delete">
            </form>`
        );
        res.send(html)
      } else {
        next(err)
      }
    });
  });
})


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

