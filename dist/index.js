#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const childProcess = require("child_process");
const common_tags_1 = require("common-tags");
const fs = require("fs");
const path_1 = require("path");
const util_1 = require("util");
const writeFile = util_1.promisify(fs.writeFile);
const readFile = util_1.promisify(fs.readFile);
const mkdir = util_1.promisify(fs.mkdir);
const exec = util_1.promisify(childProcess.exec);
const prettierContent = common_tags_1.stripIndent `
  {
    "semi": false,
    "doubleQuote": true,
    "trailingComma": "all",
    "arrowParens": "always",
    "printWidth": 80,
  }
`;
const gitignoreContent = common_tags_1.stripIndent `
  node_modules
  dist
`;
const jestConfigContent = common_tags_1.stripIndent `
  module.exports = {
    roots: ['<rootDir>/src'],
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
  }
`;
const tsConfigContent = common_tags_1.stripIndent `
{
  "extends": "@tsconfig/node16/tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "sourceMap": true,
    "preserveConstEnums": true,
    "strictNullChecks": true,
    "types": ["jest", "node"],
  },
  "exclude": ["node_modules", "**/*.spec.ts", "./dist/**/*"]
}
`;
const babelrcContent = common_tags_1.stripIndent `
{
  "presets": [
    ["@babel/preset-env", {"targets": {"node": "current"}}],
    "@babel/preset-typescript"
  ],
  "plugins": [
    "@babel/proposal-class-properties",
    "@babel/proposal-object-rest-spread"
  ]
}`;
async function run() {
    console.log("npm init");
    await exec("npm init --yes");
    console.log("npm install (may take a while)");
    await exec("npm install --save-dev typescript \
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
      eslint-plugin-import");
    console.log("Creating files & folders");
    await Promise.all([
        writeFile(path_1.join(process.cwd(), ".prettierrc"), prettierContent),
        writeFile(path_1.join(process.cwd(), ".gitignore"), gitignoreContent),
        writeFile(path_1.join(process.cwd(), "jest.config.js"), jestConfigContent),
        writeFile(path_1.join(process.cwd(), "tsconfig.json"), tsConfigContent),
        writeFile(path_1.join(process.cwd(), ".babelrc.json"), babelrcContent),
        mkdir(path_1.join(process.cwd(), "src")).then(() => writeFile(path_1.join(process.cwd(), "src", "index.ts"), "")),
    ]);
    console.log("Updating package.json scripts");
    await updatingPackageJson();
    console.log("Running prettier");
    await exec("npx prettier --write .");
}
async function updatingPackageJson() {
    const path = path_1.join(process.cwd(), "package.json");
    const content = await readFile(path);
    const parsed = JSON.parse(content.toString());
    const newParsed = Object.assign(Object.assign({}, parsed), { version: "0.1.0-alpha", main: "dist/index.js", scripts: {
            start: "node dist/index.js",
            "start-dev": "ts-node src/index.ts",
            test: "jest",
            "test-dev": "jest --watch",
            "build:clean": "rm -rf dist/*",
            build: "npm run build:clean && tsc --project tsconfig.json",
        } });
    const newContent = JSON.stringify(newParsed);
    await writeFile(path, newContent);
}
run()
    .catch((err) => console.log("Error", err))
    .then(() => console.log("Done"));
//# sourceMappingURL=index.js.map