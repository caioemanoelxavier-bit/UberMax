import re

with open('script.js') as f:
    js = f.read()

with open('server.js') as f:
    srv = f.read()

# Rotas no frontend (fetch calls)
frontend_routes = re.findall(r'fetch\(`\$\{API_URL\}([^`]+)`', js)

# Rotas no backend
backend_post = re.findall(r"app\.post\('(/api[^']+)'", srv)
backend_get  = re.findall(r"app\.get\('(/api[^']+)'", srv)

print('=== ROTAS FRONTEND ===')
for r in sorted(set(frontend_routes)):
    print('  ' + r)

print()
print('=== ROTAS BACKEND POST ===')
for r in sorted(backend_post):
    print('  POST ' + r)

print()
print('=== ROTAS BACKEND GET ===')
for r in sorted(backend_get):
    print('  GET  ' + r)
