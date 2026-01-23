#!/usr/bin/env bash
set -e

# Umbrel install context puede NO definir APP_DATA_DIR
APP_DATA_DIR="${APP_DATA_DIR:-/home/umbrel/umbrel/app-data/castor-openvpn}"

export OVPN_TCP_PORT="443"
export OVPN_NET="10.66.0.0"
export OVPN_MASK="255.255.255.0"
export OVPN_DATA_DIR="${APP_DATA_DIR}/data"
