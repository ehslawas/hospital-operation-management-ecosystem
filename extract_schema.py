import json
import os

file_path = r"C:\Users\60113\.gemini\antigravity\brain\f155755c-ecdb-4189-a1d6-b37bb112995c\.system_generated\steps\918\output.txt"
with open(file_path, 'r') as f:
    data = json.load(f)

for table in data['tables']:
    if 'pharmacy_purchase_order_items' in table['name']:
        print(json.dumps(table, indent=2))
