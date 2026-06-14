
import json

with open(r"C:\Users\60113\.gemini\antigravity\brain\505c4646-c5c4-4269-8c55-8dd30691fd53\.system_generated\steps\566\output.txt", 'r') as f:
    data = json.load(f)

for table in data['tables']:
    if table['name'] == 'public.pharmacy_purchase_orders':
        print(json.dumps(table, indent=2))
        break
