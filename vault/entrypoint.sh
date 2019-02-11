#!/bin/bash
vault operator init > file
awk '/:/ { print $4}' file > init

awk 'NR>3{exit} {print "vault operator unseal " $0 }' init >> scrip.sh
awk 'END {print "vault login " $0 }' init >> scrip.sh

# Give created script access
chmod +x ./scrip.sh 
./scrip.sh

# Enable logs 
vault audit enable file file_path=/vault/logs/audit.log

# Enable and Configure Database
vault secrets enable database

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
