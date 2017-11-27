const config = require('./config.json');
const importer = require('./importer');

importer(config).catch(err => {
  if (err) {
    console.log(err);
  }
  process.exit();
});