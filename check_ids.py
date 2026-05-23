import re

with open('index.html') as f:
    html = f.read()

with open('script.js') as f:
    js = f.read()

# IDs no HTML
html_ids = set(re.findall(r'id=[\'"]([\w-]+)[\'"]', html))

# getElementById no JS
js_ids = set(re.findall(r'getElementById\([\'"]([\w-]+)[\'"]\)', js))

missing = js_ids - html_ids
if missing:
    print('IDs no JS mas NAO no HTML:')
    for m in sorted(missing):
        print(f'  - {m}')
else:
    print('Todos os IDs do script.js existem no index.html OK')
print(f'Total IDs HTML: {len(html_ids)}, Total IDs JS: {len(js_ids)}')
