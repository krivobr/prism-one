
import json
from access_parser import AccessParser

db = AccessParser(r'D:\\Projetos Novos\\Ribamar\\DGM\\DGM - CMM Votorantin.mdb')

result = {}

# TAG table
tag_data = db.parse_table('TAG')
if tag_data:
    keys = list(tag_data.keys())
    rows = []
    for i in range(len(tag_data[keys[0]])):
        row = {}
        for k in keys:
            val = tag_data[k][i] if i < len(tag_data[k]) else None
            if val is not None and val != '' and val != b'':
                row[k] = str(val)
        rows.append(row)
    result['TAG'] = rows

# Relatorios table
rel_data = db.parse_table('Relat\xf3rios')
if rel_data:
    keys = list(rel_data.keys())
    rows = []
    for i in range(len(rel_data[keys[0]])):
        row = {}
        for k in keys:
            val = rel_data[k][i] if i < len(rel_data[k]) else None
            if val is not None and val != '' and val != b'':
                row[k] = str(val)
        rows.append(row)
    result['Relatorios'] = rows

# Ultimas calibracoes
ult_data = db.parse_table('\xdaltimas calibra\xe7\xf5es')
if ult_data:
    keys = list(ult_data.keys())
    rows = []
    for i in range(len(ult_data[keys[0]])):
        row = {}
        for k in keys:
            val = ult_data[k][i] if i < len(ult_data[k]) else None
            if val is not None and val != '' and val != b'' and val != 0:
                row[k] = str(val)
        rows.append(row)
    result['Calibracoes'] = rows

with open(r'D:\\Projetos Novos\\Ribamar\\DGM\\prism-one\\scripts\\_access_data.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"TAG: {len(result.get('TAG', []))} registros")
print(f"Relatorios: {len(result.get('Relatorios', []))} registros")
print(f"Calibracoes: {len(result.get('Calibracoes', []))} registros")
