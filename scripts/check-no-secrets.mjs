import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const trackedFiles = execSync("git ls-files", { encoding: "utf8" })
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const allowedFiles = new Set([".env.example"]);
const suspiciousPatterns = [
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*(?!your-)[^\s#]+/i,
  /OCR_SPACE_API_KEY\s*=\s*(?!your-)[^\s#]+/i,
  /GOOGLE_CLOUD_VISION_API_KEY\s*=\s*(?!your-)[^\s#]+/i,
  /UPSTASH_REDIS_REST_TOKEN\s*=\s*(?!your-)[^\s#]+/i,
  /SECURITY_ALERT_WEBHOOK_URL\s*=\s*https?:\/\/[^\s#]+/i,
  /(?:api[_-]?key|secret|token|password)\s*[:=]\s*['"]?[A-Za-z0-9_\-\/+=]{20,}['"]?/i,
  /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/,
];

const ignoredExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".lock",
  ".map",
]);

const findings = [];

for (const relativePath of trackedFiles) {
  if (relativePath.startsWith(".next/")) continue;
  if (relativePath.startsWith("node_modules/")) continue;

  const extension = path.extname(relativePath).toLowerCase();
  if (ignoredExtensions.has(extension)) continue;

  const absolutePath = path.join(projectRoot, relativePath);
  const content = fs.readFileSync(absolutePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line || line.trim().startsWith("#")) continue;

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(line)) {
        if (allowedFiles.has(relativePath)) {
          break;
        }
        findings.push({
          file: relativePath,
          line: index + 1,
          content: line.trim().slice(0, 140),
        });
        break;
      }
    }
  }
}

if (findings.length > 0) {
  console.error("Potential secrets detected:");
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} -> ${finding.content}`);
  }
  process.exit(1);
}

console.log("No obvious secrets detected in tracked files.");
