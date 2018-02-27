const mysql = require('promise-mysql');
const helpers = require('./helpers');

module.exports = async function(config) {
  const tags = await helpers.getTags(config.repoPath);

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

  let taskVersions = tasks.map(task => task.ver);
  if (taskVersions.length > 10) {
    taskVersions = taskVersions.slice(taskVersions.length - 10);
  }
  console.log(taskVersions);

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
  //if (values.length > 0) {
  const results = await conn.query('SELECT id, ver FROM task WHERE template_id = ? ORDER BY id DESC LIMIT 1', config.templateID);
  const lastBuild = results[0];
  const q = `UPDATE project__template SET last_success_build_task_id=${lastBuild.id}, last_success_version='${lastBuild.ver}' WHERE id = ${config.templateID}`;
  await conn.query(q);
  //await conn.query('UPDATE project__template SET last_success_build_task_id=?, last_success_version=? WHERE id = ?',
  //  lastBuild.id, lastBuild.ver, config.templateID);
  //}
  console.log('Closing DB connection...');
  conn.end();
};
