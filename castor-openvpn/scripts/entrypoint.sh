#!/usr/bin/env bash
set -euo pipefail

OVPN_DIR="/etc/openvpn"
OUT_DIR="/out"

mkdir -p "${OUT_DIR}"
cp -f "${OUT_DIR}/entrypoint.sh" "${OUT_DIR}/.entrypoint.self" 2>/dev/null || true

log() { echo "[$(date -Iseconds)] $*"; }

# 1) Inicializa si es primera vez
if [ ! -f "${OVPN_DIR}/openvpn.conf" ]; then
  log "Inicializando OpenVPN (primera vez)..."

  # Requiere estas variables exportadas desde exports.sh vía entorno de compose
  : "${OVPN_NET:=10.66.0.0}"
  : "${OVPN_MASK:=255.255.255.0}"
  : "${OVPN_TCP_PORT:=443}"

  # Genera server config TCP
  ovpn_genconfig -u "tcp://0.0.0.0:1194" \
    -n "1.1.1.1" -n "8.8.8.8" \
    -p "route 192.168.0.0 255.255.0.0" \
    -p "route 10.0.0.0 255.0.0.0" \
    -p "route 172.16.0.0 255.240.0.0"

  # Inicializa PKI sin password interactivo
  echo "castor" | ovpn_initpki nopass

  log "Inicialización completada."
else
  log "OpenVPN ya inicializado (reutilizando /etc/openvpn persistente)."
fi

# 2) Arranque del servidor
log "Arrancando OpenVPN..."
exec ovpn_run

