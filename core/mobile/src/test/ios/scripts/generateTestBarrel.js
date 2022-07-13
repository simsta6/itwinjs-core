/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.info(`generateTestBarrel.js <testDir> <barrel-file-path>`);
  process.exit(1);;
}
var testDir = process.argv[2];
var barrelFile = process.argv[3]
var nTestFileFound = 0
if (!fs.existsSync(testDir)) {
  console.error(`testDir ${testDir} must exist`);
  process.exit(1);
}

const fileId = fs.openSync(barrelFile, "w+");
fs.appendFileSync(fileId, `\r\n// Generated by generateTestBarrel.js on ${(new Date()).toISOString()}\r\n`);

function populateBarrel(fromDir) {
  const filter = ".test.js";
  const files = fs.readdirSync(fromDir);
  for (var i = 0; i < files.length; i++) {
    var filename = path.join(fromDir, files[i]);
    var stat = fs.lstatSync(filename);
    if (stat.isDirectory()) {
      fs.appendFileSync(fileId, "\r\n");
      populateBarrel(filename, filter); //recurse
    }
    else if (filename.endsWith(filter)) {
      nTestFileFound++;
      // https://github.com/iTwin/itwinjs-core/security/code-scanning/15
      fs.appendFileSync(fileId, `require("./${path.relative(testDir, filename).replace("\\/g", "/")}")\r\n`);
    };
  };
}

populateBarrel(testDir)
fs.appendFileSync(fileId, `\r\n// <EOF> \r\n`);
fs.closeSync(fileId);

if (nTestFileFound < 1) {
  console.error(`Found no test file in testDir`);
  fs.unlinkSync(barrelFile);
  process.exit(1);
}

console.log(`Barrel file created ${barrelFile}`);