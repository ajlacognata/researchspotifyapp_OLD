const fs = require('fs');
var express = require('express');



app.get('/readCounter', function(req, res) {

    fs.readFile('counter.txt', 'utf8' , (err, data) => {
    if (err) {
      console.error(err)
      return
    }
    console.log(data)
  })
  res.render('callback.html',{counter:data});
  });
