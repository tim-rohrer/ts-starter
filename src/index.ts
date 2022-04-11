#!/usr/bin/env node

import * as childProcess from "child_process"
import { stripIndent } from "common-tags"
import * as fs from "fs"
import { join } from "path"
import { promisify } from "util"

const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)
const mkdir = promisify(fs.mkdir)
const exec = promisify(childProcess.exec)

const prettierContent = stripIndent`
  {
    "semi": false,
    "doubleQuote": true,
    "trailingComma": "all",
    "arrowParens": "always",
    "printWidth": 80,
  }
`

const gitignoreContent = stripIndent`
  node_modules
  dist
`

const jestConfigContent = stripIndent`
  module.exports = {
    roots: ['<rootDir>/src'],
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
  }
`

const tsConfigContent = stripIndent`
{
  "extends": "@tsconfig/node16/tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "sourceMap": true,
    "preserveConstEnums": true,
    "strictNullChecks": true,
    "types": ["jest", "node"],
  },
  "exclude": ["node_modules", "**/*.spec.ts"]
}
`

const babelrcContent = stripIndent`
{
  "presets": [
    ["@babel/preset-env", {"targets": {"node": "current"}}],
    "@babel/preset-typescript"
  ],
  "plugins": [
    "@babel/proposal-class-properties",
    "@babel/proposal-object-rest-spread"
  ]
}`

async function run() {
  console.log("npm init")
  await exec("npm init --yes")

  console.log("npm install (may take a while)")
  await exec(
    "npm install --save-dev typescript \
      ts-node \
      jest \
      ts-jest \
      @types/node \
      @types/jest \
      @tsconfig/node16 \
      @babel/core \
      @babel/plugin-proposal-class-properties \
      @babel/plugin-proposal-object-rest-spread \
      @babel/preset-env \
      @babel/preset-typescript \
      prettier \
      eslint \
      eslint-config-prettier \
      eslint-plugin-import \
      eslint-plugin-jest \
      eslint-plugin-node \
      eslint-plugin-prettier \
      @typescript-eslint/eslint-plugin \
      @typescript-eslint/parser \
      eslint-plugin-import",
  )

  console.log("Creating files & folders")
  await Promise.all([
    writeFile(join(process.cwd(), ".prettierrc"), prettierContent),
    writeFile(join(process.cwd(), ".gitignore"), gitignoreContent),
    writeFile(join(process.cwd(), "jest.config.js"), jestConfigContent),
    writeFile(join(process.cwd(), "tsconfig.json"), tsConfigContent),
    writeFile(join(process.cwd(), ".babelrc.json"), babelrcContent),
    mkdir(join(process.cwd(), "src")).then(() =>
      writeFile(join(process.cwd(), "src", "index.ts"), ""),
    ),
  ])

  console.log("Updating package.json scripts")
  await updatingPackageJson()

  console.log("Running prettier")
  await exec("npx prettier --write .")
}

async function updatingPackageJson() {
  const path = join(process.cwd(), "package.json")
  const content = await readFile(path)
  const parsed = JSON.parse(content.toString())
  const newParsed = {
    ...parsed,
    main: "dist/index.js",
    scripts: {
      start: "node dist/index.js",
      "start-dev": "ts-node src/index.ts",
      test: "jest",
      "test-dev": "jest --watch",
      "build:clean": "rm -rf dist/*",
      build: "npm build:clean && tsc --project tsconfig.json",
    },
  }
  const newContent = JSON.stringify(newParsed)
  await writeFile(path, newContent)
}

run()
  .catch((err) => console.log("Error", err))
  .then(() => console.log("Done"))
