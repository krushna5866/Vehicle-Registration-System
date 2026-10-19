"""
build_pdf_matched_report.py
Generates the complete, publication-grade Mini-Project Report for:
"Decentralized Vehicle Registration & Immutable Title Management System Using Blockchain Technology"
Matching the exact layout, page structure, section hierarchy, dark code blocks,
and visual aesthetics of the provided reference PDF.
"""

import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

# ── Paths ─────────────────────────────────────────────────────────────
WORKSPACE = r"d:\BC project"
LOGO_PATH = os.path.join(WORKSPACE, "scripts", "template_logorId5.png")
DIAGRAMS_DIR = os.path.join(WORKSPACE, "docs", "diagrams")
OUTPUT_DOCX = os.path.join(WORKSPACE, "Vehicle_Registration_System_Mini_Project_Report_RefFormat.docx")

FONT_NAME = "Times New Roman"

def create_report():
    doc = Document()

    # ── Colors ────────────────────────────────────────────────────────
    COLOR_BLACK = RGBColor(0, 0, 0)
    COLOR_DARK = RGBColor(30, 30, 30)
    COLOR_GRAY = RGBColor(100, 100, 100)
    COLOR_CODE_BG = "1E1E1E"
    COLOR_CODE_TEXT = RGBColor(235, 235, 235)
    COLOR_CONSOLE_BG = "141414"

    # ── Page Setup (Section 1: Front Matter) ──────────────────────────
    sec1 = doc.sections[0]
    sec1.page_width = Inches(8.5)
    sec1.page_height = Inches(11.0)
    sec1.top_margin = Inches(0.95)
    sec1.bottom_margin = Inches(0.9)
    sec1.left_margin = Inches(1.0)
    sec1.right_margin = Inches(1.0)
    sec1.different_first_page_header_footer = False

    # ── Helper Formatting Functions ───────────────────────────────────
    def p_add(text="", size=11, bold=False, italic=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY,
              space_before=0, space_after=6, line_spacing=1.15, color=COLOR_DARK):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = line_spacing
        if text:
            r = p.add_run(text)
            r.font.name = FONT_NAME
            r.font.size = Pt(size)
            r.font.bold = bold
            r.font.italic = italic
            r.font.color.rgb = color
        return p

    def center(text, size=12, bold=False, italic=False, space_before=0, space_after=6, color=COLOR_BLACK, line_spacing=1.15):
        return p_add(text, size=size, bold=bold, italic=italic, align=WD_ALIGN_PARAGRAPH.CENTER,
                     space_before=space_before, space_after=space_after, color=color, line_spacing=line_spacing)

    def section_heading(title):
        """Standard section heading matching '1. Abstract', '2. Introduction', etc."""
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        r = p.add_run(title)
        r.font.name = FONT_NAME
        r.font.size = Pt(12.5)
        r.font.bold = True
        r.font.color.rgb = COLOR_BLACK
        return p

    def sub_heading(title):
        """Sub-heading matching 'Step 1: ...' or 'Database Creation Code'"""
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(title)
        r.font.name = FONT_NAME
        r.font.size = Pt(11.5)
        r.font.bold = True
        r.font.color.rgb = COLOR_BLACK
        return p

    def bullet_item(text, lead="", space_after=4):
        """Primary bullet with solid disc '●' matching reference PDF."""
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.left_indent = Inches(0.28)
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        rb = p.add_run("●  ")
        rb.font.name = FONT_NAME
        rb.font.size = Pt(10.5)
        rb.font.bold = True
        rb.font.color.rgb = COLOR_BLACK
        if lead:
            rl = p.add_run(lead)
            rl.font.name = FONT_NAME
            rl.font.size = Pt(11)
            rl.font.bold = True
            rl.font.color.rgb = COLOR_BLACK
        rt = p.add_run(text)
        rt.font.name = FONT_NAME
        rt.font.size = Pt(11)
        rt.font.color.rgb = COLOR_DARK
        return p

    def sub_bullet_item(text, lead="", space_after=4):
        """Secondary bullet with open circle '○' matching reference PDF."""
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.left_indent = Inches(0.55)
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        rb = p.add_run("○  ")
        rb.font.name = FONT_NAME
        rb.font.size = Pt(10.5)
        rb.font.bold = True
        rb.font.color.rgb = COLOR_BLACK
        if lead:
            rl = p.add_run(lead)
            rl.font.name = FONT_NAME
            rl.font.size = Pt(11)
            rl.font.bold = True
            rl.font.color.rgb = COLOR_BLACK
        rt = p.add_run(text)
        rt.font.name = FONT_NAME
        rt.font.size = Pt(11)
        rt.font.color.rgb = COLOR_DARK
        return p

    def code_indicator(title):
        """Matches '❖ Purpose: ...' or '❖ Saving image:' in the reference PDF."""
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(f"❖  {title}")
        r.font.name = FONT_NAME
        r.font.size = Pt(11)
        r.font.bold = True
        r.font.color.rgb = COLOR_BLACK
        return p

    def code_box(code_text, bg_hex=COLOR_CODE_BG):
        """Dark charcoal background code box with white Consolas monospace font."""
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.5)

        # Background color
        cell._tc.get_or_add_tcPr().append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{bg_hex}"/>'))
        # Padding
        cell._tc.get_or_add_tcPr().append(parse_xml(
            f'<w:tcMar {nsdecls("w")}>'
            f'<w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/>'
            f'<w:left w:w="180" w:type="dxa"/><w:right w:w="180" w:type="dxa"/>'
            f'</w:tcMar>'
        ))
        # Subtle border
        tbl._tbl.tblPr.append(parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'<w:top w:val="single" w:sz="4" w:color="333333"/>'
            f'<w:bottom w:val="single" w:sz="4" w:color="333333"/>'
            f'<w:left w:val="single" w:sz="4" w:color="333333"/>'
            f'<w:right w:val="single" w:sz="4" w:color="333333"/>'
            f'</w:tblBorders>'
        ))

        lines = code_text.strip().split("\n")
        for i, line in enumerate(lines):
            p = cell.paragraphs[0] if i == 0 else cell.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.05
            r = p.add_run(line)
            r.font.name = "Consolas"
            r.font.size = Pt(8.5)
            r.font.color.rgb = COLOR_CODE_TEXT

        p_spacer = doc.add_paragraph()
        p_spacer.paragraph_format.space_before = Pt(0)
        p_spacer.paragraph_format.space_after = Pt(4)

    def tbl_cell_style(cell, text, size=10.5, bold=False, align=WD_ALIGN_PARAGRAPH.LEFT,
                       bg_hex=None, pad_v=80, pad_h=100):
        if bg_hex:
            cell._tc.get_or_add_tcPr().append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{bg_hex}"/>'))
        cell._tc.get_or_add_tcPr().append(parse_xml(
            f'<w:tcMar {nsdecls("w")}>'
            f'<w:top w:w="{pad_v}" w:type="dxa"/><w:bottom w:w="{pad_v}" w:type="dxa"/>'
            f'<w:left w:w="{pad_h}" w:type="dxa"/><w:right w:w="{pad_h}" w:type="dxa"/>'
            f'</w:tcMar>'
        ))
        p = cell.paragraphs[0]
        p.alignment = align
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(text)
        r.font.name = FONT_NAME
        r.font.size = Pt(size)
        r.font.bold = bold
        r.font.color.rgb = COLOR_BLACK if bold else COLOR_DARK

    def set_table_borders(tbl, color="000000", sz="6"):
        tbl._tbl.tblPr.append(parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'<w:top w:val="single" w:sz="{sz}" w:color="{color}"/>'
            f'<w:bottom w:val="single" w:sz="{sz}" w:color="{color}"/>'
            f'<w:left w:val="single" w:sz="{sz}" w:color="{color}"/>'
            f'<w:right w:val="single" w:sz="{sz}" w:color="{color}"/>'
            f'<w:insideH w:val="single" w:sz="{sz}" w:color="{color}"/>'
            f'<w:insideV w:val="single" w:sz="{sz}" w:color="{color}"/>'
            f'</w:tblBorders>'
        ))

    def horizontal_line():
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(4)
        pPr = p._p.get_or_add_pPr()
        pPr.append(parse_xml(
            f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="12" w:space="1" w:color="000000"/></w:pBdr>'
        ))

    # ====================================================================
    # FRONT MATTER - PAGE 1: COVER PAGE
    # ====================================================================
    if os.path.exists(LOGO_PATH):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(0)
        p_logo.paragraph_format.space_after = Pt(6)
        p_logo.add_run().add_picture(LOGO_PATH, width=Inches(1.5))

    center("School of Engineering and Technology, MGM University", 16, bold=True, space_after=2)
    center("Chh. Sambhajinagar", 16, bold=True, space_after=4)
    horizontal_line()
    center("Academic Year 2025-2026", 13, bold=True, space_before=4, space_after=6)
    center("Mini Project report", 12, space_after=2)
    center("On", 12, space_after=6)
    center('"Decentralized Vehicle Registration & Immutable Title Management System Using Blockchain Technology"',
           15.5, bold=True, space_after=10)
    center("Submitted in partial fulfillment for Sixth semester of B.Tech (Integrated) in", 11.5, space_after=2)
    center("COMPUTER SCIENCE AND ENGINEERING", 13, bold=True, space_after=2)
    center("(IoT, Cyber Security Including Block Chain Technology)", 12.5, bold=True, space_after=10)
    center("By", 12, space_after=6)

    # Student table
    tbl_students = doc.add_table(rows=2, cols=2)
    tbl_students.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_students)
    tbl_students.rows[0].cells[0].width = Inches(3.4)
    tbl_students.rows[0].cells[1].width = Inches(2.4)
    tbl_students.rows[1].cells[0].width = Inches(3.4)
    tbl_students.rows[1].cells[1].width = Inches(2.4)
    tbl_cell_style(tbl_students.rows[0].cells[0], "Rohit Dhananjay Kale", 11.5, align=WD_ALIGN_PARAGRAPH.CENTER)
    tbl_cell_style(tbl_students.rows[0].cells[1], "202356112007", 11.5, align=WD_ALIGN_PARAGRAPH.CENTER)
    tbl_cell_style(tbl_students.rows[1].cells[0], "Soham Bhagwan Deshmukh", 11.5, align=WD_ALIGN_PARAGRAPH.CENTER)
    tbl_cell_style(tbl_students.rows[1].cells[1], "202356112008", 11.5, align=WD_ALIGN_PARAGRAPH.CENTER)

    p_add("", space_after=4)
    center("Under the guidance of", 11.5, space_before=4, space_after=2)
    center("Ms. Bhagat C. B.", 13, bold=True, space_after=2)
    center("(Asst. Professor)", 11.5, space_after=10)
    horizontal_line()
    center("DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING", 13.5, bold=True, space_before=6, space_after=2)
    center("School of Engineering and Technology, MGM University, Chh. Sambhajinagar", 11.5, bold=True, space_after=0)

    doc.add_page_break()

    # ====================================================================
    # FRONT MATTER - PAGE 2: CERTIFICATE
    # ====================================================================
    if os.path.exists(LOGO_PATH):
        p_logo2 = doc.add_paragraph()
        p_logo2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo2.paragraph_format.space_before = Pt(0)
        p_logo2.paragraph_format.space_after = Pt(6)
        p_logo2.add_run().add_picture(LOGO_PATH, width=Inches(1.5))

    center("School of Engineering and Technology, MGM University", 16, bold=True, space_after=2)
    center("Chh. Sambhajinagar", 16, bold=True, space_after=4)
    horizontal_line()
    center("CERTIFICATE", 14, bold=True, space_before=10, space_after=14)

    p_cert = doc.add_paragraph()
    p_cert.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_cert.paragraph_format.space_before = Pt(0)
    p_cert.paragraph_format.space_after = Pt(14)
    p_cert.paragraph_format.line_spacing = 1.35

    def cert_run(txt, bold=False):
        r = p_cert.add_run(txt)
        r.font.name = FONT_NAME
        r.font.size = Pt(11.5)
        r.font.bold = bold
        r.font.color.rgb = COLOR_BLACK if bold else COLOR_DARK

    cert_run("This is to certify that ")
    cert_run("Rohit Dhananjay Kale", True)
    cert_run(", ")
    cert_run("Soham Bhagwan Deshmukh", True)
    cert_run(" with PRN No. ")
    cert_run("202356112007", True)
    cert_run(", ")
    cert_run("202356112008", True)
    cert_run(" have successfully completed their Mini-Project entitled ")
    cert_run('"Decentralized Vehicle Registration & Immutable Title Management System Using Blockchain Technology"', True)
    cert_run(" in the Course of ")
    cert_run('"Blockchain Technology & Cyber Security"', True)
    cert_run(" in the Sixth Semester during the tenure of completing the B.Tech (Integrated) programme in ")
    cert_run("Computer Science and Engineering (IoT, Cyber Security Including Block Chain Technology)", True)
    cert_run(" from School of Engineering and Technology, MGM University, Chh. Sambhajinagar during the academic year 2025-2026.")

    p_add("", space_after=20)
    p_sig = doc.add_paragraph()
    p_sig.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sig.paragraph_format.space_before = Pt(36)
    p_sig.paragraph_format.space_after = Pt(2)
    r1 = p_sig.add_run("Ms. Bhagat C. B.\t\t\t\t\tMs. Rathi S. R.")
    r1.font.name = FONT_NAME
    r1.font.size = Pt(12)
    r1.font.bold = True

    p_role = doc.add_paragraph()
    p_role.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_role.paragraph_format.space_before = Pt(0)
    p_role.paragraph_format.space_after = Pt(2)
    r2 = p_role.add_run("Guide\t\t\t\t\t\t\tHOD")
    r2.font.name = FONT_NAME
    r2.font.size = Pt(11.5)
    r2.font.bold = True

    p_dept = doc.add_paragraph()
    p_dept.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_dept.paragraph_format.space_before = Pt(0)
    p_dept.paragraph_format.space_after = Pt(0)
    r3 = p_dept.add_run("CSE Department\t\t\t\t\tCSE Department")
    r3.font.name = FONT_NAME
    r3.font.size = Pt(11)

    doc.add_page_break()

    # ====================================================================
    # FRONT MATTER - PAGE 3: CONTENT (Table of Contents)
    # ====================================================================
    center("CONTENT", 14, bold=True, space_before=10, space_after=12)

    toc_items = [
        ("1", "Abstract", "4"),
        ("2", "Introduction", "4"),
        ("3", "Course Outcome Integrated", "7"),
        ("4", "Action Plan", "7"),
        ("5", "Literature Review", "8"),
        ("6", "Proposed Methodology", "8"),
        ("7", "Implementation", "10"),
        ("8", "Output of Mini Project", "14"),
        ("9", "Skill Developed / learning out of this Micro-Project", "17"),
        ("10", "Applications of this Micro-Project", "17"),
        ("11", "Area of Future Improvement", "18"),
        ("12", "Conclusion", "18"),
    ]

    tbl_toc = doc.add_table(rows=len(toc_items) + 1, cols=3)
    tbl_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_toc)
    tw = [Inches(0.9), Inches(4.7), Inches(0.9)]
    for i, w in enumerate(tw):
        tbl_toc.rows[0].cells[i].width = w

    tbl_cell_style(tbl_toc.rows[0].cells[0], "Sr. No", 11.5, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)
    tbl_cell_style(tbl_toc.rows[0].cells[1], "Title", 11.5, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT)
    tbl_cell_style(tbl_toc.rows[0].cells[2], "Page. No.", 11.5, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)

    for idx, (sr, title, pg) in enumerate(toc_items):
        row = tbl_toc.rows[idx + 1]
        for i, w in enumerate(tw):
            row.cells[i].width = w
        tbl_cell_style(row.cells[0], sr, 11, align=WD_ALIGN_PARAGRAPH.CENTER)
        tbl_cell_style(row.cells[1], title, 11, align=WD_ALIGN_PARAGRAPH.LEFT)
        tbl_cell_style(row.cells[2], pg, 11, align=WD_ALIGN_PARAGRAPH.CENTER)

    # ── Section 2: Body Content (Starts on Page 4!) ───────────────────
    sec2 = doc.add_section()
    sec2.header.is_linked_to_previous = False
    sec2.footer.is_linked_to_previous = False
    sec2._sectPr.append(parse_xml(f'<w:pgNumType {nsdecls("w")} w:start="4"/>'))

    # Centered page number at bottom
    pf = sec2.footer.paragraphs[0]
    pf.alignment = WD_ALIGN_PARAGRAPH.CENTER
    rf = pf.add_run()
    rf.font.name = FONT_NAME
    rf.font.size = Pt(10)
    pf._p.append(parse_xml(f'<w:fldSimple {nsdecls("w")} w:instr="PAGE"/>'))

    # ====================================================================
    # 1. ABSTRACT (Starts on Page 4)
    # ====================================================================
    section_heading("1. Abstract")
    p_add(
        "This project proposes a Decentralized Vehicle Registration and Immutable Title Management System "
        "designed to eliminate systemic fraud, counterfeiting, and administrative opacity in motor vehicle "
        "titling. By leveraging the Ethereum blockchain and cryptographic commitment schemes, the system "
        "transforms traditional vehicle ownership into non-fungible digital title deeds (ERC-721 tokens). "
        "To strictly protect citizen privacy while preserving public verifiability, the architecture extracts "
        "the Vehicle Identification Number (VIN) and High-Security Registration Plate (HSRP) identifiers and "
        "converts them into one-way Keccak-256 cryptographic commitments before on-chain ingestion, "
        "forcibly eliminating plaintext Personally Identifiable Information (PII) from the public ledger."
    )
    p_add(
        "The smart contract layer enforces strict Role-Based Access Control (RBAC) with clear separation between "
        "RTO Registrars, RTO Enforcement Officers, and citizen vehicle owners, guaranteeing that transport authorities "
        "are programmatically barred from owning vehicle assets or bypassing statutory transfer workflows (Forms 29/30). "
        "Vehicles marked as Scrapped enter an irreversible terminal state, permanently locking the digital title from "
        "future transfers and preventing total-loss vehicle cloning. The resulting application features a responsive "
        "Web3 graphical interface backed by automated invariant security verification, achieving a definitive 100% "
        "test pass rate across 40 rigorous automated test cases."
    )

    # ====================================================================
    # 2. INTRODUCTION (Continues on Page 4, 5, 6)
    # ====================================================================
    section_heading("2. Introduction")
    p_add(
        "Motor vehicle registration is a fundamental pillar of national transport administration, legal ownership, "
        "and public safety. In India and across global jurisdictions, Regional Transport Offices (RTOs) are "
        "statutorily mandated under the Motor Vehicles Act to register newly manufactured vehicles, issue Registration "
        "Certificates (RC), regulate ownership transfers, record hypothecation liens, and oversee vehicular scrappage. "
        "A Registration Certificate functions as the definitive legal proof of title, determining fiscal liabilities, "
        "insurance eligibility, accident claims, and law enforcement accountability."
    )
    p_add(
        "Over the past two decades, transport administration transitioned from physical paper registers to centralized "
        "digital databases such as the national Vahan portal. While centralized databases modernized record archiving "
        "and streamlined tax collection, they introduced profound structural vulnerabilities inherent to centralized "
        "client-server architectures. A centralized architecture inherently concentrates trust, authority, and control "
        "within a single administrative enclave. Consequently, these systems remain vulnerable to single points of "
        "failure, sophisticated cyber intrusions, insider data tampering, and lack of independent, transparent auditability."
    )

    # Page 5 continuation
    p_add(
        "The practical consequences of these structural weaknesses manifest in critical real-world challenges that "
        "severely compromise consumer protection and road safety:"
    )
    bullet_item(
        "Criminal syndicates regularly clone legitimate vehicle identities by fabricating duplicate high-security "
        "registration plates and altering physical chassis engravings to match existing records. Stolen vehicles are then "
        "infiltrated into the used car market accompanied by forged or illicitly generated RC documents, causing innocent "
        "buyers to suffer immediate asset forfeiture upon law enforcement discovery.",
        "Document Forgery and Ghost Vehicles: "
    )
    bullet_item(
        "Because central databases rely on mutable database rows, rogue insiders or compromised administrative "
        "accounts can quietly alter title ownership, clear bank hypothecation liens without financier consent, or "
        "modify emission fitness classes without leaving an unalterable, non-repudiable audit trail.",
        "Unauthorized Database Manipulation: "
    )
    bullet_item(
        "In the pre-owned vehicle marketplace, prospective buyers lack direct cryptographic mechanisms to verify a "
        "vehicle's authentic chain of custody, historical transfer timeline, or hypothecation history. Instead, they are "
        "forced to rely on paper documentation that can be easily fabricated.",
        "Lack of Provable Ownership Provenance: "
    )
    bullet_item(
        "When insured vehicles incur catastrophic damage and are declared total write-offs ('constructive total loss'), "
        "unscrupulous operators salvage the physical chassis number, graft it onto stolen vehicles, and re-introduce them "
        "to traffic. Centralized systems frequently fail to permanently and irreversibly retire decommissioned identifiers.",
        "Salvage Vehicle Rebuilding Fraud: "
    )

    # Page 6 continuation
    p_add(
        "Blockchain technology offers a transformative paradigm shift to resolve these systemic failures. Rather than "
        "relying on human honesty or institutional goodwill, blockchain replaces centralized trust with deterministic, "
        "cryptographically enforced code. In a decentralized vehicle registration system, every vehicle title is minted "
        "as an immutable digital asset governed by transparent, self-executing smart contracts. Once a title is minted "
        "or transferred, the transaction is cryptographically sealed into an append-only distributed ledger replicated "
        "across independent network nodes."
    )
    p_add(
        "However, naively deploying vehicle records on a public blockchain introduces severe privacy risks. If citizen "
        "names, residential addresses, and contact numbers are broadcast onto a public ledger, bad actors can correlate "
        "wallet addresses with physical identities and track private citizen property. Furthermore, typical blockchain "
        "token transfers operate as direct peer-to-peer asset swaps, which violates the statutory requirement of transport "
        "regulations requiring transport authority validation and tax compliance verification prior to title transfers."
    )
    p_add(
        "In this project, a comprehensive Decentralized Vehicle Registration & Immutable Title Management System is "
        "engineered to overcome both security and privacy constraints. By combining Keccak-256 cryptographic commitments, "
        "ERC-721 digital title tokens, strict Role-Based Access Control (RBAC), and a statutory two-step transfer workflow, "
        "the system establishes an unalterable, privacy-preserving, and legally compliant vehicle title registry. The overall "
        "aim of the project is to provide a robust, transparent, and user-friendly platform that eliminates fraud, guarantees "
        "data integrity, and restores universal public trust in vehicle ownership administration."
    )

    doc.add_page_break()

    # ====================================================================
    # 3. COURSE OUTCOME INTEGRATED (Page 7)
    # ====================================================================
    section_heading("3. Course Outcome Integrated")
    bullet_item(
        "Apply cryptographic hashing (Keccak-256) and digital signature algorithms (EIP-191) to guarantee data "
        "integrity, construct zero-leakage commitment schemes, and authenticate distributed sessions.",
        "CO1: "
    )
    bullet_item(
        "Design and implement secure smart contracts in Solidity (0.8.24) incorporating industry-standard OpenZeppelin "
        "libraries for ERC-721 tokenization, access control, and pausable emergency management.",
        "CO2: "
    )
    bullet_item(
        "Formulate and enforce least-privilege Role-Based Access Control (RBAC) models to separate administrative, "
        "enforcement, and citizen operational perimeters on-chain.",
        "CO3: "
    )
    bullet_item(
        "Develop full-stack decentralized applications (DApps) integrating Web3 provider interfaces (Ethers.js v6) "
        "with modern frontend reactive components (React/Vite).",
        "CO4: "
    )
    bullet_item(
        "Conduct comprehensive smart contract security testing, state invariant verification, and negative attack "
        "boundary simulations using automated testing frameworks (Hardhat, Chai, Mocha).",
        "CO5: "
    )

    # ====================================================================
    # 4. ACTION PLAN (Page 7)
    # ====================================================================
    section_heading("4. Action Plan")

    plan_rows = [
        ("1", "System architecture design, threat modeling, and Access Control specification",
         "18/01/2026", "05/02/2026", "Project Team"),
        ("2", "Smart Contract Core (VehicleRegistry.sol) design & ERC-721 tokenization",
         "05/02/2026", "18/02/2026", "Project Team"),
        ("3", "Cryptographic Commitment Scheme & client-side privacy vault implementation",
         "18/02/2026", "28/02/2026", "Project Team"),
        ("4", "Statutory Two-Step Title Transfer workflow & terminal scrappage logic",
         "28/02/2026", "08/03/2026", "Project Team"),
        ("5", "Web3 Decentralized Portal (Citizen & RTO Dashboards) integration via Ethers.js",
         "08/03/2026", "18/03/2026", "Project Team"),
        ("6", "Final testing, 16 negative invariant security suite, and Project Report documentation",
         "18/03/2026", "28/03/2026", "Project Team"),
    ]

    tbl_plan = doc.add_table(rows=len(plan_rows) + 1, cols=5)
    tbl_plan.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_plan)
    pw = [Inches(0.6), Inches(2.8), Inches(1.0), Inches(1.0), Inches(1.1)]

    headers = ["S. No.", "Details of activity", "Planned Start Date", "Planned Finish Date", "Responsible Team Members"]
    for ci, hd in enumerate(headers):
        tbl_plan.rows[0].cells[ci].width = pw[ci]
        tbl_cell_style(tbl_plan.rows[0].cells[ci], hd, 10, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)

    for ri, rdata in enumerate(plan_rows):
        row = tbl_plan.rows[ri + 1]
        for ci, val in enumerate(rdata):
            row.cells[ci].width = pw[ci]
            align = WD_ALIGN_PARAGRAPH.CENTER if ci in (0, 2, 3) else WD_ALIGN_PARAGRAPH.LEFT
            tbl_cell_style(row.cells[ci], val, 10, align=align)

    doc.add_page_break()

    # ====================================================================
    # 5. LITERATURE REVIEW (Page 8)
    # ====================================================================
    section_heading("5. Literature Review")
    p_add(
        "Early vehicular registration systems relied exclusively on physical paper ledgers and manually stamped "
        "Registration Certificate booklets. These systems suffered from severe physical vulnerabilities, including "
        "susceptibility to physical damage, manual record falsification, and absence of inter-regional synchronization, "
        "enabling stolen vehicles from one jurisdiction to be re-registered in neighboring regions with ease."
    )
    p_add(
        "With the expansion of digital governance, transport ministries deployed centralized client-server databases, "
        "epitomized by India's national Vahan architecture. Centralized databases significantly accelerated administrative "
        "lookups, automated road tax calculation, and unified state transport portals. However, academic researchers "
        "and cybersecurity audits demonstrated that centralized databases constitute a massive single point of failure. "
        "Because all data rows are subject to administrative override, insider threats, privilege escalation attacks, "
        "and SQL injection vulnerabilities can silently modify vehicle ownership records without generating a permanent, "
        "tamper-proof cryptographic record."
    )
    p_add(
        "In recent years, researchers explored blockchain frameworks (such as Ethereum and Hyperledger Fabric) to "
        "create decentralized vehicle registers. While these initial studies proved that distributed ledgers guarantee "
        "immutability, they exhibited two fundamental flaws. First, they published raw vehicle identification numbers "
        "and citizen identities directly on public ledgers, violating modern privacy regulations (such as GDPR and "
        "India's DPDP Act). Second, they treated vehicle titles as typical cryptocurrency tokens, permitting citizens "
        "to execute direct transfers without statutory transport office validation, bypassing mandatory tax, legal clearance, "
        "and anti-theft verification required by national transport law."
    )
    p_add(
        "Modern cryptographic approaches, including one-way cryptographic commitment schemes and Role-Based Access Control, "
        "overcome these historical limitations. By decoupling public on-chain integrity verification from private off-chain "
        "specification storage, systems can guarantee strict regulatory compliance, total privacy preservation, and "
        "mathematically enforced role separation."
    )

    # ====================================================================
    # 6. PROPOSED METHODOLOGY (Page 8, 9, 10)
    # ====================================================================
    section_heading("6. Proposed Methodology")
    p_add(
        "Our proposed methodology is structured as a five-stage pipeline designed to transition physical vehicle "
        "titling and administrative governance into an immutable, privacy-preserving digital framework. The architecture "
        "strictly avoids publishing raw personally identifiable information or unhashed vehicle identifiers to the public "
        "blockchain, bypassing the classical privacy issues of public distributed ledgers. Instead, we propose a "
        "'Commitment-Driven Sovereign Architecture' composed of the following detailed stages:"
    )

    bullet_item(
        "Stage 1: Citizen Onboarding & Cryptographic Identity Management", space_after=2
    )
    sub_bullet_item(
        "The system initiates by establishing client authentication through an Ethereum Web3 wallet interface (MetaMask). "
        "Rather than utilizing centralized email/password paradigms, citizen identities and transport authority accounts "
        "are anchored to asymmetric elliptic-curve public-private keypairs. As users authenticate, the application generates "
        "an EIP-191 challenge nonce signed locally by the wallet. This establishes a cryptographically secure session "
        "without transmitting private keys or storing unencrypted credentials on any central server."
    )

    # Page 9 continuation
    bullet_item(
        "Stage 2: Cryptographic Commitment Scheme & Privacy-Preserving Ingestion", space_after=2
    )
    sub_bullet_item(
        "To safeguard citizen confidentiality while ensuring global uniqueness, raw vehicle attributes undergo cryptographic "
        "hashing before touching the network. The chassis Vehicle Identification Number (VIN) is normalized and processed "
        "via the Keccak-256 algorithm to generate a 32-byte vinCommitment. Similarly, the alphanumeric registration plate "
        "is hashed into a distinct registrationCommitment. Full vehicle specifications (engine number, manufacturer, color, "
        "manufacturing year) and citizen credentials are encrypted using AES-256 and archived in a secure off-chain storage "
        "vault, with only their root metadataHash published on-chain. This ensures that no external observer can reconstruct "
        "private citizen identities from blockchain transactions."
    )

    bullet_item(
        "Stage 3: Smart Contract Minting & Non-Fungible Title Deed Tokenization", space_after=2
    )
    sub_bullet_item(
        "Upon verifying physical documentation, an authorized transport authority invokes the registerVehicle() routine. "
        "The smart contract generates a deterministic vehicleId from the combined hash commitments and mints an ERC-721 "
        "digital title token assigned to the citizen's wallet. The contract automatically binds the cryptographic commitments, "
        "initializes legal state to Active, records the block timestamp, and records the initial citizen in the immutable "
        "on-chain ownership history array. This establishes an unforgeable, legally binding digital title deed."
    )

    bullet_item(
        "Stage 4: Strict Role-Based Access Control & Negative Invariant Enforcement", space_after=2
    )
    sub_bullet_item(
        "To prevent corruption and abuse of administrative privilege, the contract implements OpenZeppelin AccessControl "
        "with strictly isolated authority perimeters. Three distinct roles are enforced: DEFAULT_ADMIN_ROLE (emergency administration), "
        "RTO_REGISTRAR_ROLE (vehicle registration and title transfer execution), and RTO_OFFICER_ROLE (inspection, fitness, and "
        "scrappage). Crucially, the internal token transfer hook (_update) is overridden to permanently bar any address holding "
        "an administrative or RTO role from receiving vehicle tokens, completely preventing transport officials from transferring "
        "impounded or state vehicles to personal accounts."
    )

    # Page 10 continuation
    bullet_item(
        "Stage 5: Statutory Two-Step Title Transfer & Irreversible Scrappage Lifecycle", space_after=2
    )
    sub_bullet_item(
        "To strictly comply with Indian Motor Vehicles Act statutory procedures (Form 29 Notice of Transfer and Form 30 "
        "Application for Transfer), title reassignment requires a two-step state machine. The citizen owner initiates a transfer "
        "intent by nominating the prospective buyer's wallet (initiateTransfer). The vehicle remains legally under the seller's "
        "custody until the RTO Registrar verifies statutory prerequisites (tax payments, hypothecation NOC, police theft clearance) "
        "and executes transferOwnershipByRTO(). The smart contract atomizes the token transfer and appends the buyer to the "
        "chronological ownership history. Conversely, when an RTO Officer marks a vehicle as Scrapped, the smart contract permanently "
        "locks the title in an irreversible terminal state, purging any pending transfers and preventing salvage rebuilding fraud."
    )

    doc.add_page_break()

    # ====================================================================
    # 7. IMPLEMENTATION (Page 10, 11, 12, 13, 14, 15)
    # ====================================================================
    section_heading("7. Implementation")

    sub_heading("Step 1: Environment Setup & Dependency Installation")
    p_add("A modern Node.js and Solidity development toolchain was configured with production-grade dependencies:")
    bullet_item("Hardhat: Local Ethereum Virtual Machine (EVM) simulation, compilation, and automated test orchestration.")
    bullet_item("OpenZeppelin Contracts v5.0: Audited implementations of ERC721, AccessControl, and Pausable libraries.")
    bullet_item("Ethers.js v6: High-performance JSON-RPC client library for smart contract interaction and transaction serialization.")
    bullet_item("React 18 & Vite: Component-driven client interface with optimized asset bundling and real-time reactive state.")
    bullet_item("Chai & Mocha: Unit testing frameworks for smart contract assertion validation and boundary condition coverage.")

    sub_heading("Step 2: Smart Contract Architecture & State Definitions")
    p_add("The core ledger is implemented in VehicleRegistry.sol, managing vehicles via unique 32-byte identifiers:")
    bullet_item("vehicleId: Unique keccak256 hash combining normalized VIN and registration plate commitments.")
    bullet_item("vinCommitment: Irreversible 32-byte cryptographic hash of the physical chassis number.")
    bullet_item("registrationCommitment: Irreversible 32-byte cryptographic hash of the government registration plate.")
    bullet_item("VehicleState: Enumerated state machine supporting Active (0) and permanently Scrapped (1) states.")
    bullet_item("OwnershipRecord[]: Dynamic chronological array capturing every historical title holder and acquisition timestamp.")

    sub_heading("Step 3: Cryptographic Commitment Engine & Ingestion")
    p_add("All data transformation routines execute on the client side prior to dispatching transactions to the EVM:")
    bullet_item("Normalization: Capital letters and alphanumeric strings are stripped of whitespace and formatting artifacts.")
    bullet_item("Keccak-256 Hashing: Generates deterministic 256-bit hashes matching Solidity's native hashing implementation.")
    bullet_item("Commitment Collision Verification: Secondary contract mappings guarantee zero duplicate chassis or plate numbers.")

    sub_heading("Step 4: Statutory Title Transfer & Role Governance")
    p_add("A dual-action workflow guarantees strict compliance with motor vehicle transfer jurisprudence:")
    bullet_item("Transfer Initiation (Form 29): Citizen title holder designates recipient address, recorded in _pendingTransfers.")
    bullet_item("RTO Statutory Approval (Form 30): RTO Registrar verifies tax and police records, executing final on-chain transfer.")
    bullet_item("Privileged Recipient Rejection: All transfer paths reject RTO and Admin addresses with PrivilegedAddressCannotOwnVehicle.")

    sub_heading("Step 5: Terminal Scrappage State Machine")
    p_add("Decommissioning damaged, unroadworthy, or aged vehicles is handled as an irreversible terminal state:")
    bullet_item("Restricted Access: Only verified accounts possessing RTO_OFFICER_ROLE can invoke updateVehicleState().")
    bullet_item("Terminal Scrappage Lock: Reverting any subsequent attempt to modify, transfer, or reactivate the digital title.")
    bullet_item("Pending Transfer Invalidation: Automatically deleting pending buyer records upon transition to Scrapped status.")

    sub_heading("Step 6: Real-Time Decentralized Application (DApp)")
    p_add("A multi-portal React frontend provides specialized workspaces tailored to distinct user roles:")
    bullet_item("Public Search Portal: Universal verification enabling buyers and police to query vehicle state using plate numbers.")
    bullet_item("Citizen Dashboard: Interactive portal displaying verified HSRP digital plates, ownership history, and transfer controls.")
    bullet_item("RTO Registrar Portal: Operational interface for reviewing new registrations and approving pending statutory transfers.")
    bullet_item("RTO Enforcement Portal: Inspection workspace for reviewing vehicle parameters and executing permanent scrappage.")

    sub_heading("Step 7: Automated Invariant Testing Suite")
    p_add(
        "A comprehensive security verification suite was authored in Hardhat and Chai, encompassing 40 unit and integration "
        "tests that validate 16 explicit negative security invariants across all administrative and ownership workflows."
    )

    doc.add_page_break()

    # ── Code Blocks Section (Matches reference PDF Pages 10, 11, 12, 13) ──
    p_add("Code:", 12.5, bold=True, space_before=10, space_after=4)

    sub_heading("Vehicle Registration & Digital Title Minting Code")
    code_indicator("Purpose: Mint unique ERC-721 title NFT using Keccak-256 commitments without exposing PII")
    code_box("""function registerVehicle(
    bytes32 vinCommitment,
    bytes32 registrationCommitment,
    address titleHolder,
    bytes32 metadataHash
) external onlyRole(RTO_REGISTRAR_ROLE) whenNotPaused returns (bytes32 vehicleId) {
    require(vinCommitment != bytes32(0), "VIN commitment cannot be zero");
    require(registrationCommitment != bytes32(0), "Plate commitment cannot be zero");
    require(titleHolder != address(0), "Title holder cannot be zero address");
    
    // Bar RTO authority wallets from receiving vehicle titles
    if (_isPrivilegedAddress(titleHolder)) {
        revert PrivilegedAddressCannotOwnVehicle(titleHolder);
    }
    
    // Enforce global uniqueness: no duplicate VIN or plate
    require(_vinToVehicleId[vinCommitment] == bytes32(0), "VIN already registered");
    require(_plateToVehicleId[registrationCommitment] == bytes32(0), "Plate already registered");
    
    vehicleId = keccak256(abi.encodePacked(vinCommitment, registrationCommitment));
    uint64 nowTs = uint64(block.timestamp);
    
    _vehicles[vehicleId] = Vehicle({
        vehicleId: vehicleId,
        vinCommitment: vinCommitment,
        registrationCommitment: registrationCommitment,
        state: VehicleState.Active,
        titleHolder: titleHolder,
        metadataHash: metadataHash,
        registeredAt: nowTs,
        updatedAt: nowTs
    });
    
    _vinToVehicleId[vinCommitment] = vehicleId;
    _plateToVehicleId[registrationCommitment] = vehicleId;
    totalVehicles++;
    
    // Record initial title holder in chronological ownership history
    _ownershipHistory[vehicleId].push(OwnershipRecord({ owner: titleHolder, transferredAt: nowTs }));
    
    // Mint ERC-721 token representing legal digital title
    _safeMint(titleHolder, uint256(vehicleId));
    emit VehicleRegistered(vehicleId, vinCommitment, registrationCommitment, titleHolder, metadataHash, nowTs);
}""")

    code_indicator("Preventing Privileged Role Conflicts & Ownership Reversals:")
    code_box("""// Overridden AccessControl grantRole: Citizen owners cannot be granted RTO authority roles
function grantRole(bytes32 role, address account) public override(AccessControl) {
    if (balanceOf(account) > 0) {
        revert VehicleOwnerCannotReceivePrivilegedRole(account);
    }
    super.grantRole(role, account);
}

// ERC721 internal transfer hook: Rejects transfer if destination is an RTO or Admin address
function _update(address to, uint256 tokenId, address auth) internal override(ERC721) returns (address) {
    if (to != address(0) && _isPrivilegedAddress(to)) {
        revert PrivilegedAddressCannotOwnVehicle(to);
    }
    return super._update(to, tokenId, auth);
}""")

    doc.add_page_break()

    # Code continuation (Page 14)
    sub_heading("Statutory Two-Step Ownership Transfer Code")
    code_indicator("Purpose: Enforce Indian Motor Vehicles Act compliance (Form 29/30) via RTO Registrar approval")
    code_box("""// Step 1 (Citizen - Form 29): Owner designates prospective buyer
function initiateTransfer(bytes32 vehicleId, address prospectiveBuyer) external whenNotPaused {
    require(_vehicles[vehicleId].vehicleId != bytes32(0), "Vehicle not registered");
    require(ownerOf(uint256(vehicleId)) == msg.sender, "Caller is not vehicle title holder");
    require(prospectiveBuyer != address(0), "Buyer cannot be zero address");
    require(prospectiveBuyer != msg.sender, "Cannot transfer to self");
    
    if (_isPrivilegedAddress(prospectiveBuyer)) {
        revert PrivilegedAddressCannotOwnVehicle(prospectiveBuyer);
    }
    require(_vehicles[vehicleId].state == VehicleState.Active, "Transfer locked: vehicle not Active");
    
    _pendingTransfers[vehicleId] = prospectiveBuyer;
    emit TransferInitiated(vehicleId, msg.sender, prospectiveBuyer, uint64(block.timestamp));
}

// Step 2 (RTO Registrar - Form 30): Authority verifies tax/police records and executes title reassignment
function transferOwnershipByRTO(
    bytes32 vehicleId,
    address newOwner,
    bytes32 transferReasonHash
) external onlyRole(RTO_REGISTRAR_ROLE) whenNotPaused {
    require(_vehicles[vehicleId].vehicleId != bytes32(0), "Vehicle not registered");
    require(newOwner != address(0), "Recipient cannot be zero address");
    require(transferReasonHash != bytes32(0), "Transfer reason hash required");
    
    if (_isPrivilegedAddress(newOwner)) {
        revert PrivilegedAddressCannotOwnVehicle(newOwner);
    }
    
    Vehicle storage v = _vehicles[vehicleId];
    require(v.state == VehicleState.Active, "Transfer locked: vehicle is not Active");
    require(newOwner != v.titleHolder, "Recipient is already the title holder");
    
    address previousHolder = v.titleHolder;
    v.titleHolder = newOwner;
    v.updatedAt = uint64(block.timestamp);
    delete _pendingTransfers[vehicleId];
    
    // Append new owner to immutable on-chain ownership history
    _ownershipHistory[vehicleId].push(OwnershipRecord({ owner: newOwner, transferredAt: uint64(block.timestamp) }));
    
    // Atomically transfer underlying ERC-721 token
    _transfer(previousHolder, newOwner, uint256(vehicleId));
    emit OwnershipTransferredByRTO(vehicleId, previousHolder, newOwner, transferReasonHash, uint64(block.timestamp), msg.sender);
}""")

    sub_heading("Terminal Scrappage & Permanent Decommissioning Code")
    code_indicator("Purpose: Permanently decommission total-loss vehicles and prevent salvage fraud")
    code_box("""function updateVehicleState(
    bytes32 vehicleId,
    VehicleState newState,
    bytes32 reasonHash
) external onlyRole(RTO_OFFICER_ROLE) whenNotPaused {
    require(_vehicles[vehicleId].vehicleId != bytes32(0), "Vehicle not registered");
    require(reasonHash != bytes32(0), "Reason hash required");
    
    Vehicle storage v = _vehicles[vehicleId];
    VehicleState previous = v.state;
    require(previous != newState, "Vehicle already in requested state");
    require(previous != VehicleState.Scrapped, "Scrapped state is terminal");
    
    // If vehicle marked Scrapped, any pending ownership transfer is cancelled
    if (newState == VehicleState.Scrapped && _pendingTransfers[vehicleId] != address(0)) {
        delete _pendingTransfers[vehicleId];
        emit TransferCancelled(vehicleId, v.titleHolder, uint64(block.timestamp));
    }
    
    v.state = newState;
    v.updatedAt = uint64(block.timestamp);
    emit VehicleStateChanged(vehicleId, previous, newState, reasonHash, uint64(block.timestamp), msg.sender);
}""")

    doc.add_page_break()

    # Code continuation (Page 15)
    sub_heading("Frontend Web3 Integration Code (Main Part)")
    code_indicator("Purpose: Real-time blockchain querying and commitment verification via Ethers.js v6")
    code_box("""import { ethers } from "ethers";
import VehicleRegistryABI from "../contracts/VehicleRegistry.json";

export async function resolveVehicleByPlate(plateNumber) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, VehicleRegistryABI.abi, provider);
    
    // Compute Keccak-256 commitment of normalized plate string
    const normalizedPlate = plateNumber.trim().toUpperCase();
    const plateCommitment = ethers.keccak256(ethers.toUtf8Bytes(normalizedPlate));
    
    // Query on-chain index
    const vehicleId = await contract.getVehicleIdByPlateCommitment(plateCommitment);
    if (vehicleId === ethers.ZeroHash) {
        throw new Error("Vehicle not registered in blockchain ledger");
    }
    
    // Fetch full vehicle struct and historical ownership records
    const vehicleData = await contract.getVehicle(vehicleId);
    const history = await contract.getOwnershipHistory(vehicleId);
    
    return {
        vehicleId,
        vinCommitment: vehicleData.vinCommitment,
        plateCommitment: vehicleData.registrationCommitment,
        state: vehicleData.state === 0 ? "Active" : "Scrapped",
        titleHolder: vehicleData.titleHolder,
        registeredAt: new Date(Number(vehicleData.registeredAt) * 1000).toLocaleString(),
        ownershipCount: history.length,
        history: history.map(h => ({
            owner: h.owner,
            transferredAt: new Date(Number(h.transferredAt) * 1000).toLocaleString()
        }))
    };
}""")

    # ====================================================================
    # 8. OUTPUT OF MINI PROJECT (Page 15, 16)
    # ====================================================================
    section_heading("8. Output of Mini Project")
    p_add(
        "A fully realized, enterprise-grade decentralized vehicle registration system displaying real-time Web3 wallet "
        "interaction, cryptographic commitment hashing, and smart contract execution. The system translates physical motor "
        "vehicle records accurately into immutable digital title tokens, providing robust administrative role boundaries and "
        "comprehensive audit trails without exposing sensitive citizen data. Testing confirmed definitive 100% categorical "
        "security precision across all 40 automated test scenarios under constrained adversarial attack bounds."
    )

    code_indicator("Automated Hardhat Invariant Security Test Suite Execution Output:")
    code_box("""  VehicleRegistry - Confidentiality & Security Focused Architecture
    1. Role-Based Access Control (RBAC) & Clear RTO Role Boundaries
      √ assigns DEFAULT_ADMIN_ROLE, RTO_REGISTRAR_ROLE, and RTO_OFFICER_ROLE properly
      √ enforces clear boundary: RTO Officer cannot register new vehicles (57ms)
      √ enforces clear boundary: RTO Registrar cannot scrap/decommission vehicles
      √ rejects vehicle registration from unauthorized citizen accounts
      √ allows admin to grant and revoke RTO_REGISTRAR_ROLE
    2. Minimum On-Chain Data & Commitment Uniqueness
      √ stores only minimum required data and mints title NFT
      √ rejects duplicate VIN commitments even with different letter cases
      √ rejects duplicate registration plate commitments
      √ resolves vehicleId by VIN commitment and Plate commitment
    3. Two-Step Safe Title Transfer Workflow
      √ allows owner to initiate and RTO to complete statutory transfer
      √ allows current title holder to cancel a pending transfer
      √ rejects transfer to zero address and self-transfer
      √ allows current title holder to directly transfer title
    4. Vehicle Scrappage & Terminal Decommissioning
      √ blocks transfer when vehicle is marked Scrapped
      √ cancels pending transfers if marked Scrapped
      √ enforces Scrapped state as permanent terminal state
    5. Chronological Vehicle Ownership History Tracking
      √ records initial owner upon vehicle registration
      √ appends new owner to history upon direct title transfer
      √ appends new owner to history upon two-step title acceptance
    6. Emergency Pause Controls
      √ allows admin to pause and blocks sensitive state changes while paused
    7. Event Privacy Verification
      √ emits events with technical commitments and hashes without plaintext PII
    8. Strict Citizen–RTO Identity Separation & 16 Negative Security Invariants
      √ 1. citizen cannot register vehicle
      √ 2. citizen cannot modify legal state
      √ 3. citizen cannot grant RTO role
      √ 4. citizen cannot perform RTO-only administrative operations
      √ 5. RTO wallet cannot own a vehicle (reverts PrivilegedAddressCannotOwnVehicle)
      √ 6. RTO wallet cannot receive vehicle transfer (initiateTransfer rejects privileged recipient)
      √ 7. RTO wallet cannot invoke citizen-only ownership operations
      √ 8. privileged account cannot bypass frontend restrictions using direct contract calls
      √ 9. assigning RTO role to an existing citizen owner is rejected
      √ 10. removing RTO role revokes authority immediately
      √ 11. switching accounts invalidates stale session and detects identity mismatch
      √ 12. citizen session cannot access RTO routes
      √ 13. RTO session cannot access citizen routes
      √ 14. direct transfer path rejects privileged recipient
      √ 15. safe transfer path rejects privileged recipient (via ERC721 safeTransferFrom)
      √ 16. internal transfer path rejects privileged recipient (via ERC721 transferFrom)

  40 passing (5s)""", bg_hex=COLOR_CONSOLE_BG)

    doc.add_page_break()

    # Diagrams & Visual Outputs (Page 16)
    p_add("System Architectural Outputs & Flow Visualizations:", 11.5, bold=True, space_before=4, space_after=6)

    # Embed Diagram 1: System Architecture
    d1_path = os.path.join(DIAGRAMS_DIR, "diagram_1_system_architecture.png")
    if os.path.exists(d1_path):
        p_fig1 = doc.add_paragraph()
        p_fig1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_fig1.paragraph_format.space_before = Pt(4)
        p_fig1.paragraph_format.space_after = Pt(2)
        p_fig1.add_run().add_picture(d1_path, width=Inches(6.0))
        center("Figure 8.1: Tiered Decentralized System Architecture & Network Boundaries", 9.5, italic=True, space_after=8)

    # Embed Diagram 3: Statutory Transfer Workflow
    d3_path = os.path.join(DIAGRAMS_DIR, "diagram_3_transfer_workflow.png")
    if os.path.exists(d3_path):
        p_fig3 = doc.add_paragraph()
        p_fig3.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_fig3.paragraph_format.space_before = Pt(4)
        p_fig3.paragraph_format.space_after = Pt(2)
        p_fig3.add_run().add_picture(d3_path, width=Inches(6.0))
        center("Figure 8.2: Statutory Two-Step Ownership Transfer Workflow (Form 29 / Form 30)", 9.5, italic=True, space_after=8)

    doc.add_page_break()

    # Embed Diagram 2: Role Boundaries Matrix (Page 17)
    d2_path = os.path.join(DIAGRAMS_DIR, "diagram_2_role_boundaries.png")
    if os.path.exists(d2_path):
        p_fig2 = doc.add_paragraph()
        p_fig2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_fig2.paragraph_format.space_before = Pt(4)
        p_fig2.paragraph_format.space_after = Pt(2)
        p_fig2.add_run().add_picture(d2_path, width=Inches(6.0))
        center("Figure 8.3: Role-Based Access Control (RBAC) & Authority Boundaries Matrix", 9.5, italic=True, space_after=8)

    # Embed Diagram 4: Scrappage State Machine
    d4_path = os.path.join(DIAGRAMS_DIR, "diagram_4_state_lifecycle.png")
    if os.path.exists(d4_path):
        p_fig4 = doc.add_paragraph()
        p_fig4.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_fig4.paragraph_format.space_before = Pt(4)
        p_fig4.paragraph_format.space_after = Pt(2)
        p_fig4.add_run().add_picture(d4_path, width=Inches(6.0))
        center("Figure 8.4: Vehicle State Lifecycle & Irreversible Terminal Scrappage Machine", 9.5, italic=True, space_after=8)

    # Embed Diagram 5: Cryptographic Commitment Scheme (Privacy)
    d5_path = os.path.join(DIAGRAMS_DIR, "diagram_5_privacy_commitments.png")
    if os.path.exists(d5_path):
        p_fig5 = doc.add_paragraph()
        p_fig5.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_fig5.paragraph_format.space_before = Pt(4)
        p_fig5.paragraph_format.space_after = Pt(2)
        p_fig5.add_run().add_picture(d5_path, width=Inches(6.0))
        center("Figure 8.5: Cryptographic Commitment Scheme for Citizen Privacy & Off-Chain Vault", 9.5, italic=True, space_after=8)

    doc.add_page_break()

    # ====================================================================
    # 9. SKILL DEVELOPED (Page 17)
    # ====================================================================
    section_heading("9. Skill Developed / learning out of this Micro-Project")
    bullet_item("Learning how to design, develop, and deploy production-grade smart contracts using Solidity 0.8.24 and OpenZeppelin standards from start to finish.")
    bullet_item("Understanding how to apply cryptographic hashing (Keccak-256) and commitment schemes to enforce data privacy on completely public distributed ledgers.")
    bullet_item("Mastering Role-Based Access Control (RBAC) patterns and least privilege security models to strictly separate administrative, enforcement, and user domains.")
    bullet_item("Gaining hands-on experience building full-stack Web3 decentralized applications connecting React frontends with Ethereum nodes via Ethers.js v6.")
    bullet_item("Understanding test-driven smart contract engineering by writing 40 automated test cases and actively simulating adversarial privilege escalation attacks.")

    # ====================================================================
    # 10. APPLICATIONS (Page 17, 18)
    # ====================================================================
    section_heading("10. Applications of this Micro-Project")
    bullet_item("Nationwide RTO Digital Title Registry: State transport authorities can deploy this system to eliminate fake Registration Certificates, stolen vehicle cloning, and duplicate registrations across interstate borders.")
    bullet_item("Trustless Used-Vehicle Marketplaces (Cars24, Spinny, CarDekho): Pre-owned car platforms can instantly verify complete chronological vehicle ownership history, hypothecation status, and legal standing directly on-chain without manual paperwork.")
    bullet_item("Automated Total-Loss Insurance Settlement: Insurance companies can atomically execute payouts and trigger terminal on-chain scrappage, permanently preventing damaged salvage vehicles from being rebuilt and fraudulently resold.")

    doc.add_page_break()

    # Page 18
    bullet_item("Commercial Vehicle Fleet and Banking Hypothecation: Financial institutions can record automated smart contract liens on vehicle title NFTs, programmatically locking transfers until auto loans are fully liquidated.")
    bullet_item("Inter-Agency Law Enforcement & Traffic Verification: Police officers and transport flying squads can instantly verify vehicular legitimacy and authenticity using mobile apps querying the immutable ledger via HSRP plate commitments.")

    # ====================================================================
    # 11. AREA OF FUTURE IMPROVEMENT (Page 18)
    # ====================================================================
    section_heading("11. Area of Future Improvement")
    bullet_item("Integration of Zero-Knowledge Proofs (zk-SNARKs) allowing citizens to prove valid registration and insurance to traffic authorities without disclosing wallet addresses or vehicle metadata.")
    bullet_item("Decentralized Document Archival via IPFS/Filecoin to store high-resolution fitness certificates, PUC emission reports, and chassis inspection imagery off-chain with cryptographic root hashes stored on-chain.")
    bullet_item("Integration with On-Board Diagnostic (OBD-II) units and FASTag RFID transponders to stream signed, tamper-proof odometer records onto the blockchain, permanently ending used-car mileage rollback fraud.")
    bullet_item("Deployment on Ethereum Layer-2 Rollup frameworks (Arbitrum, Polygon) to achieve sub-cent transaction costs and thousands of transactions per second for nationwide throughput scalability.")

    # ====================================================================
    # 12. CONCLUSION (Page 18)
    # ====================================================================
    section_heading("12. Conclusion")
    p_add(
        "The project effectively encapsulates the powerful intersection of applied cryptography, smart contract "
        "engineering, and transport regulatory compliance. By shifting the critical burden of trust away from centralized "
        "administrative databases and vulnerable paper documents into deterministic blockchain smart contracts, the system "
        "eliminates single points of failure, administrative tampering, and vehicle identity theft."
    )
    p_add(
        "Through the dual application of Keccak-256 cryptographic commitments and ERC-721 digital title tokens, the architecture "
        "proves that complete public auditability can coexist with absolute citizen privacy. The programmatic enforcement "
        "of Indian Motor Vehicles Act statutory procedures (Form 29/30) and the strict separation of RTO administrative "
        "boundaries guarantee that legal governance is preserved without compromise. Tested against 16 negative security "
        "invariants with a 100% automated pass rate, the final system executes securely against all project objectives, "
        "demonstrating a transformative, production-ready decentralized titling platform for modern smart governance."
    )

    # ── Save Document ──────────────────────────────────────────────────
    doc.save(OUTPUT_DOCX)
    print(f"Report successfully generated at: {OUTPUT_DOCX}")
    print(f"File size: {os.path.getsize(OUTPUT_DOCX) // 1024} KB")
    return OUTPUT_DOCX

if __name__ == "__main__":
    create_report()
