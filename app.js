const Git = require('nodegit');
const mysql = require('promise-mysql');
const config = require('./config.json');
const helpers = require('./helpers');


async function getTags() {
  console.log('Opening repo...');
  const repo = await Git.Repository.open(config.repoPath);
  console.log('Retrieving tag list...');
  const tags = (await Git.Tag.list(repo)).filter(tag => /\d+\.\d+\.\d+/.test(tag));
  console.log(tags);
  tags.sort(helpers.compareVersions);
  return tags;
}


(async function() {
  const tags = await getTags();

  console.log('Connecting to database...');
  const conn = await mysql.createConnection({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database
  });

  console.log('Retrieving versions from DB...');
  const tasks = (await conn.query('SELECT ver, num FROM task ' +
    'WHERE build_task_id IS NULL AND ' +
    'template_id=? AND ' +
    'NOT ver IS NULL AND ' +
    'ver <> \'\' ORDER BY id', config.templateID)).filter(task => /\d+\.\d+\.\d+/.test(task.ver));
  console.log(tasks.map(task => task.ver));

  console.log('Determining start version...');
  const lastTask = tasks[tasks.length - 1];
  let startIndex = 0;
  if (lastTask !== undefined) {
    startIndex = tags.length;
    for (let i = tags.length - 1; i >= 0; i--) {
      if (helpers.compareVersions(lastTask.ver, tags[i]) >= 0) {
        startIndex = i + 1;
        break;
      }
    }
  }

  console.log(tags[startIndex] ? 'Inserting builds from version ' + tags[startIndex] : 'There are no new builds');

  const values = [];

  const now = new Date();
  const mysqlNow = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() +
    ' ' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();

  const lastTaskNum = lastTask ? lastTask.num : 0;
  for (let i = startIndex; i < tags.length; i++) {
    const tag = tags[i];
    const num = lastTaskNum + 1 + i - startIndex;
    values.push(`(${config.templateID}, 'success', '', '', '${mysqlNow}', '${tag}', ${num})`);
  }

  if (values.length > 0) {
    await conn.query('INSERT INTO task(template_id, status, playbook, environment, created, ver, num) VALUES ' +
      values.join(', '));
  }

  console.log('Updating last success build...');
  if (values.length > 0) {
    const lastBuild = conn.query('SELECT id, ver FROM task WHERE template_id = ? ORDER BY id DESC LIMIT 1', config.templateID)[0];
    await conn.query('UPDATE project__template SET last_success_build_task_id=?, last_success_version=? WHERE id = ?',
      lastBuild.id, lastBuild.ver, config.templateID);
  }

  console.log('Closing DB connection...');
  conn.end();
})().catch(err => {
  if (err) {
    console.log(err);
  }
  process.exit();
});
