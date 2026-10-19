"""
build_case_study.py
Creates a professional Case Study document for:
"Decentralized Vehicle Registration & Immutable Title Management System
 Using Blockchain Technology"
MGM University format - Times New Roman, simple language, clean design.
"""

import os
import shutil
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

HOME = os.path.expanduser("~")
OUTPUT_PROJECT  = r"d:\BC project\Blockchain_VRS_Case_Study.docx"
OUTPUT_DESKTOP  = os.path.join(HOME, "Desktop", "Blockchain_VRS_Case_Study.docx")
OUTPUT_DOWNLOADS= os.path.join(HOME, "Downloads", "Blockchain_VRS_Case_Study.docx")
OUTPUT_ARTIFACT = r"C:\Users\Krushna\.gemini\antigravity\brain\05af4329-1e0d-4b3d-af5b-060ca7138a6d\Blockchain_VRS_Case_Study.docx"
LOGO_PATH       = r"d:\BC project\scripts\template_logorId5.png"

FONT = "Times New Roman"

# ── helpers ────────────────────────────────────────────────────────────────────

def para(doc, text="", size=12, bold=False, italic=False,
         align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=0, space_after=6,
         color=None, style=None):
    p = doc.add_paragraph(style=style) if style else doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after  = Pt(space_after)
    p.paragraph_format.line_spacing = Pt(18)
    if text:
        r = p.add_run(text)
        r.font.name  = FONT
        r.font.size  = Pt(size)
        r.font.bold  = bold
        r.font.italic = italic
        if color:
            r.font.color.rgb = color
    return p

def run(paragraph, text, size=12, bold=False, italic=False, color=None):
    r = paragraph.add_run(text)
    r.font.name   = FONT
    r.font.size   = Pt(size)
    r.font.bold   = bold
    r.font.italic = italic
    if color:
        r.font.color.rgb = color
    return r

def heading(doc, text, level=1):
    sizes = {1: 16, 2: 14, 3: 12}
    p = para(doc, text, size=sizes.get(level, 12), bold=True,
             align=WD_ALIGN_PARAGRAPH.LEFT, space_before=10, space_after=4)
    # underline h1
    if level == 1:
        p.runs[0].font.underline = True
    return p

def bullet(doc, items, size=11.5):
    for item in items:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after  = Pt(4)
        p.paragraph_format.line_spacing = Pt(17)
        p.paragraph_format.left_indent  = Inches(0.3)
        r = p.add_run(f"• {item}")
        r.font.name = FONT
        r.font.size = Pt(size)

def divider(doc):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after  = Pt(4)
    p.paragraph_format.line_spacing = Pt(12)

def page_break(doc):
    doc.add_page_break()

def set_cell(cell, text, size=11, bold=False, align=WD_ALIGN_PARAGRAPH.LEFT,
             bg_hex=None):
    cell.text = ""
    p = cell.paragraphs[0]
    p.alignment = align
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after  = Pt(2)
    r = p.add_run(text)
    r.font.name = FONT
    r.font.size = Pt(size)
    r.font.bold = bold
    if bg_hex:
        tc   = cell._tc
        tcPr = tc.get_or_add_tcPr()
        shd  = OxmlElement("w:shd")
        shd.set(qn("w:val"),   "clear")
        shd.set(qn("w:color"), "auto")
        shd.set(qn("w:fill"),  bg_hex)
        tcPr.append(shd)

# ── main ───────────────────────────────────────────────────────────────────────

