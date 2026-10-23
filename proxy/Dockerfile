FROM nginx:1.27-alpine

COPY snippets/ /etc/nginx/snippets/

# Rendered to /etc/nginx/conf.d/default.conf on start (envsubst on ${KOTLIN_UPSTREAM}, ${PYTHON_UPSTREAM})
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
