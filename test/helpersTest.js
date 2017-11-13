const expect = require('chai').expect;
const helpers = require('../helpers');

describe('helpers', () => {
  describe('compareVersions', () => {
    it('Should sort array of versions', () => {
      const versions = [
        '1.0.22',
        '1.0.5',
        '2.10.10',
        '2.3.23'
      ];
      versions.sort(helpers.compareVersions);
      expect(versions).to.eql([
        "1.0.5",
        "1.0.22",
        "2.3.23",
        "2.10.10"
      ]);
    });
  });
});