// Where the integration tests find the app: the dev stack (scripts/dev.sh up), behind its proxy. HINT_APP_URL for a
// stack on other ports, e.g. PORT_OFFSET=10000: http://localhost:18080
// No "/" at the end: the app's paths start with one, and the Python API does not take "//meta/..." as "/meta/..."
// (Kotlin did).
export const integrationAppUrl = (process.env.HINT_APP_URL || "http://localhost:8080").replace(/\/+$/, "");
