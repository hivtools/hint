export VAULT_ADDR=https://vault.dide.ic.ac.uk:8200
OAUTH2_CLIENT_ID="$(vault read -field=password /secret/oauth2/clientid/auth0)"
OAUTH2_CLIENT_SECRET="$(vault read -field=password /secret/oauth2/clientsecret/auth0)"
OAUTH2_ISSUER_URI="$(vault read -field=password /secret/oauth2/issueruri/auth0)"

export OAUTH2_CLIENT_ID OAUTH2_CLIENT_SECRET OAUTH2_ISSUER_URI