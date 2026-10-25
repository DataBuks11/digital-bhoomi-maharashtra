import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('C:/Users/Piyush Junghare/.gemini/antigravity-ide/brain/946b71ed-3dd8-4845-aa08-ba4e5ceb854e/.user_uploaded/media_1792611886484.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re

# Find dim and presentbar
m = re.search(r'(<div[^>]*id=["\']dim["\'][\s\S]*?<div[^>]*id=["\']presentbar["\'][\s\S]*?</div>\s*</div>)', text)
if m:
    print('Found dim + presentbar HTML:')
    print(m.group(1)[:1200])
else:
    pos = text.find('id="presentbar"')
    if pos != -1:
        print('Found id="presentbar" at', pos)
        print(text[pos-100:pos+700])

# Find the full presentation JS script
p_script = text.find('/* ---------- voice presentation')
if p_script != -1:
    end_script = text.find('</script>', p_script)
    print('\n=== FULL PRESENTATION SCRIPT ===')
    print(text[p_script:end_script])
