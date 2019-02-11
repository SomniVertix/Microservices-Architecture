#!/bin/bash
vault server -config=/vault/config/vault-config.json &
source ./config.sh
wait