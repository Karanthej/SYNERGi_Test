import os

files = [
    r"k:\startup\frontend\src\hooks\useWebRTC.ts",
    r"k:\startup\frontend\src\hooks\useGlobalSearch.ts"
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace('catch(err) {', 'catch {')
    content = content.replace('catch((err) =>', 'catch(() =>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
