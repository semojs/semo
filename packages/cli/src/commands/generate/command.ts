import path from "path";
import { Utils } from "@semo/core";
import fs from "fs-extra";

export const plugin = "semo";
export const command = "command <name> [description]";
export const desc = "Generate a command template";
export const aliases = ["com"];

export const builder = function (yargs) {
  yargs.option("extend", {
    default: false,
    alias: "E",
    describe: "generate command in extend directory",
  });

  yargs.option("plugin", {
    default: false,
    alias: "P",
    describe: "generate command in plugin directory",
  });

  yargs.option("typescript", {
    alias: "ts",
    describe: "generate typescript style code",
  });
};

export const handler = function (argv: any) {
  const scriptName = argv.scriptName || "semo";
  let commandDir: string;
  if (argv.extend) {
    let extendName = argv.extend;
    if (
      extendName !== scriptName &&
      extendName.indexOf(`${scriptName}-plugin-`) === -1
    ) {
      extendName = `${scriptName}-plugin-${extendName}`;
    }
    commandDir = `${
      argv.extendMakeDir || argv.extendDir
    }/${extendName}/src/commands`;
  } else if (argv.plugin) {
    let pluginName = argv.plugin;
    if (pluginName.indexOf(`${scriptName}-plugin-`) !== 0) {
      pluginName = `${scriptName}-plugin-${pluginName}`;
    }
    commandDir = `${
      argv.pluginMakeDir || argv.pluginDir
    }/${pluginName}/src/commands`;
  } else {
    commandDir = argv.commandMakeDir || argv.commandDir;
  }

  if (!commandDir) {
    Utils.error('"commandDir" missing in config file!');
  }

  const commandFilePath = path.resolve(
    commandDir,
    `${argv.name}.${argv.typescript ? "ts" : "js"}`
  );
  const commandFileDir = path.dirname(commandFilePath);

  fs.ensureDirSync(commandFileDir);

  if (Utils.fileExistsSyncCache(commandFilePath)) {
    Utils.error("Command file exist!");
  }

  const name = argv.name.split("/").pop();

  let handerTpl, code;
  if (argv.typescript) {
    code = `export const disabled = false // Set to true to disable this command temporarily
// export const plugin = '' // Set this for importing plugin config
export const command = '${name}'
export const desc = '${argv.description || name}'
// export const aliases = ''
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  // yargs.option('option', { default, describe, alias })
  // yargs.commandDir('${name}')
}

export const handler = async function (argv: any) {
  console.log('Start to draw your dream code!')
}
`;
  } else {
    handerTpl = `exports.handler = async function (argv) {
  console.log('Start to draw your dream code!')
}`;

    code = `exports.disabled = false // Set to true to disable this command temporarily
// exports.plugin = '' // Set this for importing plugin config
exports.command = '${name}'
exports.desc = '${argv.description || name}'
// exports.aliases = ''
// exports.middleware = (argv) => {}

exports.builder = function (yargs) {
  // yargs.option('option', { default, describe, alias })
  // yargs.commandDir('${name}')
}

${handerTpl}
`;
  }

  if (!Utils.fileExistsSyncCache(commandFilePath)) {
    fs.writeFileSync(commandFilePath, code);
    console.log(Utils.success(`${commandFilePath} created!`));
  }
};
