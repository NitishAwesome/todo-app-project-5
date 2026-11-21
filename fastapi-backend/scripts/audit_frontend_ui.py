import os
import re

src_dir = "frontend/src"
emoji_pattern = re.compile(r'[\U00010000-\U0010ffff]|[\u2600-\u27bf]')
dev_terms = ["step 7", "step 8", "step 9", "fastapi", "mysql", "argon2", "jwt", "migration", "group 5", "liam", "e2e"]

print("=== SCANNING FOR EMOJIS AND DEV TERMS IN FRONTEND/SRC ===")
for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.endswith((".tsx", ".jsx", ".ts", ".css", ".html")):
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8", errors="ignore") as fp:
                for line_no, line in enumerate(fp, 1):
                    # Check emojis
                    emojis_found = emoji_pattern.findall(line)
                    if emojis_found and not path.endswith(".test.ts"):
                        print(f"EMOJI in {f}:{line_no}: {''.join(emojis_found)} -> {line.strip()[:100]}")
                    # Check dev terms (case-insensitive)
                    line_lower = line.lower()
                    for term in dev_terms:
                        if term in line_lower:
                            if not ('from "' in line or 'import ' in line or '/api/' in line or 'api.' in line):
                                print(f"DEV-TERM [{term}] in {f}:{line_no}: {line.strip()[:100]}")
