#!/usr/bin/env node
import _ from "babel-polyfill"
import fs from "fs-sync"
import logSymbols from "log-symbols"
import path from "path"
import DockerCli from "./lib/DockerCli"
import Variables from "./lib/Variables"

const scriptName = process.argv[2]
const outputPath = process.argv.length > 2 ? process.argv[3] : null

if (!scriptName) {

  console.error(logSymbols.error, 'Usage: lde [command]')
  process.exit(1)

}

const out = outputPath ? path.resolve(outputPath) : path.resolve(".")
const ldeFile = path.join(out, "./.lde.json")
const variablesFile = path.join(out, "./.env")

if (scriptName != "init" && !fs.exists(ldeFile)) {

  console.error(logSymbols.error, "'.lde.json' not found in your project folder.")
  process.exit(1)

}


if(scriptName == "init") {

  new DockerCli(scriptName).run(outputPath)

} else {

  const globalVars = new Variables({file: variablesFile}).getObjList()
  const ldeConfig = JSON.parse(fs.read(ldeFile))

  const config = {
    ...ldeConfig,
    out,
    templates: ldeConfig.templates ? ldeConfig.templates : `${__dirname}/templates`,
    globalVars
  }

  new DockerCli(scriptName, config).run()

}




