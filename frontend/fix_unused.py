import os
import re

files = [
    r"k:\startup\frontend\src\hooks\useWebRTC.ts",
    r"k:\startup\frontend\src\hooks\useGlobalSearch.ts"
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    content = re.sub(r'catch\s*\(\s*[a-zA-Z]+\s*=>', 'catch(() =>', content)
    content = re.sub(r'catch\s*\(\s*err\s*\)\s*\{', 'catch() {', content)
    content = re.sub(r'catch\s*\(\s*e\s*\)\s*\{', 'catch() {', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
