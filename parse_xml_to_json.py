import os
import glob
import xml.etree.ElementTree as ET
import re
from html import unescape
import json

workspace = r"c:\Users\IT\Documents\SIMPANAN PK LA"

vk_map = {
    0x30: '0', 0x31: '1', 0x32: '2', 0x33: '3', 0x34: '4', 0x35: '5', 0x36: '6', 0x37: '7', 0x38: '8', 0x39: '9',
    0x41: 'A', 0x42: 'B', 0x43: 'C', 0x44: 'D', 0x45: 'E', 0x46: 'F', 0x47: 'G', 0x48: 'H',
    0x60: 'Num 0', 0x61: 'Num 1', 0x62: 'Num 2', 0x63: 'Num 3', 0x64: 'Num 4',
    0x65: 'Num 5', 0x66: 'Num 6', 0x67: 'Num 7', 0x68: 'Num 8', 0x69: 'Num 9',
    0x6A: 'Num *', 0x6B: 'Num +', 0x6D: 'Num -', 0x6E: 'Num .', 0x6F: 'Num /',
    0x2D: 'Insert', 0x2E: 'Delete', 0x21: 'Page Up', 0x22: 'Page Down', 0x24: 'Home', 0x23: 'End'
}

def clean_macro_text(raw):
    if not raw:
        return ""
    
    text = raw
    if text.startswith("text#macro:"):
        text = text[len("text#macro:"):]
    
    # Check if it has HTML body
    body_match = re.search(r'<BODY>(.*?)</BODY>', text, flags=re.DOTALL | re.IGNORECASE)
    if body_match:
        text = body_match.group(1)
    
    # Handle <BR>
    text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
    # Handle &nbsp;
    text = text.replace('&nbsp;', ' ')
    # Handle <a> tags
    def replace_a(m):
        href = m.group(1).strip()
        body = re.sub(r'<[^>]+>', '', m.group(2)).strip()
        if not body or body == href:
            return href
        return f"{body}: {href}" if not href in body else body
    text = re.sub(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', replace_a, text, flags=re.DOTALL | re.IGNORECASE)
    # Remove remaining HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Unescape HTML entities
    text = unescape(text)
    
    # Handle keystroke macros like <ent__>, <tab>, <wx>(...), <ctrl>
    if '<ent__>' in text or '<wx>' in text or '<tab>' in text or '<ctrl>' in text or '<up>' in text:
        text = text.replace('<ent__>', '\n')
        text = text.replace('<tab>', '\t')
        text = re.sub(r'<wx>\([^)]*\)', '', text)
        text = re.sub(r'<#>', '', text)
        text = re.sub(r'</?(?:ctrl|alt|shift|up|down|left|right|esc|home|end|del|ins)>', '', text)
    
    # Clean up whitespace while preserving paragraphs
    lines = [line.strip() for line in text.split('\n')]
    cleaned_lines = []
    prev_blank = False
    for line in lines:
        if not line:
            if not prev_blank:
                cleaned_lines.append("")
                prev_blank = True
        else:
            cleaned_lines.append(line)
            prev_blank = False
            
    return '\n'.join(cleaned_lines).strip()

def get_trigger(m):
    trig = m.find('trigger')
    if trig is None:
        return "-", "none"
    ts = trig.find('tscut')
    if ts is not None and ts.text and ts.text.strip():
        return ts.text.strip(), "shortcut"
    hk_str = trig.get('hk', '0')
    if hk_str and hk_str != '0':
        hk = int(hk_str)
        vk = hk & 0xFF
        key_name = vk_map.get(vk, f"Key_{vk:02X}")
        return f"Hotkey: {key_name}", "hotkey"
    return "-", "none"

file_configs = [
    ("khusus event.xml", "Khusus Event", "event"),
    ("september_pk pendamping.xml", "PK Pendamping", "pendamping"),
    ("septemper-pk anti audit.xml", "PK Anti Audit", "audit"),
    ("septemper_pihak ke 3.xml", "Pihak Ke-3", "pihak3")
]

all_templates = []
global_id = 1

for fname, category, cat_code in file_configs:
    fpath = os.path.join(workspace, fname)
    if not os.path.exists(fpath):
        print(f"Warning: {fpath} not found!")
        continue
    tree = ET.parse(fpath)
    root = tree.getroot()
    macros = root.findall('macro')
    print(f"Parsing {fname}: {len(macros)} macros")
    for idx, m in enumerate(macros):
        uid = m.get('uid', f"{cat_code}-{idx}")
        name = m.get('name', '').strip()
        raw_text = m.find('macroText').text if m.find('macroText') is not None else ""
        content = clean_macro_text(raw_text)
        trigger, trig_type = get_trigger(m)
        
        # Check if content has special clip or placeholder
        is_clip = raw_text.startswith('clip:')
        if is_clip:
            content = f"[File Clipboard: {raw_text.replace('clip:', '')}]"
            
        all_templates.append({
            "id": f"tpl_{global_id}",
            "order": global_id,
            "uid": uid,
            "category": category,
            "categoryCode": cat_code,
            "file": fname,
            "trigger": trigger,
            "triggerType": trig_type,
            "name": name,
            "content": content,
            "charCount": len(content),
            "isPinned": False,
            "copyCount": 0,
            "createdAt": "2026-09-13"
        })
        global_id += 1

print(f"\nTotal extracted templates: {len(all_templates)}")

# Ensure js directory exists
os.makedirs(os.path.join(workspace, "js"), exist_ok=True)
os.makedirs(os.path.join(workspace, "css"), exist_ok=True)

# Write to js/data.js
js_path = os.path.join(workspace, "js", "data.js")
with open(js_path, "w", encoding="utf-8") as f:
    f.write("/**\n * Dataset Template & Trigger Perfect Keyboard\n")
    f.write(f" * Total: {len(all_templates)} templates\n")
    f.write(" * Diekstrak dari: khusus event.xml, september_pk pendamping.xml, septemper-pk anti audit.xml, septemper_pihak ke 3.xml\n")
    f.write(" */\n\n")
    f.write("window.DEFAULT_TEMPLATES = ")
    f.write(json.dumps(all_templates, ensure_ascii=False, indent=2))
    f.write(";\n")

print(f"Successfully generated {js_path} ({os.path.getsize(js_path)} bytes)")

# Also save a clean JSON backup
json_path = os.path.join(workspace, "pk_templates_default.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(all_templates, f, ensure_ascii=False, indent=2)

print(f"Successfully generated {json_path} ({os.path.getsize(json_path)} bytes)")
