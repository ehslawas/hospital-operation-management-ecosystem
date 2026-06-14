import json

with open(r'C:\Users\60113\.gemini\antigravity\brain\7b29d474-e3d0-4c43-94bc-dfb72de8a612\.system_generated\steps\3013\output.txt', 'r') as f:
    data = json.load(f)

for table in data['tables']:
    if table['name'] == 'public.pharmacy_goods_receipts':
        print(json.dumps(table, indent=2))
        break
