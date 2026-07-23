import os
import re

directory = r"k:\startup\frontend\src"

exclude_files = ["ErrorBoundary.tsx"]

def clean_console_logs():
    for root, dirs, files in os.walk(directory):
        for file in files:
            if not file.endswith(('.ts', '.tsx')):
                continue
            if file in exclude_files:
                continue
            
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace console.log(...) and console.error(...) with empty string if they are standalone
            # Or just comment them out
            # We'll use a regex to comment out lines that contain console.log or console.error
            # But wait, what if they are in a catch block like `.catch(console.error)`?
            
            new_content = re.sub(r'console\.log\([^)]*\);?', '/* console.log removed */', content)
            new_content = re.sub(r'console\.error\([^)]*\);?', '/* console.error removed */', new_content)
            new_content = re.sub(r'\.catch\(console\.error\)', '.catch(() => {})', new_content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Cleaned {filepath}")

clean_console_logs()
