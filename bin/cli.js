#!/usr/bin/env node
import { main } from "../src/index.js";

main(process.argv.slice(2)).catch((error) => {
  console.error(`\n${error?.stack || error}`);
  process.exit(1);
});
