/*---------------------------------------------------------------------------------------------
|  $Copyright: (c) 2018 Bentley Systems, Incorporated. All rights reserved. $
 *--------------------------------------------------------------------------------------------*/
const childProcess = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const argv = require("yargs").argv;

//Three arguments: --noTypeDoc, --noBuild, and --mdOnly
let runTypeDoc = argv.noTypeDoc === undefined ? true : false;
let runRushBuild = argv.noBuild === undefined ? true : false;

const runQuick = argv.mdOnly === undefined ? false : true;
runTypeDoc = runQuick === true ? false : runTypeDoc;

if (runTypeDoc) {
  runDocs();
}
if (runRushBuild) {
  runBuild();
}
runStagingCopy();
if (runQuick) {
  clearReference();
}
runBemetalsmith();

//Rush docs
function runDocs() {
  // Clean generated-docs
  fs.removeSync(path.resolve(process.cwd(), "generated-docs"));

  const docsProcess = childProcess.execSync("rush docs", { stdio: [0, 1, 2] });
}

//Rush rebuild. This ensures the code compiles and does the code snippet extraction.
function runBuild() {
  const rushBuildProcess = childProcess.execSync("rush rebuild", {
    stdio: [0, 1, 2]
  });
}

//Copy docs to staging area
function runStagingCopy() {
  const outputDir = path.resolve(process.cwd(), "generated-docs\\staging");

  // Clean staging area
  fs.removeSync(outputDir);

  //Copy md files.
  const docsDir = path.resolve(process.cwd(), "docs");
  fs.copySync(docsDir, outputDir);

  //Copy extract to staging area
  const extractDir = path.resolve(process.cwd(), "generated-docs\\extract");
  fs.copySync(extractDir, path.join(outputDir, "extract"));

  //Copy reference to staging area
  const refOutputDir = path.resolve(
    process.cwd(),
    "generated-docs\\staging\\reference"
  );
  if (runTypeDoc) {
    const packages = getPackages();
    const genDocsDir = path.resolve(process.cwd(), "generated-docs");

    packages.forEach(function (pkg) {
      let packageDir = pkg["projectFolder"].split("/")[1];
      let packageName = pkg["packageName"].split("/")[1];
      fs.copySync(
        path.join(genDocsDir, packageDir, "json"),
        path.join(refOutputDir, packageName)
      );
    });
  }
}

function runBemetalsmith() {
  const source = path.join(process.cwd(), "generated-docs\\staging");
  const destination = path.join(
    process.cwd(),
    "generated-docs\\staging\\public"
  );
  const metalsmithProcess = childProcess.execSync(
    `bmsWatch --source "${source}" --destination "${destination}"`,
    { stdio: [0, 1, 2] }
  );
}

//Get the packages from rush.json
function getPackages() {
  var obj = JSON.parse(fs.readFileSync("rush.json", "utf8"));
  let retProjects = [];
  var projs = obj["projects"];
  projs.forEach(function (proj) {
    if (proj["shouldPublish"] === true) {
      retProjects.push(proj);
    }
  });
  return retProjects;
}

function clearReference() {
  fs.removeSync(path.join(process.cwd(), "generated-docs", "staging", "reference"));
}

