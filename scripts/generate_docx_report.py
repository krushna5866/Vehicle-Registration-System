import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def build_report():
    doc = docx.Document()

    # --- Page Setup (Standard A4, 1-inch margins) ---
    for section in doc.sections:
        section.page_width = Inches(8.5)
        section.page_height = Inches(11.0)
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # --- Color Palette ---
    COLOR_NAVY = RGBColor(31, 73, 125)      # Primary Header (#1F497D)
    COLOR_SLATE = RGBColor(46, 107, 158)    # Secondary Subheader (#2E6B9E)
    COLOR_TEXT = RGBColor(40, 40, 40)       # Body text Charcoal (#282828)
    COLOR_MUTED = RGBColor(90, 90, 90)      # Muted text (#5A5A5A)
    COLOR_WHITE = RGBColor(255, 255, 255)

    HEX_NAVY = "1F497D"
    HEX_SLATE = "2E6B9E"
    HEX_LIGHT_BG = "F4F6F9"
    HEX_ALT_ROW = "F8FAFC"
    HEX_BORDER = "CBD5E1"
    HEX_CALLOUT_BORDER = "1F497D"
    HEX_CALLOUT_BG = "EFF6FF"

    # --- Helper Styling Functions ---
    def set_cell_background(cell, hex_color):
        shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
        cell._tc.get_or_add_tcPr().append(shading_elm)

    def set_cell_margins(cell, top=120, bottom=120, left=160, right=160):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(
            f'<w:tcMar {nsdecls("w")}>'
            f'  <w:top w:w="{top}" w:type="dxa"/>'
            f'  <w:bottom w:w="{bottom}" w:type="dxa"/>'
            f'  <w:left w:w="{left}" w:type="dxa"/>'
            f'  <w:right w:w="{right}" w:type="dxa"/>'
            f'</w:tcMar>'
        )
        tcPr.append(tcMar)

    def set_table_borders(table, color=HEX_BORDER, sz="4", val="single"):
        tblPr = table._tbl.tblPr
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'  <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'  <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'  <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'  <w:insideV w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'  <w:left w:val="none"/>'
            f'  <w:right w:val="none"/>'
            f'</w:tblBorders>'
        )
        tblPr.append(borders)

    def style_header_row(row, col_widths=None):
        for idx, cell in enumerate(row.cells):
            set_cell_background(cell, HEX_NAVY)
            set_cell_margins(cell, top=140, bottom=140, left=160, right=160)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            if col_widths and idx < len(col_widths):
                cell.width = col_widths[idx]
            for p in cell.paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                for r in p.runs:
                    r.font.name = "Calibri"
                    r.font.size = Pt(10)
                    r.font.bold = True
                    r.font.color.rgb = COLOR_WHITE

    def style_data_row(row, is_alternate=False, col_widths=None, alignments=None):
        bg_color = HEX_ALT_ROW if is_alternate else "FFFFFF"
        for idx, cell in enumerate(row.cells):
            if bg_color != "FFFFFF":
                set_cell_background(cell, bg_color)
            set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            if col_widths and idx < len(col_widths):
                cell.width = col_widths[idx]
            for p in cell.paragraphs:
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                p.paragraph_format.line_spacing = 1.15
                if alignments and idx < len(alignments):
                    p.alignment = alignments[idx]
                for r in p.runs:
                    r.font.name = "Calibri"
                    r.font.size = Pt(9.5)
                    r.font.color.rgb = COLOR_TEXT

    def add_heading_1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(20)
        p.paragraph_format.space_after = Pt(8)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = "Calibri"
        r.font.size = Pt(15)
        r.font.bold = True
        r.font.color.rgb = COLOR_NAVY
        return p

    def add_heading_2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = "Calibri"
        r.font.size = Pt(12)
        r.font.bold = True
        r.font.color.rgb = COLOR_SLATE
        return p

    def add_heading_3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = "Calibri"
        r.font.size = Pt(11)
        r.font.bold = True
        r.font.color.rgb = COLOR_TEXT
        return p

    def add_paragraph(text, bold_prefix="", italic_prefix=False):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.font.name = "Calibri"
            r_pre.font.size = Pt(10.5)
            r_pre.font.bold = True
            if italic_prefix:
                r_pre.font.italic = True
            r_pre.font.color.rgb = COLOR_TEXT
        
        r_body = p.add_run(text)
        r_body.font.name = "Calibri"
        r_body.font.size = Pt(10.5)
        r_body.font.color.rgb = COLOR_TEXT
        return p

    def add_bullet(text, bold_prefix=""):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.font.name = "Calibri"
            r_pre.font.size = Pt(10.5)
            r_pre.font.bold = True
            r_pre.font.color.rgb = COLOR_TEXT
        r_body = p.add_run(text)
        r_body.font.name = "Calibri"
        r_body.font.size = Pt(10.5)
        r_body.font.color.rgb = COLOR_TEXT
        return p

    def add_callout(text, title="KEY TAKEAWAY"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.5)
        set_cell_background(cell, HEX_CALLOUT_BG)
        set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
        
        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'  <w:left w:val="single" w:sz="24" w:space="0" w:color="{HEX_CALLOUT_BORDER}"/>'
            f'  <w:top w:val="none"/>'
            f'  <w:right w:val="none"/>'
            f'  <w:bottom w:val="none"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(borders)
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)
        r_title = p.add_run(f"[{title}] ")
        r_title.font.name = "Calibri"
        r_title.font.size = Pt(10)
        r_title.font.bold = True
        r_title.font.color.rgb = COLOR_NAVY
        
        r_text = p.add_run(text)
        r_text.font.name = "Calibri"
        r_text.font.size = Pt(9.5)
        r_text.font.italic = True
        r_text.font.color.rgb = COLOR_TEXT
        
        p_after = doc.add_paragraph()
        p_after.paragraph_format.space_before = Pt(0)
        p_after.paragraph_format.space_after = Pt(4)

    def add_code_block(code_text):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.5)
        set_cell_background(cell, HEX_LIGHT_BG)
        set_cell_margins(cell, top=120, bottom=120, left=150, right=150)
        
        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'  <w:top w:val="single" w:sz="6" w:space="0" w:color="{HEX_BORDER}"/>'
            f'  <w:left w:val="single" w:sz="6" w:space="0" w:color="{HEX_BORDER}"/>'
            f'  <w:bottom w:val="single" w:sz="6" w:space="0" w:color="{HEX_BORDER}"/>'
            f'  <w:right w:val="single" w:sz="6" w:space="0" w:color="{HEX_BORDER}"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(borders)
        
        lines = code_text.strip().split("\n")
        for idx, line in enumerate(lines):
            if idx == 0:
                p = cell.paragraphs[0]
            else:
                p = cell.add_paragraph()
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.05
            r = p.add_run(line)
            r.font.name = "Consolas"
            r.font.size = Pt(8.5)
            r.font.color.rgb = RGBColor(30, 41, 59)
        
        p_after = doc.add_paragraph()
        p_after.paragraph_format.space_before = Pt(0)
        p_after.paragraph_format.space_after = Pt(4)

    def add_figure(image_path, caption_text, width=Inches(6.0)):
        """Embeds a high-resolution diagram with a professional caption."""
        if os.path.exists(image_path):
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(10)
            p_img.paragraph_format.space_after = Pt(3)
            p_img.paragraph_format.keep_with_next = True
            r_img = p_img.add_run()
            r_img.add_picture(image_path, width=width)
            
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_before = Pt(2)
            p_cap.paragraph_format.space_after = Pt(12)
            p_cap.paragraph_format.keep_with_next = False
            r_cap = p_cap.add_run(caption_text)
            r_cap.font.name = "Calibri"
            r_cap.font.size = Pt(9.5)
            r_cap.font.bold = True
            r_cap.font.color.rgb = COLOR_SLATE

    # =========================================================================
    # 1. COVER PAGE (Academic Year 2025–2026, MGM University)
    # =========================================================================
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_before = Pt(24)
    p_inst.paragraph_format.space_after = Pt(2)
    r1 = p_inst.add_run("School of Engineering and Technology, MGM University\n")
    r1.font.name = "Calibri"
    r1.font.size = Pt(16)
    r1.font.bold = True
    r1.font.color.rgb = COLOR_NAVY
    r2 = p_inst.add_run("Chh. Sambhajinagar\n")
    r2.font.name = "Calibri"
    r2.font.size = Pt(13)
    r2.font.bold = True
    r2.font.color.rgb = COLOR_SLATE
    r3 = p_inst.add_run("Academic Year 2025–2026")
    r3.font.name = "Calibri"
    r3.font.size = Pt(11)
    r3.font.italic = True
    r3.font.color.rgb = COLOR_MUTED

    p_div1 = doc.add_paragraph()
    p_div1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_div1.paragraph_format.space_before = Pt(10)
    p_div1.paragraph_format.space_after = Pt(10)
    r_div1 = p_div1.add_run("________________________________________________________")
    r_div1.font.color.rgb = COLOR_SLATE

    p_proj = doc.add_paragraph()
    p_proj.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_proj.paragraph_format.space_before = Pt(6)
    p_proj.paragraph_format.space_after = Pt(4)
    r_rep = p_proj.add_run("Mini Project Report\n")
    r_rep.font.name = "Calibri"
    r_rep.font.size = Pt(14)
    r_rep.font.bold = True
    r_rep.font.color.rgb = COLOR_SLATE
    r_on = p_proj.add_run("On\n\n")
    r_on.font.name = "Calibri"
    r_on.font.size = Pt(12)
    r_on.font.italic = True
    r_on.font.color.rgb = COLOR_MUTED

    r_title = p_proj.add_run("“Decentralized Vehicle Registration & Immutable Title Management System Using Blockchain Technology”\n")
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(17)
    r_title.font.bold = True
    r_title.font.color.rgb = COLOR_NAVY

    p_subm = doc.add_paragraph()
    p_subm.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_subm.paragraph_format.space_before = Pt(16)
    p_subm.paragraph_format.space_after = Pt(2)
    r_sub1 = p_subm.add_run("Submitted in partial fulfillment for the Sixth Semester of\n")
    r_sub1.font.name = "Calibri"
    r_sub1.font.size = Pt(10.5)
    r_sub1.font.color.rgb = COLOR_TEXT
    r_sub2 = p_subm.add_run("B.Tech (Integrated) in\n")
    r_sub2.font.name = "Calibri"
    r_sub2.font.size = Pt(11)
    r_sub2.font.bold = True
    r_sub3 = p_subm.add_run("COMPUTER SCIENCE AND ENGINEERING\n")
    r_sub3.font.name = "Calibri"
    r_sub3.font.size = Pt(13)
    r_sub3.font.bold = True
    r_sub3.font.color.rgb = COLOR_NAVY
    r_sub4 = p_subm.add_run("(IoT, Cyber Security Including Blockchain Technology)")
    r_sub4.font.name = "Calibri"
    r_sub4.font.size = Pt(11)
    r_sub4.font.bold = True
    r_sub4.font.color.rgb = COLOR_SLATE

    p_by = doc.add_paragraph()
    p_by.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_by.paragraph_format.space_before = Pt(18)
    p_by.paragraph_format.space_after = Pt(6)
    r_by = p_by.add_run("Submitted By:")
    r_by.font.name = "Calibri"
    r_by.font.size = Pt(11)
    r_by.font.bold = True
    r_by.font.color.rgb = COLOR_NAVY

    # Student Details Table
    tbl_students = doc.add_table(rows=3, cols=2)
    tbl_students.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_students, color="CBD5E1", sz="4")
    col_w_stud = [Inches(3.2), Inches(2.3)]

    hdr_stud = tbl_students.rows[0]
    hdr_stud.cells[0].paragraphs[0].text = "Name of Student"
    hdr_stud.cells[1].paragraphs[0].text = "PRN Number"
    style_header_row(hdr_stud, col_w_stud)

    r_s1 = tbl_students.rows[1]
    r_s1.cells[0].paragraphs[0].text = "Rohit Dhananjay Kale"
    r_s1.cells[1].paragraphs[0].text = "202356112007"
    style_data_row(r_s1, is_alternate=False, col_widths=col_w_stud, alignments=[WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER])

    r_s2 = tbl_students.rows[2]
    r_s2.cells[0].paragraphs[0].text = "Soham Bhagwan Deshmukh"
    r_s2.cells[1].paragraphs[0].text = "202356112008"
    style_data_row(r_s2, is_alternate=True, col_widths=col_w_stud, alignments=[WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER])

    # Guide Section
    p_guide = doc.add_paragraph()
    p_guide.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_guide.paragraph_format.space_before = Pt(22)
    p_guide.paragraph_format.space_after = Pt(2)
    r_gu1 = p_guide.add_run("Under the Guidance of:\n")
    r_gu1.font.name = "Calibri"
    r_gu1.font.size = Pt(10.5)
    r_gu1.font.bold = True
    r_gu1.font.color.rgb = COLOR_MUTED
    r_gu2 = p_guide.add_run("Ms. Bhagat C. B.\n")
    r_gu2.font.name = "Calibri"
    r_gu2.font.size = Pt(12)
    r_gu2.font.bold = True
    r_gu2.font.color.rgb = COLOR_NAVY
    r_gu3 = p_guide.add_run("(Assistant Professor)\nDEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING")
    r_gu3.font.name = "Calibri"
    r_gu3.font.size = Pt(10)
    r_gu3.font.color.rgb = COLOR_TEXT

    doc.add_page_break()

    # =========================================================================
    # 2. CERTIFICATE PAGE
    # =========================================================================
    p_cert_title = doc.add_paragraph()
    p_cert_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cert_title.paragraph_format.space_before = Pt(30)
    p_cert_title.paragraph_format.space_after = Pt(16)
    r_ct = p_cert_title.add_run("CERTIFICATE")
    r_ct.font.name = "Calibri"
    r_ct.font.size = Pt(18)
    r_ct.font.bold = True
    r_ct.font.color.rgb = COLOR_NAVY

    p_cert_body = doc.add_paragraph()
    p_cert_body.paragraph_format.space_before = Pt(12)
    p_cert_body.paragraph_format.space_after = Pt(14)
    p_cert_body.paragraph_format.line_spacing = 1.3
    r_cb1 = p_cert_body.add_run("This is to certify that ")
    r_cb1.font.size = Pt(11)
    r_cb2 = p_cert_body.add_run("Rohit Dhananjay Kale ")
    r_cb2.font.size = Pt(11)
    r_cb2.font.bold = True
    r_cb3 = p_cert_body.add_run("and ")
    r_cb3.font.size = Pt(11)
    r_cb4 = p_cert_body.add_run("Soham Bhagwan Deshmukh ")
    r_cb4.font.size = Pt(11)
    r_cb4.font.bold = True
    r_cb5 = p_cert_body.add_run("with PRN Numbers ")
    r_cb5.font.size = Pt(11)
    r_cb6 = p_cert_body.add_run("202356112007 ")
    r_cb6.font.size = Pt(11)
    r_cb6.font.bold = True
    r_cb7 = p_cert_body.add_run("and ")
    r_cb7.font.size = Pt(11)
    r_cb8 = p_cert_body.add_run("202356112008 ")
    r_cb8.font.size = Pt(11)
    r_cb8.font.bold = True
    r_cb9 = p_cert_body.add_run("have successfully completed their Mini-Project entitled:\n\n")
    r_cb9.font.size = Pt(11)

    p_cert_proj = doc.add_paragraph()
    p_cert_proj.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cert_proj.paragraph_format.space_before = Pt(6)
    p_cert_proj.paragraph_format.space_after = Pt(14)
    r_cp = p_cert_proj.add_run("“Decentralized Vehicle Registration & Immutable Title Management System Using Blockchain Technology”")
    r_cp.font.name = "Calibri"
    r_cp.font.size = Pt(13)
    r_cp.font.bold = True
    r_cp.font.color.rgb = COLOR_NAVY

    p_cert_tail = doc.add_paragraph()
    p_cert_tail.paragraph_format.space_before = Pt(6)
    p_cert_tail.paragraph_format.space_after = Pt(40)
    p_cert_tail.paragraph_format.line_spacing = 1.3
    r_ct1 = p_cert_tail.add_run(
        "in the Course of Blockchain Technology & Cyber Security in the Sixth Semester during the tenure "
        "of completing the B.Tech (Integrated) program in Computer Science and Engineering "
        "(IoT, Cyber Security Including Blockchain Technology) from School of Engineering and Technology, "
        "MGM University, Chh. Sambhajinagar."
    )
    r_ct1.font.size = Pt(11)

    # Signature Block Table
    tbl_sig = doc.add_table(rows=2, cols=2)
    tbl_sig.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_sig, color="FFFFFF", sz="0") # invisible borders
    col_w_sig = [Inches(3.3), Inches(3.2)]

    row_s1 = tbl_sig.rows[0]
    row_s1.cells[0].paragraphs[0].text = "______________________________\nMs. Bhagat C. B."
    row_s1.cells[1].paragraphs[0].text = "______________________________\nMs. Rathi S. R."
    
    for c in row_s1.cells:
        for p in c.paragraphs:
            p.paragraph_format.line_spacing = 1.2
            for r in p.runs:
                r.font.name = "Calibri"
                r.font.size = Pt(11)
                r.font.bold = True
                r.font.color.rgb = COLOR_NAVY

    row_s2 = tbl_sig.rows[1]
    row_s2.cells[0].paragraphs[0].text = "Guide, Asst. Professor\nDepartment of CSE\nSchool of Engineering & Technology\nMGM University, Chh. Sambhajinagar"
    row_s2.cells[1].paragraphs[0].text = "Head of Department (HOD)\nDepartment of CSE\nSchool of Engineering & Technology\nMGM University, Chh. Sambhajinagar"
    
    for c in row_s2.cells:
        for p in c.paragraphs:
            p.paragraph_format.line_spacing = 1.15
            for r in p.runs:
                r.font.name = "Calibri"
                r.font.size = Pt(9.5)
                r.font.color.rgb = COLOR_TEXT

    doc.add_page_break()

    # =========================================================================
    # 3. TABLE OF CONTENTS
    # =========================================================================
    p_toc_title = doc.add_paragraph()
    p_toc_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_toc_title.paragraph_format.space_before = Pt(16)
    p_toc_title.paragraph_format.space_after = Pt(14)
    r_toc = p_toc_title.add_run("TABLE OF CONTENTS")
    r_toc.font.name = "Calibri"
    r_toc.font.size = Pt(16)
    r_toc.font.bold = True
    r_toc.font.color.rgb = COLOR_NAVY

    toc_items = [
        ("1", "Abstract", "01"),
        ("2", "Introduction & Problem Formulation", "02"),
        ("3", "Course Outcomes Integrated", "04"),
        ("4", "Action Plan & Project Timeline", "05"),
        ("5", "Literature Review & Architectural Comparison", "06"),
        ("6", "Proposed Methodology & System Architecture", "08"),
        ("7", "Implementation Details (Smart Contract & Web3 UI)", "11"),
        ("8", "Outputs of the Mini-Project & Automated Verification", "15"),
        ("9", "Skills Developed / Learning Out of this Project", "18"),
        ("10", "Practical Applications of the Mini-Project", "19"),
        ("11", "Areas of Future Improvement", "20"),
        ("12", "Conclusion", "21")
    ]

    tbl_toc = doc.add_table(rows=len(toc_items) + 1, cols=3)
    tbl_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_toc, color="CBD5E1", sz="4")
    col_w_toc = [Inches(1.0), Inches(4.5), Inches(1.0)]

    hdr_toc = tbl_toc.rows[0]
    hdr_toc.cells[0].paragraphs[0].text = "Sr. No"
    hdr_toc.cells[1].paragraphs[0].text = "Title / Chapter"
    hdr_toc.cells[2].paragraphs[0].text = "Page No."
    style_header_row(hdr_toc, col_w_toc)

    for i, item in enumerate(toc_items):
        row = tbl_toc.rows[i + 1]
        row.cells[0].paragraphs[0].text = item[0]
        row.cells[1].paragraphs[0].text = item[1]
        row.cells[2].paragraphs[0].text = item[2]
        style_data_row(row, is_alternate=(i % 2 == 1), col_widths=col_w_toc, alignments=[WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER])

    doc.add_page_break()

    # =========================================================================
    # SECTION 1: ABSTRACT
    # =========================================================================
    add_heading_1("1. Abstract")
    
    add_paragraph(
        "When buying or selling a vehicle today, citizens and transport authorities rely heavily on central databases "
        "(such as regional RTO servers and national portals). While computerized records are more convenient than old paper files, "
        "they suffer from fundamental architectural weaknesses: centralized databases have a single point of failure, records can "
        "be silently tampered with by corrupt insiders or cyber attackers, and innocent buyers frequently fall victim to stolen "
        "cars re-stamped with cloned vehicle identification numbers (phantom vehicles). Furthermore, storing sensitive personal "
        "details in central databases puts millions of citizens at risk of massive privacy leaks."
    )
    
    add_paragraph(
        "This mini-project presents a practical, secure, and privacy-preserving Decentralized Vehicle Registration & Title "
        "Management System built using Ethereum smart contracts (VehicleRegistry.sol) and a modern React Web3 application. "
        "The project is built on a clear, human-centered philosophy: the blockchain is used to prove that a vehicle title exists, "
        "to track its complete chain of custody without any chance of forgery, and to enforce legal rules—without ever dumping "
        "citizens' private personal information onto a public ledger."
    )

    add_paragraph(
        "To protect citizen privacy while keeping the ledger completely auditable, our system uses cryptographic commitments "
        "(Keccak-256 digital fingerprints) for the Vehicle Identification Number (VIN) and the High Security Registration Plate (HSRP). "
        "Only these unique digital fingerprints live on-chain. Sensitive details (owner names, contact information, and detailed vehicular "
        "specifications) remain protected in an off-chain secure vault. Furthermore, we introduced an uncompromising anti-corruption check: "
        "on-chain rules strictly forbid any RTO official from holding a vehicle title in their official authority wallet, completely eliminating "
        "conflicts of interest."
    )

    add_paragraph(
        "Transport department administrative tasks are clearly separated between an RTO Registrar (who registers new vehicles and officially "
        "approves ownership transfers) and an RTO Enforcement Officer (who conducts fitness checks and marks totaled or aged vehicles as "
        "permanently scrapped). The entire decentralized system was rigorously validated through 40 automated test cases with a 100% pass "
        "rate, verifying 16 critical security rules, safe two-step ownership transfers, and live smart contract execution."
    )

    add_callout(
        "Our system proves that blockchain technology can modernize government transport registries by eliminating paperwork fraud "
        "and database tampering, while fully protecting citizen privacy and preventing administrative abuse.",
        title="CORE PHILOSOPHY"
    )

    # =========================================================================
    # SECTION 2: INTRODUCTION & PROBLEM FORMULATION
    # =========================================================================
    add_heading_1("2. Introduction & Problem Formulation")

    add_paragraph(
        "A vehicle title deed or Registration Certificate (RC) is one of the most important legal documents a citizen holds. "
        "It defines legal ownership, determines tax and insurance liability, and establishes accountability in cases of road accidents, "
        "theft, or traffic violations. In India, Regional Transport Offices (RTOs) operating under the Motor Vehicles Act administer "
        "these records for over 300 million registered vehicles."
    )

    add_heading_2("2.1 The Real-World Problems We Are Solving")
    add_paragraph(
        "Despite computerization through central portals like Vahan, several dangerous vulnerabilities persist in current transport systems:"
    )

    add_bullet(
        "Stolen cars are often disguised using the identity of an existing, legally registered car in another state. Criminals alter the "
        "chassis plate and print fake Registration Certificates. Unsuspecting buyers purchase these cars, only to have them confiscated "
        "later by law enforcement.",
        bold_prefix="1. Fake Papers and 'Phantom' Vehicles: "
    )
    add_bullet(
        "Because all records reside on central SQL databases, any rogue administrative employee or external hacker who gains access to "
        "the server can quietly alter the owner's name, remove active bank loan hypothecations, or change a vehicle's status without creating "
        "an immutable, unchangeable audit trail.",
        bold_prefix="2. Vulnerability of Centralized Databases: "
    )
    add_bullet(
        "A public blockchain like Ethereum is visible to everyone in the world. If an engineering team naively places citizen names, "
        "residential addresses, phone numbers, and license plates directly into smart contracts, anyone could easily track citizens' "
        "daily movements and home locations, creating severe privacy and physical safety risks.",
        bold_prefix="3. The Privacy vs Transparency Dilemma: "
    )
    add_bullet(
        "In many administrative portals, permissions are loosely managed. An official might have administrative powers to reassign "
        "impounded or disputed vehicles into personal or family accounts without any automated technical barriers stopping them.",
        bold_prefix="4. Conflicts of Interest and Unrestricted Authority: "
    )
    add_bullet(
        "When an insurance company declares a car as a total loss after a severe crash, the salvage chassis is sometimes secretly rebuilt "
        "and re-registered. Buyers have no easy way to verify whether the car was previously written off or scrapped.",
        bold_prefix="5. Salvage Title Fraud and Odometer Rollbacks: "
    )

    add_heading_2("2.2 Mini-Project Objectives")
    add_paragraph(
        "To address these exact challenges, our project was designed around five concrete engineering goals:"
    )
    add_bullet("Represent every vehicle's legal title as an ERC-721 non-fungible digital token minted exclusively by authorized state registrars.", bold_prefix="• Immutable Digital Titles: ")
    add_bullet("Store only Keccak-256 cryptographic commitments of VINs and license plates on-chain to guarantee anti-duplication without exposing personal identity.", bold_prefix="• Privacy by Design: ")
    add_bullet("Enforce a hard mathematical invariant (PrivilegedAddressCannotOwnVehicle) ensuring that no official RTO wallet can ever own a citizen vehicle.", bold_prefix="• Anti-Corruption Role Boundaries: ")
    add_bullet("Implement a regulated two-step transfer workflow where citizens initiate the sale request, but an authorized RTO Registrar must verify and confirm the transfer on-chain.", bold_prefix="• Statutory Legal Transfer: ")
    add_bullet("Provide an irreversible on-chain terminal state machine so that once a vehicle is scrapped by an officer, it can never be transferred or driven again.", bold_prefix="• Permanent Scrappage Protection: ")

    # =========================================================================
    # SECTION 3: COURSE OUTCOMES INTEGRATED
    # =========================================================================
    add_heading_1("3. Course Outcomes Integrated")

    add_paragraph(
        "This mini-project directly applies the core theoretical concepts and hands-on laboratory competencies learned in the "
        "B.Tech (Integrated) Computer Science and Engineering curriculum specializing in IoT, Cyber Security & Blockchain Technology. "
        "The table below illustrates how specific Course Outcomes (COs) were practically realized in this project:"
    )

    co_data = [
        ("CO1", "Cryptographic Foundations & Hashing", 
         "Applied Keccak-256 cryptographic hashing to create digital commitments for VIN and plate numbers. Implemented EIP-191 cryptographic signatures for wallet authentication challenges."),
        ("CO2", "Smart Contract Engineering & Security", 
         "Developed and compiled gas-optimized Solidity 0.8.24 contracts using OpenZeppelin 5.0 libraries (ERC721, AccessControl, Pausable). Created custom error hooks and state machine guards."),
        ("CO3", "Role-Based Access Control (RBAC)", 
         "Designed strict privilege boundaries separating RTO Registrars, RTO Enforcement Officers, Admins, and Citizens. Programmed on-chain checks preventing conflict-of-interest asset ownership."),
        ("CO4", "Web3 Decentralized Application Architecture", 
         "Integrated React 18, Vite, and Ethers.js v6 with an Ethereum JSON-RPC provider. Built reactive route guards, MetaMask account listeners, and real-time smart contract event processing."),
        ("CO5", "Security Auditing, Verification & Testing", 
         "Authored an exhaustive 40-test automated verification suite in Hardhat and Chai, verifying 16 negative security invariants, boundary conditions, and EVM gas profiles.")
    ]

    tbl_co = doc.add_table(rows=len(co_data) + 1, cols=3)
    tbl_co.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_co, color="CBD5E1", sz="4")
    col_w_co = [Inches(0.9), Inches(2.2), Inches(3.4)]

    hdr_co = tbl_co.rows[0]
    hdr_co.cells[0].paragraphs[0].text = "CO Code"
    hdr_co.cells[1].paragraphs[0].text = "Curricular Competency"
    hdr_co.cells[2].paragraphs[0].text = "Practical Implementation in Mini-Project"
    style_header_row(hdr_co, col_w_co)

    for i, item in enumerate(co_data):
        row = tbl_co.rows[i + 1]
        row.cells[0].paragraphs[0].text = item[0]
        row.cells[1].paragraphs[0].text = item[1]
        row.cells[2].paragraphs[0].text = item[2]
        style_data_row(row, is_alternate=(i % 2 == 1), col_widths=col_w_co, alignments=[WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT])

    # =========================================================================
    # SECTION 4: ACTION PLAN & PROJECT TIMELINE
    # =========================================================================
    add_heading_1("4. Action Plan & Project Timeline")

    add_paragraph(
        "The project was executed methodically across six distinct phases during the academic semester, from August 2025 to October 2025. "
        "Both team members collaborated closely, with clear ownership of cryptographic smart contracts, frontend interfaces, and testing."
    )

    action_data = [
        ("1", "Problem Formulation, Regulatory Workflow Analysis (Form 29/30), and System Architecture Design", "01-Aug-2025", "12-Aug-2025", "Rohit Kale, Soham Deshmukh"),
        ("2", "Smart Contract Development (VehicleRegistry.sol): OpenZeppelin RBAC, ERC-721 Title Minting", "13-Aug-2025", "28-Aug-2025", "Rohit Dhananjay Kale"),
        ("3", "Privacy Architecture Implementation: Keccak-256 Commitments & Secure Off-Chain Storage Layer", "29-Aug-2025", "10-Sep-2025", "Soham Bhagwan Deshmukh"),
        ("4", "Security Invariant Enforcement: Citizen vs RTO Authority Boundaries, Transfer & Scrappage State Machines", "11-Sep-2025", "24-Sep-2025", "Rohit Dhananjay Kale"),
        ("5", "Web3 Frontend Development: React/Vite UI, HSRP Component, Isolated Citizen & RTO Dashboards", "25-Sep-2025", "12-Oct-2025", "Soham Bhagwan Deshmukh"),
        ("6", "Comprehensive Hardhat Testing (40 Test Cases), Live Node Proof Script, and Final Documentation", "13-Oct-2025", "28-Oct-2025", "Rohit Kale, Soham Deshmukh")
    ]

    tbl_act = doc.add_table(rows=len(action_data) + 1, cols=5)
    tbl_act.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_act, color="CBD5E1", sz="4")
    col_w_act = [Inches(0.6), Inches(2.7), Inches(1.1), Inches(1.1), Inches(1.0)]

    hdr_act = tbl_act.rows[0]
    hdr_act.cells[0].paragraphs[0].text = "S. No."
    hdr_act.cells[1].paragraphs[0].text = "Details of Activity"
    hdr_act.cells[2].paragraphs[0].text = "Start Date"
    hdr_act.cells[3].paragraphs[0].text = "Finish Date"
    hdr_act.cells[4].paragraphs[0].text = "Team Member"
    style_header_row(hdr_act, col_w_act)

    for i, item in enumerate(action_data):
        row = tbl_act.rows[i + 1]
        row.cells[0].paragraphs[0].text = item[0]
        row.cells[1].paragraphs[0].text = item[1]
        row.cells[2].paragraphs[0].text = item[2]
        row.cells[3].paragraphs[0].text = item[3]
        row.cells[4].paragraphs[0].text = item[4]
        style_data_row(row, is_alternate=(i % 2 == 1), col_widths=col_w_act, alignments=[WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT])

    # =========================================================================
    # SECTION 5: LITERATURE REVIEW & ARCHITECTURAL COMPARISON
    # =========================================================================
    add_heading_1("5. Literature Review & Architectural Comparison")

    add_paragraph(
        "To design an effective solution, we examined existing academic literature and industrial systems in digital asset registration."
    )

    add_heading_2("5.1 Centralized Government Systems (Vahan & Parivahan)")
    add_paragraph(
        "National platforms such as the Vahan portal modernized vehicle registration by consolidating state-level databases into a unified "
        "cloud repository. While this made interstate tax calculations and vehicle lookups easier, researchers have noted that centralized "
        "databases remain vulnerable to single points of failure, cyber attacks, and insider tampering. If a corrupt official alters "
        "a record inside a central database table, there is no decentralized cryptographic consensus to detect or prevent the modification."
    )

    add_heading_2("5.2 Previous Academic Blockchain Approaches")
    add_paragraph(
        "Earlier academic attempts to place vehicle registration onto blockchains suffered from two critical shortcomings:"
    )
    add_bullet(
        "Most initial university projects stored full citizen names, phone numbers, and plain registration numbers directly inside Solidity "
        "variables. Because public blockchains allow anyone to read state storage, this severely violates citizen privacy regulations such "
        "as India's Digital Personal Data Protection Act (DPDPA 2023) and Europe's GDPR.",
        bold_prefix="1. The Public Ledger Privacy Trap: "
    )
    add_bullet(
        "Many projects treated cars like cryptocurrencies, allowing any owner to instantly transfer title tokens directly to another wallet "
        "without any governmental oversight. In reality, vehicle transfer requires statutory clearance from the transport authority "
        "(such as checking road taxes, traffic fines, pollution certificates, and bank hypothecations).",
        bold_prefix="2. The Unregulated P2P Reassignment Flaw: "
    )

    add_heading_2("5.3 Comparative Analysis")
    add_paragraph(
        "The table below highlights the distinct architectural differences between legacy databases, naive blockchain prototypes, and our proposed system:"
    )

    comp_data = [
        ("Storage Model", "Centralized SQL Database", "100% On-Chain Public Ledger", "Hybrid: Commitments On-Chain, Encrypted Data Off-Chain"),
        ("Tamper Resistance", "Low (Vulnerable to DB admins)", "High (Immutable EVM state)", "Extremely High (Consensus + Merkle validation)"),
        ("Citizen Privacy", "Susceptible to central server leaks", "Zero (Plaintext PII on-chain)", "High (Keccak-256 hashes, zero PII on-chain)"),
        ("Role Boundaries", "Basic login usernames/passwords", "Single admin or no roles", "Strict RBAC: Admin vs Registrar vs Officer vs Citizen"),
        ("Transfer Process", "Manual paperwork / semi-automated", "Unregulated P2P token transfer", "Fully Compliant (Statutory RTO transfer approval)"),
        ("Scrappage Record", "Paper scrap certificate", "Simple boolean flag", "Irreversible On-Chain Terminal Scrappage State")
    ]

    tbl_comp = doc.add_table(rows=len(comp_data) + 1, cols=4)
    tbl_comp.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_comp, color="CBD5E1", sz="4")
    col_w_comp = [Inches(1.4), Inches(1.6), Inches(1.6), Inches(1.9)]

    hdr_comp = tbl_comp.rows[0]
    hdr_comp.cells[0].paragraphs[0].text = "Evaluation Metric"
    hdr_comp.cells[1].paragraphs[0].text = "Traditional Database"
    hdr_comp.cells[2].paragraphs[0].text = "Naive Blockchain Projects"
    hdr_comp.cells[3].paragraphs[0].text = "Our Proposed Architecture"
    style_header_row(hdr_comp, col_w_comp)

    for i, item in enumerate(comp_data):
        row = tbl_comp.rows[i + 1]
        row.cells[0].paragraphs[0].text = item[0]
        row.cells[1].paragraphs[0].text = item[1]
        row.cells[2].paragraphs[0].text = item[2]
        row.cells[3].paragraphs[0].text = item[3]
        style_data_row(row, is_alternate=(i % 2 == 1), col_widths=col_w_comp, alignments=[WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT])

    # =========================================================================
    # SECTION 6: PROPOSED METHODOLOGY & SYSTEM ARCHITECTURE
    # =========================================================================
    add_heading_1("6. Proposed Methodology & System Architecture")

    add_paragraph(
        "Our system adopts a multi-tiered architecture that balances strict security, legal compliance, and user simplicity. "
        "The architecture is organized into four interconnected planes as shown in Figure 6.1 below:"
    )

    DIAGRAMS_DIR = os.path.abspath(r"d:\BC project\docs\diagrams")
    add_figure(
        os.path.join(DIAGRAMS_DIR, "diagram_1_system_architecture.png"),
        "Figure 6.1: 4-Tier Decentralized Vehicle Registration Architecture (User, Web3 Client, Cryptographic Privacy, and Smart Contract Planes)",
        width=Inches(6.2)
    )

    add_paragraph(
        "The four planes work together seamlessly:",
        bold_prefix="Architectural Overview: "
    )
    add_bullet("Everyday citizens, prospective car buyers, RTO Registrars, and RTO Enforcement Officers interact with the platform according to their real-world responsibilities.", bold_prefix="1. User Tier: ")
    add_bullet("Built using React 18, Vite, and Ethers.js v6. It features smart route guards (CitizenGuard and RtoGuard). If an official or citizen switches their account in MetaMask, the session instantly clears to prevent unauthorized access.", bold_prefix="2. Web3 Client & Security Tier: ")
    add_bullet("Acts as a privacy shield. Instead of putting personal names and phone numbers onto the public blockchain, this layer turns vehicle chassis and plate numbers into 32-byte cryptographic digital fingerprints (hashes). Private citizen details stay protected in an off-chain encrypted vault.", bold_prefix="3. Cryptographic Privacy Tier: ")
    add_bullet("Written in Solidity 0.8.24 running on Ethereum. It manages official ERC-721 digital title tokens, strictly controls authority permissions, executes ownership transfers, and permanently records the complete history of every vehicle.", bold_prefix="4. Blockchain Smart Contract Tier: ")

    add_heading_2("6.1 How Cryptographic Commitments Work (Explained Simply)")
    add_paragraph(
        "Think of a cryptographic hash like a digital wax seal or a fingerprint. You can easily compare fingerprints to see if they "
        "match, but you can never reconstruct a person's entire body or face just by looking at their fingerprint. "
        "In our system, before any vehicle data reaches the blockchain, we compute three digital fingerprints:"
    )
    add_bullet("We remove spaces and convert to uppercase, then hash the chassis number: keccak256(normalize(VIN)). This guarantees that no two cars can ever claim the same VIN on-chain.", bold_prefix="1. VIN Commitment: ")
    add_bullet("We format the license plate (e.g., MH20DE1234) and hash it: keccak256(normalize(Plate)). This makes it impossible to register duplicate plates.", bold_prefix="2. Plate Commitment: ")
    add_bullet("A combined hash of make, model, fuel type, and manufacturing year: keccak256(CanonicalJSON(specs)).", bold_prefix="3. Vehicular Metadata Hash: ")

    add_figure(
        os.path.join(DIAGRAMS_DIR, "diagram_5_privacy_commitments.png"),
        "Figure 6.2: Cryptographic Commitment Scheme for Citizen Privacy & Data Integrity",
        width=Inches(6.2)
    )

    add_paragraph(
        "Because only these 32-byte hashes reside on the blockchain, an outside observer cannot tell who owns the car or where they live. "
        "However, when a police officer or an RTO official scans a physical car's paperwork, the system hashes the scanned data and checks "
        "instantly if it matches the immutable on-chain record. If even a single letter in the chassis or plate number was tampered with, "
        "the hashes will not match, exposing the fraud immediately."
    )

    add_heading_2("6.2 Clear Separation Between the Two RTO Roles & Authority Boundaries")
    add_paragraph(
        "In many government portals, administrative users are given broad permissions. This creates severe risks of corruption, "
        "such as an official transferring seized vehicles to their own name or registering cars without proper inspection. "
        "To solve this, our system enforces a strict separation of powers between two distinct RTO roles, as illustrated in Figure 6.3:"
    )

    add_figure(
        os.path.join(DIAGRAMS_DIR, "diagram_2_role_boundaries.png"),
        "Figure 6.3: Role-Based Access Control (RBAC) Matrix & Zero Conflict-of-Interest Authority Boundaries",
        width=Inches(6.2)
    )

    add_bullet(
        "Acts like the office desk superintendent. They verify citizen paperwork, mint new vehicle title tokens to citizen wallets, "
        "and officially execute ownership transfers once all tax and legal requirements are met. Crucially, the Registrar is blocked on-chain "
        "from scrapping or decommissioning vehicles.",
        bold_prefix="• RTO Registrar (RTO_REGISTRAR_ROLE): "
    )
    add_bullet(
        "Acts like the field inspection officer at the vehicle testing ground. They inspect vehicles for fitness and roadworthiness. If a vehicle "
        "is 15+ years old or totaled in an accident, the Enforcement Officer invokes updateVehicleState() to mark it as Scrapped. The Officer "
        "is strictly barred on-chain from registering new vehicles or transferring titles.",
        bold_prefix="• RTO Enforcement Officer (RTO_OFFICER_ROLE): "
    )
    add_bullet(
        "To completely prevent bribery and corruption, our smart contract enforces a hard rule: no wallet holding an Admin or RTO role can ever "
        "own a vehicle title or receive a vehicle transfer. If anyone attempts to transfer a car to an official wallet, the smart contract reverts "
        "immediately with the custom error PrivilegedAddressCannotOwnVehicle.",
        bold_prefix="• The Anti-Corruption Invariant: "
    )

    add_heading_2("6.3 The Statutory Two-Step Ownership Transfer Workflow (Form 29 / 30)")
    add_paragraph(
        "In naive blockchain projects, anyone can transfer a car directly to another wallet like sending cryptocurrency. In the real world, "
        "this is illegal—the law requires that ownership transfers be officially verified by the regional transport office to ensure taxes are "
        "paid, traffic fines are cleared, and the seller has valid loan clearance. "
        "Our system strictly models the legal process (Form 29 Notice of Transfer and Form 30 Application for Transfer) as shown in Figure 6.4:"
    )

    add_figure(
        os.path.join(DIAGRAMS_DIR, "diagram_3_transfer_workflow.png"),
        "Figure 6.4: Statutory Two-Step Vehicle Ownership Transfer Workflow (Form 29 / 30 Compliance)",
        width=Inches(6.2)
    )

    add_bullet("The current citizen owner logs into the Citizen Portal and submits a transfer request by specifying the buyer's wallet address. This records the intent on-chain, but the car remains in the seller's name while pending.", bold_prefix="Step 1 (Citizen Transfer Notice): ")
    add_bullet("The RTO Registrar reviews the transfer request, verifies buyer/seller identity, checks that road tax and fines are settled, and invokes transferOwnershipByRTO(). The smart contract transfers the digital title token to the buyer and permanently appends the new owner to the vehicle's chronological history.", bold_prefix="Step 2 (RTO Verification & Execution): ")

    add_heading_2("6.4 Permanent Scrappage & Terminal Lock")
    add_paragraph(
        "When a vehicle is involved in a catastrophic accident or exceeds its statutory lifespan (15+ years), it poses a severe safety hazard. "
        "In the traditional system, unscrupulous salvage operators frequently rebuild totaled cars, forge paperwork, and sell them as roadworthy. "
        "Our system eliminates this danger using an irreversible state machine, as shown in Figure 6.5:"
    )

    add_figure(
        os.path.join(DIAGRAMS_DIR, "diagram_4_state_lifecycle.png"),
        "Figure 6.5: Vehicle Lifecycle & Terminal Scrappage State Machine",
        width=Inches(6.2)
    )

    add_paragraph(
        "When an RTO Enforcement Officer marks a vehicle as Scrapped (State 1), the smart contract automatically cancels any pending transfers "
        "and permanently locks the vehicle title. Scrappage is an irreversible terminal state. Any future attempt by anyone "
        "to transfer, sell, or re-register the scrapped title will immediately revert with an on-chain error (VehicleIsScrapped). "
        "This gives prospective second-hand car buyers 100% certainty that a car was never secretly salvaged."
    )

    # =========================================================================
    # SECTION 7: IMPLEMENTATION DETAILS
    # =========================================================================
    add_heading_1("7. Implementation Details")

    add_paragraph(
        "The project was implemented as a production-grade decentralized full-stack application comprising two major subsystems: "
        "the Solidity Smart Contract Layer running on an Ethereum EVM node, and the React Web3 Frontend Layer."
    )

    add_heading_2("7.1 Smart Contract Layer (VehicleRegistry.sol)")
    add_paragraph(
        "The smart contract is written in Solidity 0.8.24, compiled for the Cancun EVM target, and inherits proven open-source "
        "contracts from OpenZeppelin v5.0: ERC721 (Non-Fungible Title Tokens), AccessControl (Granular RBAC), and Pausable (Emergency Halt)."
    )

    contract_snippet = """// Core Data Structures in VehicleRegistry.sol
enum VehicleState { Active, Scrapped }

struct Vehicle {
    bytes32 vehicleId;              // Unique identifier derived from VIN & Plate
    bytes32 vinCommitment;          // Keccak-256 hash of chassis number
    bytes32 registrationCommitment; // Keccak-256 hash of registration plate
    VehicleState state;             // Active (0) or Scrapped (1)
    address titleHolder;            // Current citizen owner
    bytes32 metadataHash;           // Hash of off-chain vehicle specs
    uint64 registeredAt;            // Initial registration timestamp
    uint64 updatedAt;               // Last state modification timestamp
}

struct OwnershipRecord {
    address owner;                  // Wallet address of title holder
    uint64 transferredAt;           // Timestamp when title was acquired
}"""
    add_code_block(contract_snippet)

    add_heading_3("Key Security Functions:")
    add_bullet(
        "Callable only by RTO_REGISTRAR_ROLE. Reverts if the recipient wallet holds any administrative RTO credentials, preventing authority conflict of interest.",
        bold_prefix="• registerVehicle(...): "
    )
    add_bullet(
        "Callable only by RTO_REGISTRAR_ROLE. Verifies the vehicle is Active, transfers the ERC-721 token, and appends the buyer to the chronological ownership history array.",
        bold_prefix="• transferOwnershipByRTO(...): "
    )
    add_bullet(
        "Callable only by RTO_OFFICER_ROLE. Updates vehicle state to Scrapped, cancels pending transfers, and locks the token permanently.",
        bold_prefix="• updateVehicleState(...): "
    )
    add_bullet(
        "We override OpenZeppelin's internal _update(to, tokenId, auth) hook. If anyone tries to transfer a vehicle token to an RTO official or admin wallet, the EVM immediately reverts with PrivilegedAddressCannotOwnVehicle(to). This makes it mathematically impossible to bypass rules using raw RPC calls.",
        bold_prefix="• Universal Internal Transfer Hook (_update): "
    )

    add_heading_2("7.2 Web3 Frontend Layer (React 18 & Vite)")
    add_paragraph(
        "The user interface was built using modern web standards to provide a fluid, accessible experience for both citizens and government officers:"
    )
    add_bullet("Handles real-time communication with the Ethereum node using Ethers.js v6, filters blockchain event logs, and signs transactions via MetaMask.", bold_prefix="• BlockchainContext.jsx: ")
    add_bullet("Provides session security using cryptographic challenge-response nonces. If the user switches accounts in MetaMask, the session instantly clears and re-evaluates permissions to prevent identity spoofing.", bold_prefix="• AuthContext.jsx: ")
    add_bullet("Houses CitizenGuard (which prevents authority wallets from entering citizen portals) and RtoGuard (which strictly partitions Registrar desks from Enforcement Officer desks).", bold_prefix="• ProtectedRoute.jsx: ")
    add_bullet("A dedicated, highly realistic component that visually displays Indian High Security Registration Plates with blue IND country emblems and laser-etched serial numbers.", bold_prefix="• HSRPPlate.jsx: ")

    # =========================================================================
    # SECTION 8: OUTPUTS OF THE MINI-PROJECT & VERIFICATION
    # =========================================================================
    add_heading_1("8. Outputs of the Mini-Project & Automated Verification")

    add_paragraph(
        "To ensure the system is completely secure, reliable, and ready for real-world deployment, we conducted rigorous "
        "automated unit testing and live blockchain transaction proofs."
    )

    add_heading_2("8.1 Automated Unit Testing Suite (40 Passing Tests)")
    add_paragraph(
        "We authored an exhaustive automated testing suite in Hardhat and Chai containing 40 individual tests organized across 8 test suites. "
        "Every single test passed with 100% accuracy:"
    )

    test_output = """  VehicleRegistry - Confidentiality & Security Focused Architecture
    1. Role-Based Access Control (RBAC) & Clear RTO Role Boundaries
      [OK] assigns DEFAULT_ADMIN_ROLE, RTO_REGISTRAR_ROLE, and RTO_OFFICER_ROLE properly
      [OK] enforces clear boundary: RTO Officer cannot register new vehicles
      [OK] enforces clear boundary: RTO Registrar cannot scrap/decommission vehicles
      [OK] rejects vehicle registration from unauthorized citizen accounts
      [OK] allows admin to grant and revoke RTO_REGISTRAR_ROLE
    2. Minimum On-Chain Data & Commitment Uniqueness
      [OK] stores only minimum required data and mints title NFT
      [OK] rejects duplicate VIN commitments even with different letter cases
      [OK] rejects duplicate registration plate commitments
      [OK] resolves vehicleId by VIN commitment and Plate commitment
    3. Two-Step Safe Title Transfer Workflow
      [OK] allows owner to initiate and prospective buyer to accept transfer
      [OK] allows current title holder to cancel a pending transfer
      [OK] rejects transfer to zero address and self-transfer
      [OK] allows current title holder to directly transfer title
      [OK] allows RTO Registrar to officially transfer ownership on-chain via transferOwnershipByRTO
      [OK] rejects RTO Officer and unauthorized citizen from calling transferOwnershipByRTO
      [OK] rejects transferOwnershipByRTO to an RTO authority address
    4. Vehicle Scrappage & Terminal Decommissioning
      [OK] blocks transfer when vehicle is marked Scrapped
      [OK] cancels pending transfers if marked Scrapped
      [OK] enforces Scrapped state as permanent terminal state
    5. Chronological Vehicle Ownership History Tracking
      [OK] records initial owner upon vehicle registration
      [OK] appends new owner to history upon direct title transfer
      [OK] appends new owner to history upon two-step title acceptance
    6. Emergency Pause Controls
      [OK] allows admin to pause and blocks sensitive state changes while paused
    7. Event Privacy Verification
      [OK] emits events with technical commitments and hashes without plaintext PII
    8. Strict Citizen–RTO Identity Separation & 16 Negative Security Invariants
      [OK] 1. citizen cannot register vehicle
      [OK] 2. citizen cannot modify legal state
      [OK] 3. citizen cannot grant RTO role
      [OK] 4. citizen cannot perform RTO-only administrative operations
      [OK] 5. RTO wallet cannot own a vehicle (reverts PrivilegedAddressCannotOwnVehicle)
      [OK] 6. RTO wallet cannot receive vehicle transfer (initiateTransfer rejects privileged recipient)
      [OK] 7. RTO wallet cannot invoke citizen-only ownership operations
      [OK] 8. privileged account cannot bypass frontend restrictions using direct contract calls
      [OK] 9. assigning RTO role to an existing citizen owner is rejected
      [OK] 10. removing RTO role revokes authority immediately
      [OK] 11. switching accounts invalidates stale session and detects identity mismatch
      [OK] 12. citizen session cannot access RTO routes
      [OK] 13. RTO session cannot access citizen routes
      [OK] 14. direct transfer path rejects privileged recipient
      [OK] 15. safe transfer path rejects privileged recipient (via ERC721 safeTransferFrom)
      [OK] 16. internal transfer path rejects privileged recipient (via ERC721 transferFrom)

  40 passing (5s)"""
    add_code_block(test_output)

    add_heading_2("8.2 Live Blockchain Node Execution Proof")
    add_paragraph(
        "We also ran our live on-chain proof script (scripts/prove-blockchain.js) against a local Ethereum node to demonstrate "
        "real-time deployment and transaction handling:"
    )

    proof_output = """==================================================================
 PROOF OF BLOCKCHAIN SECURITY & CONFIDENTIALITY ARCHITECTURE
==================================================================
 Contract        : 0x5FbDB2315678afecb367f032d93F642f64180aa3
 Admin           : 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
 RTO Registrar   : 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
 RTO Officer     : 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
------------------------------------------------------------------
 1. ACCESS CONTROL ENFORCED ON-CHAIN VIA AccessControl
   OK: Unauthorized citizen wallet blocked by AccessControl (RTO_REGISTRAR_ROLE required).
   OK: RTO Enforcement Officer blocked from registering vehicles.
------------------------------------------------------------------
 2. COMMITMENT UNIQUENESS & INTEGRITY PROOF
   OK: Duplicate plate commitment rejected on-chain.
------------------------------------------------------------------
 3. OFFICIAL OWNERSHIP TRANSFER EXECUTED VIA RTO REGISTRAR
   OK: RTO Enforcement Officer blocked from transferring ownership.
   OK: Citizen blocked from calling transferOwnershipByRTO.
   OK: Ownership officially transferred via RTO Registrar.
------------------------------------------------------------------
 4. CHRONOLOGICAL OWNERSHIP HISTORY & VEHICLE SCRAPPAGE
   OK: Complete chronological vehicle ownership history verified on-chain.
   OK: RTO Registrar blocked from scrapping vehicle.
   Temporary vehicle state updated to: SCRAPPED (1) by RTO Enforcement Officer.
   OK: Transfer of scrapped vehicle blocked by smart contract.
------------------------------------------------------------------
 5. STRICT CITIZEN–RTO IDENTITY SEPARATION (ON-CHAIN INVARIANTS)
   OK: RTO Registrar wallet blocked from owning vehicle.
   OK: RTO Officer wallet blocked from owning vehicle.
   OK: Title transfer to RTO Officer wallet blocked.
   OK: Role conflict prevention blocked granting RTO role to vehicle owner.
==================================================================
 All security & confidentiality architecture proofs verified on live chain."""
    add_code_block(proof_output)

    add_heading_2("8.3 Web3 User Interface Walkthrough")
    add_paragraph(
        "The completed frontend application provides four distinct portals tailored to each user type:"
    )
    add_bullet("Allows any citizen, insurer, or prospective car buyer to enter a vehicle chassis number or license plate. The portal computes the Keccak-256 hash locally and verifies on-chain whether the car is Active or Scrapped, showing its genuine ownership count without exposing private details.", bold_prefix="1. Public Verification Portal: ")
    add_bullet("Allows authenticated vehicle owners to see their digital titles (displayed as realistic HSRP plates), review their vehicle's chronological ownership history, and initiate a transfer request to a buyer.", bold_prefix="2. Citizen Dashboard: ")
    add_bullet("Allows authorized registrars to register newly manufactured vehicles (minting digital title tokens to citizens) and process pending transfer applications submitted by citizens.", bold_prefix="3. RTO Registrar Desk: ")
    add_bullet("Provides field inspection tools allowing officers to conduct fitness audits and decommission aged or totaled cars into the irreversible Scrapped state.", bold_prefix="4. RTO Enforcement Officer Desk: ")

    # =========================================================================
    # SECTION 9: SKILLS DEVELOPED / LEARNING OUT OF THIS PROJECT
    # =========================================================================
    add_heading_1("9. Skills Developed / Learning Out of this Project")

    add_paragraph(
        "Working on this mini-project provided immense practical learning and deepened our engineering capabilities across multiple domains:"
    )
    add_bullet(
        "Learned how to write robust, production-grade Solidity smart contracts, use OpenZeppelin security libraries, override internal "
        "hooks (_update) for custom access rules, and use custom errors (revert PrivilegedAddressCannotOwnVehicle()) to save gas.",
        bold_prefix="1. Smart Contract Engineering & EVM Security: "
    )
    add_bullet(
        "Gained hands-on experience using Keccak-256 cryptographic commitments. We learned how to solve the classic privacy dilemma on public "
        "blockchains by separating public mathematical proofs from private personal data.",
        bold_prefix="2. Applied Cryptography & Privacy Engineering: "
    )
    add_bullet(
        "Understood the vital importance of the Principle of Least Privilege in enterprise systems. Dividing RTO powers into Registrar and "
        "Officer roles taught us how software architecture can actively prevent real-world bureaucratic corruption.",
        bold_prefix="3. Decentralized Identity & Access Control: "
    )
    add_bullet(
        "Mastered the integration of modern web frontends (React 18, Vite) with blockchain nodes using Ethers.js v6. Learned how to manage "
        "asynchronous transaction states, handle MetaMask account changes, and enforce cryptographic route guards.",
        bold_prefix="4. Full-Stack Web3 DApp Development: "
    )
    add_bullet(
        "Practiced Test-Driven Development (TDD) by writing 40 automated test cases. We learned to think like security auditors—actively trying "
        "to break our own system with unauthorized calls, duplicate data, and edge-case attacks to prove it cannot be bypassed.",
        bold_prefix="5. Security Auditing & Test-Driven Verification: "
    )

    # =========================================================================
    # SECTION 10: PRACTICAL APPLICATIONS OF THE MINI-PROJECT
    # =========================================================================
    add_heading_1("10. Practical Applications of the Mini-Project")

    add_paragraph(
        "The architecture developed in this mini-project has immediate, high-impact applications in the real world:"
    )
    add_bullet(
        "Regional Transport Offices can adopt this architecture to completely eliminate registration certificate forgery, clerical bribery, "
        "and duplicate license plate duplication across state lines.",
        bold_prefix="• Modernizing State Transport Departments (RTOs): "
    )
    add_bullet(
        "Online platforms like Cars24, Spinny, and CarDekho can verify genuine vehicle ownership, the exact number of previous owners, and whether "
        "the car was ever declared a total loss, without waiting days for manual RTO paper verification.",
        bold_prefix="• Pre-Owned Car Marketplaces: "
    )
    add_bullet(
        "When an insurance company settles a total-loss crash claim, they can ensure the vehicle is immediately marked Scrapped on the blockchain. "
        "This completely stops shady salvage yards from rebuilding and reselling deadly crashed vehicles.",
        bold_prefix="• Automotive Insurance & Total-Loss Verification: "
    )
    add_bullet(
        "Commercial banks and lending institutions can place an on-chain lien or transfer lock on the digital vehicle title during the loan tenure, "
        "preventing fraudulent borrowers from selling financed cars before paying off their loan.",
        bold_prefix="• Banking Hypothecation & Auto Loans: "
    )

    # =========================================================================
    # SECTION 11: AREAS OF FUTURE IMPROVEMENT
    # =========================================================================
    add_heading_1("11. Areas of Future Improvement")

    add_paragraph(
        "While the current system solves the core challenges of vehicle registration and title security, several promising enhancements can be added in future work:"
    )
    add_bullet(
        "We can integrate zero-knowledge proofs (such as zk-SNARKs via Circom). This would allow a citizen to prove to a traffic police officer "
        "that their vehicle has a valid registration, insurance, and pollution certificate, without revealing their wallet address or identity.",
        bold_prefix="1. Zero-Knowledge Proofs (zk-SNARKs) for Traffic Police Audits: "
    )
    add_bullet(
        "The off-chain storage layer can be upgraded from encrypted local JSON to decentralized content-addressed networks like the InterPlanetary "
        "File System (IPFS) or Arweave, ensuring vehicle inspection certificates and photos are permanently hosted without relying on central servers.",
        bold_prefix="2. Decentralized Storage Migration (IPFS / Filecoin): "
    )
    add_bullet(
        "Modern vehicles equipped with On-Board Diagnostics (OBD-II) and FASTag RFID transponders can be connected to the blockchain. A secure "
        "cryptographic chip in the car could periodically sign tamper-proof odometer mileage readings directly to the blockchain, ending odometer rollbacks.",
        bold_prefix="3. Automotive IoT & FASTag Integration: "
    )
    add_bullet(
        "To support nationwide scale with over 300 million vehicles and millions of daily transactions, the smart contract can be deployed on an "
        "Ethereum Layer-2 rollup (such as Polygon PoS, Arbitrum, or zkSync), reducing transaction fees to less than a rupee.",
        bold_prefix="4. Layer-2 Rollup Deployment for Massive Scale: "
    )

    # =========================================================================
    # SECTION 12: CONCLUSION
    # =========================================================================
    add_heading_1("12. Conclusion")

    add_paragraph(
        "This mini-project successfully engineered and verified a Decentralized Vehicle Registration & Immutable Title Management System "
        "that solves the fundamental vulnerabilities of traditional centralized transport databases. By utilizing ERC-721 non-fungible tokens "
        "for digital title deeds, Keccak-256 cryptographic commitments for VIN and plate privacy, and strict role-based access control, our "
        "system guarantees absolute data integrity without sacrificing citizen confidentiality."
    )

    add_paragraph(
        "By enforcing a clear separation of powers between RTO Registrars and RTO Enforcement Officers, preventing officials from holding vehicle "
        "assets in their authority accounts, and requiring statutory RTO approval for ownership transfers, the system translates the legal "
        "workflow of the Motor Vehicles Act into self-enforcing, tamper-proof blockchain code. Furthermore, the permanent scrappage state machine "
        "ensures that decommissioned and salvage vehicles can never be fraudulently re-registered."
    )

    add_paragraph(
        "With 40 automated test cases passing with 100% accuracy and successful live on-chain demonstration proofs, this project demonstrates "
        "that blockchain technology is not just for cryptocurrencies—it is a powerful, practical foundation for transparent, honest, and "
        "citizen-centered public e-governance."
    )

    add_callout(
        "By replacing vulnerable central databases with cryptographic truth and clear institutional role boundaries, we can build a transport "
        "registry where citizen privacy is protected, vehicle titles cannot be forged, and administrative trust is mathematically guaranteed.",
        title="FINAL REFLECTION"
    )

    # Save Document
    output_path = os.path.abspath(r"d:\BC project\Vehicle_Registration_System_Mini_Project_Report.docx")
    fallback_path = os.path.abspath(r"d:\BC project\Vehicle_Registration_System_Mini_Project_Report_With_Diagrams.docx")
    
    saved_path = output_path
    try:
        doc.save(output_path)
        print(f"SUCCESS: Document successfully created at: {output_path}")
    except PermissionError:
        doc.save(fallback_path)
        saved_path = fallback_path
        print(f"NOTE: Primary file is currently open in Word. Saved updated report with diagrams to: {fallback_path}")
    
    return saved_path

if __name__ == "__main__":
    build_report()
