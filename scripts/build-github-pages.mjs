import {
  cp,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const GITHUB_PAGES_BASE_PATH = "/agent-driven-CMS";
const PUBLIC_ASSET_PATH_PATTERN = /(^|[^A-Za-z0-9_./-])\/(images|video)\//g;
const ESCAPED_PUBLIC_ASSET_PATH_PATTERN =
  /(^|[^A-Za-z0-9_.\\/-])\\\/(images|video)\\\//g;
const TEXT_OUTPUT_EXTENSIONS = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".map",
  ".mjs",
  ".rsc",
  ".svg",
  ".txt",
  ".webmanifest",
  ".xml",
]);

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(rootDir, "..");
const nextBin = path.join(
  projectRoot,
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);
const nextOutDir = path.join(projectRoot, "out");
const pagesOutDir = path.join(projectRoot, "dist", "github-pages");
const apiDir = path.join(projectRoot, "app", "api");
const disabledApiDir = path.join(projectRoot, ".next-github-pages-api");

async function exists(filePath) {
  return stat(filePath)
    .then(() => true)
    .catch(() => false);
}

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      ...options,
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `${command} ${args.join(" ")} failed (${code ?? signal ?? "unknown"})`,
        ),
      );
    });
  });
}

function prefixPublicAssetPaths(content) {
  return content.replace(
    ESCAPED_PUBLIC_ASSET_PATH_PATTERN,
    (_, prefix, directory) =>
      `${prefix}\\/${GITHUB_PAGES_BASE_PATH.slice(1)}\\/${directory}\\/`,
  ).replace(
    PUBLIC_ASSET_PATH_PATTERN,
    (_, prefix, directory) => `${prefix}${GITHUB_PAGES_BASE_PATH}/${directory}/`,
  );
}

async function postProcessPublicAssetPaths(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  let updatedFileCount = 0;

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      updatedFileCount += await postProcessPublicAssetPaths(entryPath);
      continue;
    }

    if (!entry.isFile() || !TEXT_OUTPUT_EXTENSIONS.has(path.extname(entry.name))) {
      continue;
    }

    const content = await readFile(entryPath, "utf8");
    const nextContent = prefixPublicAssetPaths(content);

    if (nextContent !== content) {
      await writeFile(entryPath, nextContent);
      updatedFileCount += 1;
    }
  }

  return updatedFileCount;
}

async function main() {
  let apiMoved = false;

  await rm(nextOutDir, { recursive: true, force: true });
  await rm(pagesOutDir, { recursive: true, force: true });
  if (!(await exists(apiDir)) && (await exists(disabledApiDir))) {
    await rename(disabledApiDir, apiDir);
  }

  try {
    if (await exists(apiDir)) {
      await rm(disabledApiDir, { recursive: true, force: true });
      await rename(apiDir, disabledApiDir);
      apiMoved = true;
    }

    await run(process.execPath, [nextBin, "build"], {
      cwd: projectRoot,
      env: {
        ...process.env,
        GITHUB_PAGES: "true",
      },
    });

    await cp(nextOutDir, pagesOutDir, { recursive: true });
    const updatedFileCount = await postProcessPublicAssetPaths(pagesOutDir);
    console.log(
      `GitHub Pages site written to ${pagesOutDir} (${updatedFileCount} files post-processed)`,
    );
  } finally {
    try {
      if (apiMoved) {
        await rename(disabledApiDir, apiDir);
      }
    } finally {
      await rm(nextOutDir, { recursive: true, force: true });
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
