import os
import re

file_path = "c:\\Dev\\Projects\\Citizen_feedback project\\samsung-innovation\\road-maintenance-app\\backend\\services\\ai_service.py"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace specific emojis that are causing crashes
replacements = {
    '✓': '[OK]',
    '✗': '[ERROR]',
    '🔄': '[LOADING]',
    '🤖': '[AI]',
    '📋': '[INFO]',
    '🖼️': '[IMAGE]',
    '🔍': '[SEARCH]',
    '🧪': '[TEST]'
}

for emoji, replacement in replacements.items():
    content = content.replace(emoji, replacement)

# Overwrite
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully replaced emojis in ai_service.py")
