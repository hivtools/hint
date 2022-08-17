export VAULT_ADDR=https://vault.dide.ic.ac.uk:8200
OAUTH2_CLIENT_ID="$(vault read -field=value /secret/hint/oauth2/client-id)"
OAUTH2_CLIENT_SECRET="$(vault read -field=value /secret/hint/oauth2/client-secret)"
OAUTH2_ISSUER_URI="$(vault read -field=value /secret/hint/oauth2/issuer-uri)"

export OAUTH2_CLIENT_ID OAUTH2_CLIENT_SECRET OAUTH2_ISSUER_URI