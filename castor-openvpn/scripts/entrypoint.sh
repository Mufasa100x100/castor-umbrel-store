#!/usr/bin/env bash
set -euo pipefail

OVPN_DIR="/etc/openvpn"

log() { echo "[$(date -Iseconds)] $*"; }

# Variables (vienen del environment del compose)
: "${OVPN_NET:=10.66.0.0}"
: "${OVPN_MASK:=255.255.255.0}"
: "${OVPN_TCP_PORT:=443}"

# Primera inicialización si falta server config
if [ ! -f "${OVPN_DIR}/openvpn.conf" ]; then
  log "Inicializando OpenVPN (primera vez)..."

  # Genera config servidor (internamente 1194/tcp)
  ovpn_genconfig -u "tcp://0.0.0.0:1194" \
    -n "1.1.1.1" -n "8.8.8.8"

  # Inicializa PKI sin password (evita interacción)
  echo "castor" | ovpn_initpki nopass

  log "Inicialización completada."
else
  log "OpenVPN ya inicializado (reutilizando /etc/openvpn persistente)."
fi

log "Arrancando OpenVPN..."
exec ovpn_run
