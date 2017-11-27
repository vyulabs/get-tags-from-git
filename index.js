const express = require('express');
const app = express();
const config = require('./config.json');
const importer = require('./importer');

app.post('/bitbucket_front_pushed', (req, res) => {
  importer(config).then(() => {
    res.send('Hello World!');
  }).catch(err => {
    if (err) {
      console.log(err);
    }
    res.send('Hello World!');
  });
});

app.listen(4000, () => console.log('Example app listening on port 4000!'));