def build():
    doc = Document()

    # Page margins
    for section in doc.sections:
        section.top_margin    = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin   = Inches(1.2)
        section.right_margin  = Inches(1.0)

    # ── COVER PAGE ─────────────────────────────────────────────────────────────
    # Logo
    if os.path.exists(LOGO_PATH):
        lp = doc.add_paragraph()
        lp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        lp.paragraph_format.space_before = Pt(0)
        lp.paragraph_format.space_after  = Pt(6)
        lp.add_run().add_picture(LOGO_PATH, width=Inches(1.3))

    para(doc, "School of Engineering and Technology",
         size=13, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    para(doc, "MGM University, Chh. Sambhajinagar",
         size=12, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    para(doc, "Academic Year 2025-2026",
         size=11, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=20)

    para(doc, "CASE STUDY REPORT",
         size=18, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER,
         color=RGBColor(0, 51, 102), space_before=10, space_after=6)

    para(doc, "On", size=12, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(4)
    p_title.paragraph_format.space_after  = Pt(16)
    run(p_title,
        '"Decentralized Vehicle Registration & Immutable Title\n'
        'Management System Using Blockchain Technology"',
        size=15, bold=True)

    para(doc, "Course: Blockchain (Course Code: CSB24PCC452)",
         size=11.5, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    para(doc, "Computer Science and Engineering (IoT, Cyber Security Including Blockchain Technology)",
         size=11, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=16)

    # Student info box
    tbl = doc.add_table(rows=3, cols=2)
    tbl.style = "Table Grid"
    info_rows = [
        ("Students",       "Rohit Dhananjay Kale (PRN: 202356112007)\nSoham Bhagwan Deshmukh (PRN: 202356112008)"),
        ("Guide",          "Ms. Bhagat C. B. (Asst. Professor)"),
        ("Academic Year",  "2025-2026"),
    ]
    for i, (label, val) in enumerate(info_rows):
        set_cell(tbl.rows[i].cells[0], label, bold=True, size=11, bg_hex="D9E2F3")
        set_cell(tbl.rows[i].cells[1], val, size=11)

    page_break(doc)

    # ── TABLE OF CONTENTS (manual) ─────────────────────────────────────────────
    heading(doc, "CONTENTS", level=2)
    toc_items = [
        ("1", "Executive Summary"),
        ("2", "Problem Statement"),
        ("3", "Objectives & Course Outcomes (CO)"),
        ("4", "System Design"),
        ("5", "Technical Stack"),
        ("6", "Key Features"),
        ("7", "Implementation"),
        ("8", "Testing & Results"),
        ("9", "Applications"),
        ("10", "Future Scope"),
        ("11", "Conclusion"),
    ]
    toc = doc.add_table(rows=len(toc_items), cols=2)
    toc.style = "Table Grid"
    for i, (num, title) in enumerate(toc_items):
        set_cell(toc.rows[i].cells[0], num, size=11, align=WD_ALIGN_PARAGRAPH.CENTER, bg_hex="D9E2F3")
        set_cell(toc.rows[i].cells[1], title, size=11)

    page_break(doc)

    # ── SECTION 1: EXECUTIVE SUMMARY ──────────────────────────────────────────
    heading(doc, "1. Executive Summary", level=1)
    para(doc,
         "This case study presents a Mini-Project developed by students of MGM University as part of "
         "their Blockchain Technology & Cyber Security course. The project builds a fully functional "
         "Decentralized Vehicle Registration System on the Ethereum blockchain.",
         size=11.5)
    para(doc,
         "Currently, India's vehicle registration system depends on central government databases (like Vahan). "
         "These systems suffer from issues like fake RC papers, stolen car re-registration, and internal data "
         "manipulation. Our project replaces the central database with a blockchain-based system where every "
         "vehicle title is stored as a tamper-proof digital NFT.",
         size=11.5)
    para(doc,
         "The project successfully completed 40 automated security tests with a 100% pass rate. It includes "
         "a working web application with portals for citizens, RTO Registrars, and RTO Officers.",
         size=11.5)

    # Quick-facts table
    divider(doc)
    qf = doc.add_table(rows=5, cols=2)
    qf.style = "Table Grid"
    qf_data = [
        ("Project Title",     "Decentralized Vehicle Registration & Immutable Title Management System"),
        ("Technology Used",   "Solidity 0.8.24, Ethereum, ERC-721, Hardhat, React 18, Ethers.js v6"),
        ("Total Test Cases",  "40 automated tests — 100% pass rate"),
        ("Team Members",      "Rohit Dhananjay Kale, Soham Bhagwan Deshmukh"),
        ("University",        "MGM University, Chh. Sambhajinagar — Academic Year 2025-2026"),
    ]
    for i, (k, v) in enumerate(qf_data):
        set_cell(qf.rows[i].cells[0], k, bold=True, size=11, bg_hex="E2EFDA")
        set_cell(qf.rows[i].cells[1], v, size=11)
    divider(doc)

    page_break(doc)

    # ── SECTION 2: PROBLEM STATEMENT ──────────────────────────────────────────
    heading(doc, "2. Problem Statement", level=1)
    para(doc,
         "India has over 300 million registered vehicles. All these records are stored in a central "
         "government database managed by the Ministry of Road Transport. While this system works, "
         "it has serious problems that affect real people every day.",
         size=11.5)

    heading(doc, "Key Problems:", level=3)
    bullet(doc, [
        "Fake RC Papers: Criminals create fake Registration Certificates for stolen cars and sell "
        "them to innocent buyers who don't know the car is stolen.",
        "Record Tampering: Central databases can be hacked or modified by corrupt insiders. Loan "
        "records and ownership details can be secretly changed without any trace.",
        "Salvage Car Fraud: Cars that are completely wrecked in accidents are sometimes secretly "
        "rebuilt, given new papers, and sold to unsuspecting buyers.",
        "No Trusted Verification: Ordinary citizens buying a used car have no reliable way to check "
        "the true ownership history of a vehicle.",
        "Privacy Leaks: Existing blockchain proposals for vehicle systems exposed owner names and "
        "phone numbers directly on the public blockchain, which is a privacy violation.",
    ])

    page_break(doc)

    # ── SECTION 3: OBJECTIVES & COURSE OUTCOMES ──────────────────────────────
    heading(doc, "3. Objectives & Course Outcomes (CO)", level=1)

    heading(doc, "3.1 Project Objectives", level=2)
    para(doc, "This project was built to achieve five clear engineering goals:", size=11.5)
    bullet(doc, [
        "Store vehicle ownership as digital NFTs on the Ethereum blockchain so records cannot be "
        "secretly changed or deleted by anyone.",
        "Protect citizen privacy by using Keccak-256 cryptographic hashing to store vehicle "
        "identity data, keeping personal information off the public blockchain.",
        "Separate RTO powers clearly using Role-Based Access Control (RBAC) so no single person "
        "can both register and scrap a vehicle.",
        "Require official RTO approval for all vehicle ownership transfers — preventing bypassing "
        "of legal checks.",
        "Build a complete web application so citizens and RTO officers can interact with the "
        "blockchain system through a simple browser interface.",
    ])

    divider(doc)
    heading(doc, "3.2 Course Outcomes (CO) Integration (CSB24PCC452: Blockchain)", level=2)
    para(doc,
         "The mini-project directly maps to the official Course Outcomes defined in the MGM University "
         "curriculum for Course Code: CSB24PCC452 (Blockchain, Credits: 2, Evaluation: CA-60, ESE-40). "
         "The table below details how each Course Outcome is practically realized in this project:",
         size=11.5)

    co_tbl = doc.add_table(rows=5, cols=4)
    co_tbl.style = "Table Grid"
    co_headers = ["CO Code & Statement", "Bloom's Level", "Project Implementation & Modules", "Mapping Level"]
    for ci, h in enumerate(co_headers):
        set_cell(co_tbl.rows[0].cells[ci], h, bold=True, size=10.5, bg_hex="BDD7EE", align=WD_ALIGN_PARAGRAPH.CENTER)

    co_rows = [
        (
            "CO1: Understand the basic structure, history, and types of blockchain systems and decentralization methods.",
            "Understand (Level 2)\n[Unit 1]",
            "Replaced centralized client-server RTO databases (Vahan) with an Ethereum decentralized blockchain ledger, eliminating single points of failure and unauthorized internal data manipulation.",
            "Substantial (Level 3)"
        ),
        (
            "CO2: Analyze blockchain architecture, smart contracts, and cryptocurrencies in various real-world use cases.",
            "Analyze (Level 4)\n[Unit 2]",
            "Engineered VehicleRegistry.sol smart contract in Solidity 0.8.24 using OpenZeppelin ERC-721 for vehicle title NFTs, AccessControl for government role hierarchies, and Pausable for emergency safeguards.",
            "Substantial (Level 3)"
        ),
        (
            "CO3: Apply cryptographic principles and consensus algorithms in Bitcoin transactions and wallet mechanisms.",
            "Apply (Level 3)\n[Unit 3]",
            "Implemented Keccak-256 cryptographic hashing to store vehicle commitments on-chain while keeping citizen PII off-chain. Implemented Web3 wallet authentication via MetaMask challenge-nonce signing.",
            "Substantial (Level 3)"
        ),
        (
            "CO4: Evaluate and design distributed applications using modern blockchain platforms.",
            "Evaluate & Design (Level 5/6)\n[Unit 4]",
            "Designed and deployed an end-to-end DApp on Ethereum with React 18/Vite frontend, Ethers.js v6 integration, two-step title transfers, permanent scrappage locks, and 40 automated tests passing at 100%.",
            "Substantial (Level 3)"
        ),
    ]

    for ri, rdata in enumerate(co_rows):
        row = co_tbl.rows[ri + 1]
        set_cell(row.cells[0], rdata[0], bold=True, size=9.5, bg_hex="DEEAF1" if ri % 2 == 0 else None)
        set_cell(row.cells[1], rdata[1], size=9.5, align=WD_ALIGN_PARAGRAPH.CENTER)
        set_cell(row.cells[2], rdata[2], size=9.5)
        set_cell(row.cells[3], rdata[3], bold=True, size=9.5, align=WD_ALIGN_PARAGRAPH.CENTER, bg_hex="E2EFDA")

    divider(doc)

    # ── SECTION 4: SYSTEM DESIGN ──────────────────────────────────────────────
    heading(doc, "4. System Design", level=1)
    para(doc,
         "The system is divided into four layers. Each layer has a specific job and communicates "
         "only with the layer next to it.",
         size=11.5)

    heading(doc, "4.1 System Layers", level=2)
    layers = doc.add_table(rows=5, cols=2)
    layers.style = "Table Grid"
    layer_data = [
        ("Layer",                   "What it does"),
        ("User Layer",              "Citizens, buyers, and RTO officials access the system through dedicated web portals."),
        ("Frontend & Security",     "React 18 web app with route guards that check the user's role before granting access."),
        ("Privacy Conversion",      "Converts VIN/plate numbers to Keccak-256 hash codes before sending to blockchain. Personal data stays in private encrypted storage."),
        ("Smart Contract (Core)",   "VehicleRegistry.sol deployed on Ethereum. Handles vehicle registration, transfers, and scrappage. All records are permanent."),
    ]
    set_cell(layers.rows[0].cells[0], layer_data[0][0], bold=True, size=11, bg_hex="BDD7EE")
    set_cell(layers.rows[0].cells[1], layer_data[0][1], bold=True, size=11, bg_hex="BDD7EE")
    for i in range(1, 5):
        set_cell(layers.rows[i].cells[0], layer_data[i][0], bold=True, size=11, bg_hex="DEEAF1")
        set_cell(layers.rows[i].cells[1], layer_data[i][1], size=11)

    divider(doc)
    heading(doc, "4.2 Data: On-Chain vs Off-Chain", level=2)
    para(doc,
         "To balance transparency and privacy, data is split between the public blockchain and private storage:",
         size=11.5)
    data_tbl = doc.add_table(rows=5, cols=2)
    data_tbl.style = "Table Grid"
    data_rows = [
        ("Stored ON Blockchain (Public)",       "Stored OFF Blockchain (Private)"),
        ("Keccak-256 hash of VIN (chassis no.)",    "Full 17-character VIN number"),
        ("Keccak-256 hash of number plate",         "Owner name, email, address, phone"),
        ("Vehicle legal state: Active / Scrapped",  "Police FIR documents, case numbers"),
        ("Complete ownership transfer history",     "Vehicle inspection certificates"),
    ]
    set_cell(data_tbl.rows[0].cells[0], data_rows[0][0], bold=True, size=11, bg_hex="BDD7EE")
    set_cell(data_tbl.rows[0].cells[1], data_rows[0][1], bold=True, size=11, bg_hex="BDD7EE")
    for i in range(1, 5):
        set_cell(data_tbl.rows[i].cells[0], data_rows[i][0], size=11)
        set_cell(data_tbl.rows[i].cells[1], data_rows[i][1], size=11)

    divider(doc)
    heading(doc, "4.3 Role-Based Access Control", level=2)
    para(doc, "Three roles are enforced directly in the smart contract. No manual override is possible:", size=11.5)
    role_tbl = doc.add_table(rows=4, cols=2)
    role_tbl.style = "Table Grid"
    role_data = [
        ("Role",                    "What they can do"),
        ("Admin",                   "Grant or revoke roles. Cannot own vehicles. Cannot register or transfer."),
        ("RTO Registrar",           "Register new vehicles. Approve ownership transfers. Cannot scrap vehicles."),
        ("RTO Officer",             "Mark vehicles as Scrapped. Cannot register vehicles or approve transfers."),
    ]
    set_cell(role_tbl.rows[0].cells[0], role_data[0][0], bold=True, size=11, bg_hex="BDD7EE")
    set_cell(role_tbl.rows[0].cells[1], role_data[0][1], bold=True, size=11, bg_hex="BDD7EE")
    for i in range(1, 4):
        set_cell(role_tbl.rows[i].cells[0], role_data[i][0], bold=True, size=11, bg_hex="DEEAF1")
        set_cell(role_tbl.rows[i].cells[1], role_data[i][1], size=11)

    page_break(doc)

    # ── SECTION 5: TECHNICAL STACK ────────────────────────────────────────────
    heading(doc, "5. Technical Stack", level=1)
    tech_tbl = doc.add_table(rows=7, cols=2)
    tech_tbl.style = "Table Grid"
    tech_data = [
        ("Component",           "Technology Used"),
        ("Smart Contract",      "Solidity 0.8.24 with OpenZeppelin (ERC-721, AccessControl, Pausable)"),
        ("Blockchain Network",  "Ethereum (Hardhat local node, Chain ID 31337)"),
        ("Frontend",            "React 18 + Vite + Ethers.js v6"),
        ("Authentication",      "MetaMask wallet — cryptographic challenge-nonce signing"),
        ("Testing Framework",   "Hardhat + Chai — 40 automated test cases"),
        ("Privacy Layer",       "Keccak-256 hashing (on-chain) + Encrypted off-chain storage"),
    ]
    set_cell(tech_tbl.rows[0].cells[0], tech_data[0][0], bold=True, size=11, bg_hex="BDD7EE")
    set_cell(tech_tbl.rows[0].cells[1], tech_data[0][1], bold=True, size=11, bg_hex="BDD7EE")
    for i in range(1, 7):
        set_cell(tech_tbl.rows[i].cells[0], tech_data[i][0], bold=True, size=11, bg_hex="DEEAF1")
        set_cell(tech_tbl.rows[i].cells[1], tech_data[i][1], size=11)

    page_break(doc)

    # ── SECTION 6: KEY FEATURES ───────────────────────────────────────────────
    heading(doc, "6. Key Features", level=1)

    heading(doc, "6.1 NFT-Based Vehicle Titles", level=2)
    para(doc,
         "Each vehicle registered in the system is represented as an ERC-721 NFT (Non-Fungible Token) "
         "on the Ethereum blockchain. This means every vehicle title is unique, owned by one wallet "
         "address at a time, and its history is permanently recorded. Unlike a central database record, "
         "no administrator can delete or secretly change a blockchain NFT record.",
         size=11.5)

    heading(doc, "6.2 Privacy Through Cryptographic Hashing", level=2)
    para(doc,
         "A major privacy challenge with public blockchains is that anyone in the world can read the data. "
         "To solve this, the system converts sensitive data before storing it on-chain. The VIN (chassis "
         "number) and number plate are converted to a Keccak-256 hash — a 32-byte digital fingerprint — "
         "before being written to the blockchain. The actual numbers are stored only in a private, encrypted "
         "vault. A traffic officer can verify a car's authenticity by hashing the plate and checking for "
         "a match, but cannot reverse the hash to reveal owner identity.",
         size=11.5)

    heading(doc, "6.3 Two-Step Ownership Transfer", level=2)
    para(doc,
         "When a citizen wants to sell their vehicle, the transfer must go through two mandatory steps. "
         "First, the citizen initiates the transfer request in their portal (similar to submitting Form 29). "
         "Second, the RTO Registrar checks clearances (road tax, bank loan, no police cases) and officially "
         "approves the transfer (similar to Form 30). Only then is the blockchain title moved to the buyer. "
         "This prevents accidental or fraudulent transfers.",
         size=11.5)

    heading(doc, "6.4 Anti-Corruption Security Rule", level=2)
    para(doc,
         "A key security feature is an automated rule coded into the smart contract. Every time a vehicle "
         "title is about to be transferred, the contract automatically checks if the receiving address is "
         "an RTO or Admin role. If yes, the transfer is immediately rejected with the error "
         "PrivilegedAddressCannotOwnVehicle. This rule is enforced by the blockchain itself and cannot "
         "be turned off by anyone.",
         size=11.5)

    heading(doc, "6.5 Permanent Scrappage Lock", level=2)
    para(doc,
         "Once an RTO Officer marks a vehicle as 'Scrapped', the vehicle state on the blockchain is "
         "permanently set. There is no undo function. The scrapped vehicle can never be transferred, "
         "sold, or re-registered. This completely eliminates the salvage car fraud problem where wrecked "
         "cars are secretly rebuilt and sold with fake papers.",
         size=11.5)

    heading(doc, "6.6 Public Verification Without Privacy Leak", level=2)
    para(doc,
         "Any person — including the traffic police — can visit the public portal and search for a vehicle "
         "by plate number or VIN. The portal confirms: (a) whether the vehicle is genuinely registered, "
         "(b) its current legal status (Active or Scrapped), and (c) basic specs like make, model, and year. "
         "The search never reveals the owner's name, contact details, or past ownership trail.",
         size=11.5)

    page_break(doc)

    # ── SECTION 7: IMPLEMENTATION ─────────────────────────────────────────────
    heading(doc, "7. Implementation", level=1)

    heading(doc, "7.1 Smart Contract (VehicleRegistry.sol)", level=2)
    para(doc,
         "The core smart contract is 607 lines of Solidity code. It inherits from three OpenZeppelin "
         "contracts to get trusted, tested security features. ERC-721 provides NFT-based vehicle title "
         "management. AccessControl manages the three on-chain roles (Admin, Registrar, Officer). "
         "Pausable allows an admin to pause all operations in an emergency.",
         size=11.5)
    para(doc, "Main smart contract functions:", size=11.5, bold=True)
    bullet(doc, [
        "registerVehicle() — RTO Registrar registers a new vehicle and mints an NFT title.",
        "initiateTransfer() — Citizen requests a transfer to a buyer's wallet address.",
        "transferOwnershipByRTO() — RTO Registrar reviews and officially approves the transfer.",
        "updateVehicleState() — RTO Officer marks a vehicle as Scrapped (permanent, irreversible).",
        "_update() hook — Custom rule that blocks any RTO/Admin wallet from receiving vehicle titles.",
    ])

    heading(doc, "7.2 Web Application", level=2)
    para(doc,
         "The web application is built with React 18 and Vite and connects to the Ethereum blockchain "
         "using Ethers.js v6. Citizens and RTO officials log in by connecting their MetaMask wallet "
         "and signing a one-time security challenge. No passwords are stored anywhere.",
         size=11.5)
    para(doc, "Four web portals:", size=11.5, bold=True)
    bullet(doc, [
        "Public Search Portal — Anyone can check a vehicle's registration status without logging in.",
        "Citizen Dashboard — Vehicle owners see their NFT titles, HSRP number plates, and can initiate transfers.",
        "RTO Registrar Desk — Register new vehicles, review and approve or reject transfer requests.",
        "RTO Officer Desk — Search vehicles, review details, and mark wrecked vehicles as Scrapped.",
    ])

    heading(doc, "7.3 Authentication Flow", level=2)
    para(doc, "Step-by-step login process:", size=11.5)
    steps = [
        "User connects MetaMask wallet to the application.",
        "Application generates a unique one-time random nonce (challenge message).",
        "User clicks 'Sign' — MetaMask asks them to sign the nonce with their private key.",
        "Application verifies the signature and recovers the wallet address.",
        "Smart contract checks if the wallet has an RTO role or is a citizen.",
        "User is redirected to the correct portal (Citizen / RTO Registrar / RTO Officer).",
    ]
    for i, s in enumerate(steps, 1):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after  = Pt(3)
        p.paragraph_format.left_indent  = Inches(0.3)
        p.paragraph_format.line_spacing = Pt(17)
        r2 = p.add_run(f"Step {i}: {s}")
        r2.font.name = FONT
        r2.font.size = Pt(11.5)

    page_break(doc)

    # ── SECTION 8: TESTING & RESULTS ──────────────────────────────────────────
    heading(doc, "8. Testing & Results", level=1)
    para(doc,
         "The project was tested using an automated test suite written in Hardhat and Chai. "
         "All 40 test cases passed with a 100% success rate, completing in under 5 seconds.",
         size=11.5)

    test_tbl = doc.add_table(rows=8, cols=2)
    test_tbl.style = "Table Grid"
    test_data = [
        ("Test Category",                   "Result"),
        ("Role-Based Access Control",       "PASSED — Unauthorized users blocked from all admin functions"),
        ("Duplicate VIN / Plate Rejection", "PASSED — Same commitment hash rejected on-chain"),
        ("Two-Step Transfer Workflow",      "PASSED — Transfer only completes after RTO approval"),
        ("Anti-Corruption Lock",            "PASSED — RTO wallet blocked from receiving vehicle titles"),
        ("Scrappage Permanence",            "PASSED — Scrapped vehicles cannot be transferred or re-registered"),
        ("Emergency Pause Controls",        "PASSED — All operations blocked when contract is paused"),
        ("Total",                           "40 / 40 tests PASSED (100% success rate in 5 seconds)"),
    ]
    set_cell(test_tbl.rows[0].cells[0], test_data[0][0], bold=True, size=11, bg_hex="BDD7EE")
    set_cell(test_tbl.rows[0].cells[1], test_data[0][1], bold=True, size=11, bg_hex="BDD7EE")
    for i in range(1, 7):
        set_cell(test_tbl.rows[i].cells[0], test_data[i][0], size=11)
        set_cell(test_tbl.rows[i].cells[1], test_data[i][1], size=11)
    set_cell(test_tbl.rows[7].cells[0], test_data[7][0], bold=True, size=11, bg_hex="E2EFDA")
    set_cell(test_tbl.rows[7].cells[1], test_data[7][1], bold=True, size=11, bg_hex="E2EFDA")

    divider(doc)
    heading(doc, "Security Scenarios Blocked:", level=3)
    bullet(doc, [
        "Unauthorized citizens cannot register new vehicles.",
        "Duplicate VIN or plate number registrations are auto-rejected.",
        "Transfers directly from citizen to citizen (bypassing RTO) are blocked.",
        "Scrapped vehicles cannot be transferred, sold, or re-registered.",
        "RTO wallet addresses cannot hold vehicle titles.",
        "Non-RTO users cannot update vehicle legal status.",
    ])

    page_break(doc)

    # ── SECTION 9: APPLICATIONS ───────────────────────────────────────────────
    heading(doc, "9. Applications", level=1)
    para(doc,
         "This system is directly applicable to several real-world areas:", size=11.5)
    bullet(doc, [
        "State RTO Modernization — Transport departments can use it to eliminate fake RC books, "
        "stolen car re-registration, and illegal duplicate plates across states.",
        "Used-Car Marketplaces (Cars24, Spinny, OLX Autos) — Buyers can instantly verify the true "
        "ownership history and legal standing of a second-hand car before purchase.",
        "Insurance Companies — When a car is declared a total loss in an accident, the insurer "
        "can permanently mark it as scrapped so the vehicle cannot be rebuilt and resold.",
        "Bank Auto Loans — Banks can place digital hypothecation liens on vehicle titles and "
        "release them automatically when the loan is fully repaid.",
        "Traffic Police Verification — Officers can verify a vehicle's authenticity and legal "
        "status at checkpoints using the public portal without needing access to RTO systems.",
    ])

    page_break(doc)

    # ── SECTION 10: FUTURE SCOPE ──────────────────────────────────────────────
    heading(doc, "10. Future Scope", level=1)
    para(doc,
         "The system can be expanded with these future improvements:", size=11.5)
    bullet(doc, [
        "Zero-Knowledge Proofs (zk-SNARKs) — Citizens can prove their vehicle is legally registered "
        "to traffic police without revealing their wallet address or identity.",
        "IPFS Decentralized Storage — Vehicle inspection photos, fitness certificates, and pollution "
        "documents stored on IPFS instead of a central server.",
        "IoT & FASTag Integration — Connect vehicle OBD-II chips and FASTag scanners to automatically "
        "record tamper-proof odometer readings on the blockchain, eliminating odometer fraud.",
        "Layer-2 Network Deployment — Deploy on Polygon or Arbitrum to reduce transaction costs to "
        "fractions of a rupee for nationwide use.",
        "Government API Integration — Connect with Vahan, DigiLocker, and Parivahan for seamless "
        "data migration and cross-state vehicle tracking.",
    ])

    page_break(doc)

    # ── SECTION 11: CONCLUSION ────────────────────────────────────────────────
    heading(doc, "11. Conclusion", level=1)
    para(doc,
         "This case study shows how blockchain technology can solve a real, everyday problem in vehicle "
         "registration and used-car buying in India. The Decentralized Vehicle Registration System "
         "replaces a vulnerable central database with tamper-proof smart contracts. Vehicle owners get "
         "an NFT-based digital title that no one can secretly change. Citizens' personal data is protected "
         "through cryptographic hashing. Salvage car fraud is permanently stopped through an irreversible "
         "scrappage lock. The strict RBAC system ensures no single official has unchecked power.",
         size=11.5)
    para(doc,
         "The project was built and tested entirely by two students in one semester, demonstrating that "
         "modern blockchain tools (Solidity, Hardhat, Ethers.js) make it practical for students to build "
         "real-world decentralized applications with production-grade security. All 40 automated tests "
         "passing at 100% proves that code-enforced rules provide genuine security and trust.",
         size=11.5)
    para(doc,
         "This project is a working proof that decentralized systems can make government services more "
         "transparent, fraud-resistant, and trustworthy for every Indian citizen.",
         size=11.5)

    divider(doc)

    # ── REFERENCES ────────────────────────────────────────────────────────────
    heading(doc, "References", level=2)
    refs = [
        "OpenZeppelin Contracts Documentation — ERC-721, AccessControl, Pausable. https://docs.openzeppelin.com/contracts",
        "Ethereum Foundation — Solidity 0.8.24 Documentation. https://docs.soliditylang.org",
        "Hardhat Development Environment — https://hardhat.org/docs",
        "Ministry of Road Transport (VAHAN) — National Vehicle Database. https://vahan.parivahan.gov.in",
        "Ethers.js v6 Library Documentation — https://docs.ethers.org/v6",
        "NITI Aayog — Blockchain for Transport and Logistics in India, 2019.",
    ]
    for i, ref in enumerate(refs, 1):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after  = Pt(4)
        p.paragraph_format.left_indent  = Inches(0.3)
        r3 = p.add_run(f"[{i}] {ref}")
        r3.font.name = FONT
        r3.font.size = Pt(11)

    # ── SAVE ──────────────────────────────────────────────────────────────────
    target_project = OUTPUT_PROJECT
    try:
        doc.save(target_project)
    except PermissionError:
        target_project = r"d:\BC project\Blockchain_VRS_Case_Study_Updated.docx"
        doc.save(target_project)
        print(f"Original file was open in Word; saved to: {target_project}")

    size_kb = os.path.getsize(target_project) // 1024
    print(f"Saved: {target_project} ({size_kb} KB)")

    for out_dir, name in [
        (os.path.join(HOME, "Desktop"), "Desktop"),
        (os.path.join(HOME, "Downloads"), "Downloads"),
        (r"C:\Users\Krushna\.gemini\antigravity\brain\05af4329-1e0d-4b3d-af5b-060ca7138a6d", "Artifacts")
    ]:
        for base_name in ["Blockchain_VRS_Case_Study.docx", "Blockchain_VRS_Case_Study_Updated.docx"]:
            dest = os.path.join(out_dir, base_name)
            try:
                shutil.copy2(target_project, dest)
                print(f"Copied to {name}: {dest}")
                break
            except PermissionError:
                continue
            except Exception as e:
                print(f"{name} copy failed: {e}")

if __name__ == "__main__":
    build()
