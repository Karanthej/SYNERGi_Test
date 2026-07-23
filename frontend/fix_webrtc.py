import os
import re

filepath = r"k:\startup\frontend\src\hooks\useWebRTC.ts"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the syntax error: e => /* comment */ should be e => { /* comment */ }
content = re.sub(r'e\s*=>\s*/\* console\.error removed \*/', 'e => { /* console.error removed */ }', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
