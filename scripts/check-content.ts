import { fileURLToPath } from "node:url";
import { loadAndCheck } from "../src/lib/content/load.ts";

const root = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
const { errors, warnings } = loadAndCheck(root);
for (const w of warnings) console.warn(`avertissement  ${w.file} › ${w.field} : ${w.message}`);
for (const e of errors) console.error(`erreur         ${e.file} › ${e.field} : ${e.message}`);
console.log(`contenu : ${errors.length} erreur(s), ${warnings.length} avertissement(s)`);
process.exit(errors.length ? 1 : 0);
