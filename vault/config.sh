#!/bin/bash

# Get data from init
vault operator init > file
awk '/:/ { print $4}' file > init
awk 'NR>3{exit} {print "vault operator unseal " $0 }' init >> unsealing.sh
awk 'END {print "vault login " $0 }' init >> unsealing.sh

# Give created script access
chmod +x ./unsealing.sh 
source ./unsealing.sh

# Enable logs 
vault audit enable file file_path=/vault/logs/audit.log

# Enable and Configure Database
vault secrets enable database

./wait-for-it.sh db:3306
vault write database/config/my-mysql-database \
    plugin_name=mysql-database-plugin \
    connection_url="{{username}}:{{password}}@tcp(db:3306)/" \
    allowed_roles="app" \
    username="root" \
    password="password"

vault write database/roles/app \
    db_name=my-mysql-database \
    creation_statements="CREATE USER '{{name}}'@'%' IDENTIFIED BY '{{password}}';GRANT SELECT ON *.* TO '{{name}}'@'%';" \
    default_ttl="1h" \
    max_ttl="24h"

# Assure that database has creds
vault read database/creds/app

# Add vault keys to Consul k/v store 
awk 'NR<=5{print "vault kv put secret/vaultKeys vaultKey" NR-1 + 1 "=" $0 }' init >> consulStoring.sh
awk 'END {print "vault kv put secret/vaultKeys vaultLogin=" $0 }' init >> consulStoring.sh
chmod +x ./consulStoring.sh 
source ./consulStoring.sh