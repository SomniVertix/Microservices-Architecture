#!/bin/bash
vault server -config=/vault/config/vault-config.json & # background the process to allow config.sh to run
source ./config.sh
wait # bring back server back to foreground so that container will keep running