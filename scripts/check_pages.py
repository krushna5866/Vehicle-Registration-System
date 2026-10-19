import docx

doc = docx.Document(r"d:\BC project\Vehicle_Registration_System_Mini_Project_Report_RefFormat.docx")
page = 4  # section 2 starts at page 4
print("Section 0 (Front matter): Cover, Certificate, Content")

headings_seen = []
for p in doc.paragraphs:
    # check for page breaks in runs
    has_break = False
    for r in p.runs:
        if 'lastRenderedPageBreak' in r._r.xml or 'w:br w:type="page"' in r._r.xml:
            has_break = True
    if has_break:
        page += 1
    
    t = p.text.strip()
    if any(t.startswith(f"{i}.") for i in range(1, 13)):
        print(f"Page ~{page}: {t[:60]}")
