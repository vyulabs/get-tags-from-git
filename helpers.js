const Git = require('nodegit');
const exec = require('child_process').exec;

async function delay(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function compareVersions(ver1, ver2) {
  const parts1 = ver1.split('.').map(part => parseInt(part));
  const parts2 = ver2.split('.').map(part => parseInt(part));
  for (let i = 0; i < 3; i++) {
    if (parts1[i] < parts2[i]) {
      return -1;
    } else if (parts1[i] > parts2[i]) {
      return 1;
    }
  }
  return 0;
}

async function getTags(repoPath) {
  console.log('Updating from remote...');
  //await exec('git pull', { cwd: repoPath }, (err, stdout, stderr) => {
  //  if (err) {
  //    console.log(err);
  //  }
  //  console.log(`stdout: ${stdout}`);
  //  console.log(`stderr: ${stderr}`);
  //});

  const { stdout, stderr } = await exec('git pull', { cwd: repoPath });

  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);

  //await delay(5000);

  console.log('Opening repo...');
  const repo = await Git.Repository.open(repoPath);

  console.log('Retrieving tag list...');
  const tags = (await Git.Tag.list(repo)).filter(tag => /\d+\.\d+\.\d+/.test(tag));
  tags.sort(compareVersions);

  if (tags.length > 10) {
    console.log(tags.slice(tags.length - 10));
  } else {
    console.log(tags);
  }

  return tags;
}

exports.getTags = getTags;
exports.compareVersions = compareVersions;