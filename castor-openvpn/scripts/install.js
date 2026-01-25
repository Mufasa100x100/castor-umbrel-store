import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function now() {
  return new Date().toISOString();
}

function append(logFile, msg) {
  fs.appendFileSync(logFile, `[${now()}] ${msg}\n`);
}

function sh(logFile, cmd) {
  append(logFile, `$ ${cmd}`);
  try {
    execSync(cmd, { stdio: "pipe", shell: "/bin/bash" });
    append(logFile, `OK`);
  } catch (e) {
    append(logFile, `ERROR: ${e?.message || e}`);
    // vuelca stdout/stderr si existen
    if (e?.stdout) append(logFile, `STDOUT:\n${String(e.stdout)}`);
    if (e?.stderr) append(logFile, `STDERR:\n${String(e.stderr)}`);
    throw e;
  }
}

// Rutas robustas
const thisFile = fileURLToPath(import.meta.url);
const scriptsDir = path.dirname(thisFile);
const appDir = path.resolve(scriptsDir, "..");
const dataDir = path.join(appDir, "data");

fs.mkdirSync(dataDir, { recursive: true });
const logFile = path.join(dataDir, "install.log");

append(logFile, `=== install.js start ===`);
append(logFile, `appDir=${appDir}`);
append(logFile, `dataDir=${dataDir}`);

let lanIp = "127.0.0.1";
try {
  const out = execSync("hostname -I | awk '{print $1}'", { shell: "/bin/bash" })
    .toString()
    .trim();
  if (out) lanIp = out;
} catch {}
append(logFile, `lanIp=${lanIp}`);

const ovpnEnv = path.join(dataDir, "ovpn_env.sh");
const pkiDir = path.join(dataDir, "pki");

// 1) Sanity checks
try {
  sh(logFile, "command -v docker");
  sh(logFile, "docker version");
} catch {
  append(logFile, `FATAL: docker not usable from install hook`);
  process.exit(1);
}

// 2) Genconfig si falta ovpn_env.sh
if (!fs.existsSync(ovpnEnv)) {
  append(logFile, `ovpn_env.sh missing -> running ovpn_genconfig`);
  sh(
    logFile,
    `docker run --rm -v "${dataDir}:/etc/openvpn" kylemanna/openvpn ` +
      `ovpn_genconfig -u "tcp://${lanIp}:443" -n 1.1.1.1 -n 8.8.8.8`
  );
} else {
  append(logFile, `ovpn_env.sh exists -> skip ovpn_genconfig`);
}

// 3) Init PKI si falta pki/
if (!fs.existsSync(pkiDir)) {
  append(logFile, `pki missing -> running ovpn_initpki`);
  sh(
    logFile,
    `docker run --rm -e EASYRSA_BATCH=1 -v "${dataDir}:/etc/openvpn" ` +
      `kylemanna/openvpn ovpn_initpki nopass`
  );
} else {
  append(logFile, `pki exists -> skip ovpn_initpki`);
}

// 4) Validación final
append(logFile, `final check: ovpn_env.sh=${fs.existsSync(ovpnEnv)}`);
append(logFile, `final check: pki=${fs.existsSync(pkiDir)}`);

if (!fs.existsSync(ovpnEnv) || !fs.existsSync(pkiDir)) {
  append(logFile, `FATAL: OpenVPN init incomplete`);
  process.exit(1);
}

append(logFile, `=== install.js done OK ===`);
