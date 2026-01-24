import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function sh(cmd) {
  console.log(`[install] ${cmd}`);
  execSync(cmd, { stdio: "inherit", shell: "/bin/bash" });
}

const appDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const dataDir = path.join(appDir, "data");

fs.mkdirSync(dataDir, { recursive: true });

// IP local (LAN)
let lanIp = "127.0.0.1";
try {
  const out = execSync("hostname -I | awk '{print $1}'", { shell: "/bin/bash" }).toString().trim();
  if (out) lanIp = out;
} catch {}

const ovpnEnv = path.join(dataDir, "ovpn_env.sh");
const pkiDir = path.join(dataDir, "pki");

if (!fs.existsSync(ovpnEnv)) {
  sh(`docker run --rm -v "${dataDir}:/etc/openvpn" kylemanna/openvpn ovpn_genconfig -u "tcp://${lanIp}:443" -n 1.1.1.1 -n 8.8.8.8`);
} else {
  console.log("[install] ovpn_env.sh exists, skipping genconfig");
}

if (!fs.existsSync(pkiDir)) {
  sh(`docker run --rm -e EASYRSA_BATCH=1 -v "${dataDir}:/etc/openvpn" kylemanna/openvpn ovpn_initpki nopass`);
} else {
  console.log("[install] PKI exists, skipping initpki");
}

console.log("[install] OK");
