import { copyFileSync, cpSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const output = path.join(root, "cloudflare-upload");
const runtimeScripts = [
    "artwork-contours.js",
    "portfolio-console.js",
    "project-page.js",
    "projects.js",
    "site-config.js",
    "site.js",
    "tracking-overlay.js"
];

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
copyFileSync(path.join(root, "index.html"), path.join(output, "index.html"));
copyFileSync(path.join(root, "404.html"), path.join(output, "404.html"));
copyFileSync(path.join(root, "cloudflare", "_worker.js"), path.join(output, "_worker.js"));

for (const directory of ["assets", "projects", "styles"]) {
    cpSync(path.join(root, directory), path.join(output, directory), { recursive: true });
}

const scriptOutput = path.join(output, "scripts");
mkdirSync(scriptOutput, { recursive: true });
for (const file of runtimeScripts) {
    copyFileSync(path.join(root, "scripts", file), path.join(scriptOutput, file));
}

console.log(`cloudflare upload ready at ${output}`);
