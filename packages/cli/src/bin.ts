#!/usr/bin/env node

import { Utils } from "@semo/core";
import path from "path";

Utils.launchDispatcher({
  packageName: "@semo/cli",
  scriptName: "semo",
  coreDir: path.resolve(__dirname, "../"),
  orgMode: true, // Means my package publish under npm orgnization scope
});
