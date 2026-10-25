import re, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('public/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

pages = re.findall(r'<main[^>]*id=["\'](page-[^"\']+)["\']', text)
print('Pages found in index.html:', pages)

subsections = [
    'sub-inf-dashboard', 'sub-inf-clints', 'sub-inf-earning', 'sub-inf-notifications', 'sub-inf-profile',
    'sub-pt-dashboard', 'sub-pt-clients', 'sub-pt-shortlisted', 'sub-pt-funds', 'sub-pt-profile',
    'sub-adm-dashboard', 'sub-adm-clients', 'sub-adm-shortlisted', 'sub-adm-partner', 'sub-adm-influencers',
    'sub-adm-idict', 'sub-adm-funds', 'sub-adm-ifees', 'sub-adm-notifications'
]

with open('src/future-elite/data.ts', 'r', encoding='utf-8') as f:
    dtext = f.read()

clients = re.findall(r'id:\s*["\'](CLT\d+|FE\d+|PT\d+)[^"\']*["\'],\s*name:\s*["\']([^"\']+)["\']', dtext)
print('Total clients found:', len(clients))
for cid, name in clients:
    print(f'  {cid}: {name}')






