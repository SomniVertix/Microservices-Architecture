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
#vault audit enable file file_path=/vault/logs/audit.log

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
awk 'NR<=5{print "curl --request PUT --data \"" $0 "\" microservices-architecture_consul_1.microservices-architecture_mynetwork:8500/v1/kv/vault" NR-1 + 1}' init >> consulStoring.sh
awk 'END {print "curl --request PUT --data \"" $0 "\" microservices-architecture_consul_1.microservices-architecture_mynetwork:8500/v1/kv/vaultLogin"}' init >> consulStoring.sh

# Generate token for app to use and pass it to the container
vault policy write app /vault/policies/app-policy.tf
vault token create -policy=app > policy
awk 'NR==3{print "curl --request PUT --data \"" $2 "\" microservices-architecture_consul_1.microservices-architecture_mynetwork:8500/v1/kv/appToken"}' policy >> consulStoring.sh
chmod +x ./consulStoring.sh 
source ./consulStoring.sh

# Clean up for security
rm file init unsealing.sh consulStoring.sh config.sh
history -c 