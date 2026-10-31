#!/usr/bin/env node

const { runCli } = require('../src/index');

runCli(process.argv).then((result) => {
  if (result.success) {
    console.log(result.message);
    process.exit(0);
  } else {
    console.error(result.message);
    process.exit(1);
  }
}).catch((err) => {
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});
