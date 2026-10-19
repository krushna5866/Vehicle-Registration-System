import docx
path = r'C:\Users\Krushna\.gemini\antigravity\brain\05af4329-1e0d-4b3d-af5b-060ca7138a6d\.user_uploaded\media_1790946874497.docx'
doc = docx.Document(path)
sec = doc.sections[0]
print(f'Page: {sec.page_width.inches:.2f}" x {sec.page_height.inches:.2f}"')
print(f'Margins: top={sec.top_margin.inches:.2f}" bottom={sec.bottom_margin.inches:.2f}" left={sec.left_margin.inches:.2f}" right={sec.right_margin.inches:.2f}"')
print()

# Get image parts (logo)
parts = doc.part.related_parts
for k,v in parts.items():
    ct = getattr(v, 'content_type', '')
    if 'image' in ct:
        img_path = v.partname
        blob = v.blob
        fname = f'd:/BC project/scripts/template_logo{k}.png'
        with open(fname, 'wb') as f:
            f.write(blob)
        print(f'Image saved: {fname} ({len(blob)//1024} KB, ct={ct})')

print()
print('=== FONT SAMPLING ===')
for p in doc.paragraphs:
    if not p.text.strip(): continue
    for r in p.runs:
        if r.text.strip():
            try:
                color = r.font.color.rgb
            except:
                color = 'none'
            print(f'  [{p.style.name}] font={r.font.name!r} size={r.font.size} bold={r.font.bold} color={color} | {r.text[:70]}')
            break
