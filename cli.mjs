#!/usr/bin/env node
import { cp, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

async function main() {
  const [, , name, ...extra] = process.argv;
  if (!name || name === "--help" || name === "-h") {
    console.log("Usage: npm create app-aisdkpro@latest web-app");
    return;
  }
  if (extra.length || !/^[a-z0-9][a-z0-9-]{0,62}$/.test(name)) {
    throw new Error("Use a new folder name containing lowercase letters, numbers and hyphens.");
  }

  const destination = resolve(name);
  const template = fileURLToPath(new URL("./template/", import.meta.url));
  const packageJson = JSON.parse(await readFile(join(template, "package.json"), "utf8"));
  packageJson.name = name;
  packageJson.scripts.dev = "next dev";
  packageJson.scripts.build = "next build --webpack";
  packageJson.scripts.start = "next start";
  await mkdir(destination);
  try {
    await cp(template, destination, { recursive: true });
    await rename(join(destination, "gitignore"), join(destination, ".gitignore"));
    await writeFile(join(destination, "package.json"), JSON.stringify(packageJson, null, 2) + "\n");
  } catch (error) {
    await rm(destination, { force: true, recursive: true });
    throw error;
  }
  console.log(`Created ${name}\n\n  cd ${name}\n  npm install\n  npm run dev`);
}

main().catch(error => {
  console.error(error.code === "EEXIST" ? "That folder already exists. Choose a new name." : error.message);
  process.exitCode = 1;
});
