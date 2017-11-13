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

exports.compareVersions = compareVersions;