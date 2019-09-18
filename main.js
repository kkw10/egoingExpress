const express = require('express');
const app = express();
const fs = require('fs');
const qs = require('querystring');
const template = require('./lib/template');
const path = require('path');
const sanitizeHtml = require('sanitize-html');

app.get('/', (req, res) => {
  fs.readdir('./data', function(error, filelist){
    let title = 'Welcome';
    let description = 'Hello, Node.js';
    let list = template.list(filelist);
    let html = template.HTML(title, list,
      `<h2>${title}</h2>${description}`,
      `<a href="/create">create</a>`
    );

    res.send(html)
  })
})

app.get('/create', (req, res) => {
  fs.readdir('./data', function(error, filelist){
    let title = 'WEB - create';
    let list = template.list(filelist);
    let html = template.HTML(title, list, `
      <form action="/create_process" method="post">
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
  });
})

app.post('/create_process', (req, res) => {
  let body = '';
  req.on('data', function(data){
      body = body + data;
  });
  req.on('end', function(){
      let post = qs.parse(body);
      let title = post.title;
      let description = post.description;
      fs.writeFile(`data/${title}`, description, 'utf8', function(err){
        res.writeHead(302, {Location: `/page/${title}`});
        res.end();
      })
  });
})

app.get('/update/:pageID', (req, res) => {
  fs.readdir('./data', function(error, filelist){
    let filteredId = path.parse(req.params.pageID).base;
    fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
      let title = req.params.pageID;
      let list = template.list(filelist);
      let html = template.HTML(title, list,
        `
        <form action="/update_process" method="post">
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
        `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
      );
        res.send(html)
    });
  });
})

app.post('/update_process', (req, res) => {
  let body = '';
  req.on('data', function(data){
      body = body + data;
  });
  req.on('end', function(){
      let post = qs.parse(body);
      let id = post.id;
      let title = post.title;
      let description = post.description;
      fs.rename(`data/${id}`, `data/${title}`, function(error){
        fs.writeFile(`data/${title}`, description, 'utf8', function(err){
          res.redirect(`/?id=${title}`)
        })
      });
  });
})

app.post('/delete_process', (req, res) => {
  let body = '';
  req.on('data', function(data){
      body = body + data;
  });
  req.on('end', function(){
      let post = qs.parse(body);
      let id = post.id;
      let filteredId = path.parse(id).base;
      fs.unlink(`data/${filteredId}`, function(error){
        res.redirect('/')
      })
  });
})

app.get('/page/:pageID', (req, res) => {
  fs.readdir('./data', function(error, filelist){
    let filteredId = path.parse(req.params.pageID).base;
    fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
      let title = req.params.pageID;
      let sanitizedTitle = sanitizeHtml(title);
      let sanitizedDescription = sanitizeHtml(description, {
        allowedTags:['h1']
      });
      let list = template.list(filelist);
      let html = template.HTML(sanitizedTitle, list,
        `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
        ` <a href="/create">create</a>
          <a href="/update/${sanitizedTitle}">update</a>
          <form action="/delete_process" method="post">
            <input type="hidden" name="id" value="${sanitizedTitle}">
            <input type="submit" value="delete">
          </form>`
      );
      res.send(html)
    });
  });
})

app.listen(3000, () => {
  console.log('Server is running...')
})

