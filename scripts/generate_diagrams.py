import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, ArrowStyle

OUT_DIR = r"d:\BC project\docs\diagrams"
os.makedirs(OUT_DIR, exist_ok=True)

# Color Scheme
NAVY = "#1F497D"
SLATE = "#2E6B9E"
ICE_BLUE = "#F0F6FC"
WHITE = "#FFFFFF"
DARK_GRAY = "#1E293B"
LIGHT_GRAY = "#E2E8F0"
BORDER_GRAY = "#94A3B8"
EMERALD = "#16A34A"
CRIMSON = "#DC2626"
AMBER = "#D97706"
PURPLE = "#7C3AED"

def draw_box(ax, x, y, w, h, bg_color, border_color, border_width=1.5, boxstyle="round,pad=0.2,rounding_size=0.1"):
    """Draws a clean styled box."""
    bbox = FancyBboxPatch(
        (x, y), w, h,
        boxstyle=boxstyle,
        facecolor=bg_color,
        edgecolor=border_color,
        linewidth=border_width,
        zorder=2
    )
    ax.add_patch(bbox)
    return bbox

def draw_arrow(ax, x1, y1, x2, y2, color=SLATE, lw=2.0, style="-|>", rad=0.0):
    """Draws a clean directed arrow between two points."""
    arrow = patches.FancyArrowPatch(
        (x1, y1), (x2, y2),
        arrowstyle=f"{style},head_length=6,head_width=4",
        connectionstyle=f"arc3,rad={rad}",
        color=color,
        linewidth=lw,
        zorder=3
    )
    ax.add_patch(arrow)
    return arrow

# =============================================================================
# DIAGRAM 1: 4-LAYER SYSTEM ARCHITECTURE
# =============================================================================
def generate_diagram_1():
    fig, ax = plt.subplots(figsize=(12, 9), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")

    # Overall Title
    ax.text(50, 96.5, "Decentralized Vehicle Registration & Title Management Architecture",
            ha="center", va="center", fontsize=15, fontweight="bold", color=NAVY)
    ax.text(50, 94, "A 4-Tier Privacy-Preserving and Role-Segregated Blockchain System",
            ha="center", va="center", fontsize=10.5, fontstyle="italic", color=DARK_GRAY)

    # Layer 1: User Personas
    draw_box(ax, 2, 79, 96, 12, "#F8FAFC", BORDER_GRAY, 1.0)
    ax.text(4, 88.5, "TIER 1: USER ACTORS & INTERACTION ROLES", fontsize=9.5, fontweight="bold", color=SLATE)

    users = [
        ("Public Visitor / Buyer", "Verifies vehicle status,\nhash matching & history", 6, "#FFFFFF", NAVY),
        ("Citizen Vehicle Owner", "Holds ERC-721 title deed,\ninitiates transfer requests", 29, "#FFFFFF", NAVY),
        ("RTO Registrar (Desk)", "Mints initial title NFTs,\napproves statutory transfers", 52, "#FFFFFF", NAVY),
        ("RTO Enforcement Officer", "Field fitness inspection,\npermanent scrappage audit", 75, "#FFFFFF", NAVY)
    ]
    for title, desc, x_pos, bg, col in users:
        draw_box(ax, x_pos, 80.5, 19, 8.5, bg, col, 1.2)
        ax.text(x_pos + 9.5, 86.2, title, ha="center", va="center", fontsize=9, fontweight="bold", color=col)
        ax.text(x_pos + 9.5, 83.0, desc, ha="center", va="center", fontsize=7.5, color=DARK_GRAY)

    # Layer 2: Web3 Frontend & Security Guards
    draw_box(ax, 2, 57, 96, 17, "#F0FDF4", "#86EFAC", 1.0)
    ax.text(4, 71.5, "TIER 2: WEB3 CLIENT & ROUTE SECURITY (React 18 + Vite + Ethers.js v6)", fontsize=9.5, fontweight="bold", color=EMERALD)

    apps = [
        ("Public Portal", "Real-time VIN / Plate\nVerification Search", 6, "#FFFFFF", EMERALD),
        ("Citizen Dashboard", "Realistic HSRP Plate view,\nOwnership history audit", 29, "#FFFFFF", EMERALD),
        ("Registrar Desk", "New Title Registration &\nPending Transfer Approvals", 52, "#FFFFFF", EMERALD),
        ("Scrappage Desk", "Terminal Decommissioning\nAudit & Enforcement", 75, "#FFFFFF", EMERALD)
    ]
    for title, desc, x_pos, bg, col in apps:
        draw_box(ax, x_pos, 62, 19, 7.8, bg, col, 1.2)
        ax.text(x_pos + 9.5, 66.8, title, ha="center", va="center", fontsize=9, fontweight="bold", color=col)
        ax.text(x_pos + 9.5, 64.0, desc, ha="center", va="center", fontsize=7.5, color=DARK_GRAY)

    # Guard Box
    draw_box(ax, 6, 58.2, 88, 2.8, "#DCFCE7", EMERALD, 1.0)
    ax.text(50, 59.6, "Session Security: Instant Invalidation on MetaMask Account Switch  |  CitizenGuard & RtoGuard Route Protection",
            ha="center", va="center", fontsize=8, fontweight="bold", color=DARK_GRAY)

    # Layer 3: Cryptographic Commitment Engine
    draw_box(ax, 2, 38, 96, 14, "#FEF3C7", "#FCD34D", 1.0)
    ax.text(4, 49.5, "TIER 3: CRYPTOGRAPHIC PRIVACY PLANE (Keccak-256 Commitments)", fontsize=9.5, fontweight="bold", color=AMBER)

    draw_box(ax, 6, 40, 41, 7.8, "#FFFFFF", AMBER, 1.2)
    ax.text(26.5, 45.2, "On-Chain Cryptographic Fingerprints", ha="center", va="center", fontsize=8.5, fontweight="bold", color=AMBER)
    ax.text(26.5, 42.2, "Keccak-256(VIN)  |  Keccak-256(Plate)  |  Metadata Hash\nZero Plaintext PII committed to blockchain state",
            ha="center", va="center", fontsize=7.5, color=DARK_GRAY)

    draw_box(ax, 53, 40, 41, 7.8, "#FFFFFF", AMBER, 1.2)
    ax.text(73.5, 45.2, "Off-Chain Encrypted Confidential Vault", ha="center", va="center", fontsize=8.5, fontweight="bold", color=AMBER)
    ax.text(73.5, 42.2, "Encrypted Citizen Name, Residential Address, Phone, Specs\nProtected against public surveillance & identity leaks",
            ha="center", va="center", fontsize=7.5, color=DARK_GRAY)

    # Layer 4: Smart Contract EVM Plane
    draw_box(ax, 2, 4, 96, 29, "#EFF6FF", "#93C5FD", 1.0)
    ax.text(4, 30.5, "TIER 4: BLOCKCHAIN SMART CONTRACT PLANE (VehicleRegistry.sol - EVM)", fontsize=9.5, fontweight="bold", color=NAVY)

    sc_components = [
        ("ERC-721 Digital Title (VTITLE)", "Non-fungible sovereign ownership token minted to citizen wallet", 6, 21, 41, 7.5, NAVY),
        ("Role-Based Access Control (RBAC)", "DEFAULT_ADMIN | RTO_REGISTRAR | RTO_OFFICER (Least Privilege)", 53, 21, 41, 7.5, NAVY),
        ("Anti-Corruption Invariant Hook", "PrivilegedAddressCannotOwnVehicle blocks RTO from owning vehicles", 6, 12, 41, 7.5, CRIMSON),
        ("Statutory Transfer: transferOwnershipByRTO()", "Enforces official RTO review before title re-assignment", 53, 12, 41, 7.5, NAVY),
        ("Permanent Scrappage State Engine", "Active (0) -> Scrapped (1) irreversible lock against salvage fraud", 6, 5.5, 41, 5.2, CRIMSON),
        ("Immutable Provenance History", "Array of OwnershipRecord(owner, timestamp) tracing complete chain", 53, 5.5, 41, 5.2, NAVY)
    ]
    for title, desc, x_pos, y_pos, w, h, col in sc_components:
        draw_box(ax, x_pos, y_pos, w, h, "#FFFFFF", col, 1.1)
        ax.text(x_pos + w/2, y_pos + h*0.68, title, ha="center", va="center", fontsize=8.5, fontweight="bold", color=col)
        ax.text(x_pos + w/2, y_pos + h*0.30, desc, ha="center", va="center", fontsize=7.2, color=DARK_GRAY)

    # Inter-layer connecting arrows
    draw_arrow(ax, 15.5, 79, 15.5, 71.5)
    draw_arrow(ax, 38.5, 79, 38.5, 71.5)
    draw_arrow(ax, 61.5, 79, 61.5, 71.5)
    draw_arrow(ax, 84.5, 79, 84.5, 71.5)

    draw_arrow(ax, 50, 57, 50, 52.5)
    draw_arrow(ax, 50, 38, 50, 33.5)

    plt.tight_layout()
    out_file = os.path.join(OUT_DIR, "diagram_1_system_architecture.png")
    fig.savefig(out_file, dpi=300, bbox_inches="tight")
    plt.close(fig)
    print(f"Generated: {out_file}")

# =============================================================================
# DIAGRAM 2: ROLE-BASED ACCESS CONTROL & STRICT BOUNDARIES
# =============================================================================
def generate_diagram_2():
    fig, ax = plt.subplots(figsize=(11, 7.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")

    ax.text(50, 96, "Role-Based Access Control & Authority Boundaries",
            ha="center", va="center", fontsize=15, fontweight="bold", color=NAVY)
    ax.text(50, 92.5, "Principle of Least Privilege and Zero Conflict-of-Interest Architecture",
            ha="center", va="center", fontsize=10, fontstyle="italic", color=DARK_GRAY)

    roles = [
        {
            "role": "DEFAULT_ADMIN_ROLE\n(Institution Head)",
            "header_bg": "#1E293B",
            "x": 3, "w": 21.5,
            "allowed": [
                "• Grant & revoke RTO roles",
                "• Emergency pause / unpause",
                "• Manage authority keys"
            ],
            "blocked": [
                "x Cannot register vehicles",
                "x Cannot scrap vehicles",
                "x Cannot own vehicle titles"
            ]
        },
        {
            "role": "RTO_REGISTRAR_ROLE\n(Administrative Desk)",
            "header_bg": "#1F497D",
            "x": 27.5, "w": 21.5,
            "allowed": [
                "• registerVehicle() [Mint Title]",
                "• transferOwnershipByRTO()",
                "• Verify Form 29/30 filings"
            ],
            "blocked": [
                "x Cannot scrap vehicles",
                "x Cannot grant roles",
                "x Cannot own vehicle titles"
            ]
        },
        {
            "role": "RTO_OFFICER_ROLE\n(Enforcement Inspector)",
            "header_bg": "#0D9488",
            "x": 52, "w": 21.5,
            "allowed": [
                "• updateVehicleState(Scrapped)",
                "• Conduct fitness inspections",
                "• Audit totaled / aged cars"
            ],
            "blocked": [
                "x Cannot register vehicles",
                "x Cannot transfer titles",
                "x Cannot own vehicle titles"
            ]
        },
        {
            "role": "PUBLIC CITIZEN\n(Vehicle Owner)",
            "header_bg": "#475569",
            "x": 76.5, "w": 21.5,
            "allowed": [
                "• Hold ERC-721 Title NFT",
                "• initiateTransfer() to buyer",
                "• View ownership history"
            ],
            "blocked": [
                "x Cannot register new cars",
                "x Cannot execute transfer",
                "x Cannot scrap vehicles"
            ]
        }
    ]

    for r in roles:
        x, w = r["x"], r["w"]
        # Header Box
        draw_box(ax, x, 73, w, 15, r["header_bg"], r["header_bg"], 1.0)
        ax.text(x + w/2, 80.5, r["role"], ha="center", va="center", fontsize=8.8, fontweight="bold", color=WHITE)

        # Body Box
        draw_box(ax, x, 25, w, 46, "#FFFFFF", BORDER_GRAY, 1.2)

        # Allowed subheader
        draw_box(ax, x + 1, 62, w - 2, 7, "#DCFCE7", "#86EFAC", 1.0)
        ax.text(x + w/2, 65.5, "PERMITTED POWERS", ha="center", va="center", fontsize=8, fontweight="bold", color=EMERALD)

        y_txt = 57
        for line in r["allowed"]:
            ax.text(x + 2, y_txt, line, fontsize=7.5, color=DARK_GRAY)
            y_txt -= 5.0

        # Blocked subheader
        draw_box(ax, x + 1, 41, w - 2, 7, "#FEE2E2", "#FCA5A5", 1.0)
        ax.text(x + w/2, 44.5, "PROHIBITED / BLOCKED", ha="center", va="center", fontsize=8, fontweight="bold", color=CRIMSON)

        y_txt = 36
        for line in r["blocked"]:
            ax.text(x + 2, y_txt, line, fontsize=7.5, color=CRIMSON)
            y_txt -= 5.0

    # Cross-Cutting Barrier Box
    draw_box(ax, 3, 4, 95, 17, "#FEF2F2", CRIMSON, 1.8)
    ax.text(50, 16.5, "CORE SECURITY INVARIANT: STRICT IDENTITY SEPARATION (ZERO CONFLICT OF INTEREST)",
            ha="center", va="center", fontsize=10, fontweight="bold", color=CRIMSON)
    
    inv_text = (
        "1. PrivilegedAddressCannotOwnVehicle: An address holding Admin or RTO roles is blocked on-chain from owning or receiving titles.\n"
        "2. VehicleOwnerCannotReceivePrivilegedRole: A citizen holding a vehicle title cannot be granted an administrative RTO role.\n"
        "3. Universal _update Hook Override: Direct ERC-721 transfers (safeTransferFrom / transferFrom) immediately revert if recipient is privileged."
    )
    ax.text(50, 9.5, inv_text, ha="center", va="center", fontsize=8.2, color=DARK_GRAY)

    plt.tight_layout()
    out_file = os.path.join(OUT_DIR, "diagram_2_role_boundaries.png")
    fig.savefig(out_file, dpi=300, bbox_inches="tight")
    plt.close(fig)
    print(f"Generated: {out_file}")

# =============================================================================
# DIAGRAM 3: TWO-STEP STATUTORY TRANSFER WORKFLOW (FORM 29 / 30)
# =============================================================================
def generate_diagram_3():
    fig, ax = plt.subplots(figsize=(11, 7.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")

    ax.text(50, 96, "Statutory Two-Step Vehicle Ownership Transfer Workflow",
            ha="center", va="center", fontsize=15, fontweight="bold", color=NAVY)
    ax.text(50, 92.5, "Aligning Blockchain Title Reassignment with Motor Vehicles Act (Form 29 / 30)",
            ha="center", va="center", fontsize=10, fontstyle="italic", color=DARK_GRAY)

    # Actor Swimlanes
    draw_box(ax, 2, 70, 96, 17, "#EFF6FF", NAVY, 1.0)
    ax.text(4, 83.5, "STEP 1: CITIZEN SELLER INITIATION (Form 29 Notice of Transfer)", fontsize=9.5, fontweight="bold", color=NAVY)

    draw_box(ax, 6, 72, 40, 8.5, "#FFFFFF", NAVY, 1.2)
    ax.text(26, 77.2, "Citizen Seller Action", ha="center", va="center", fontsize=8.5, fontweight="bold", color=NAVY)
    ax.text(26, 74.2, "Calls initiateTransfer(vehicleId, buyerWallet)\nSpecifies authorized prospective buyer address",
            ha="center", va="center", fontsize=7.5, color=DARK_GRAY)

    draw_box(ax, 54, 72, 40, 8.5, "#FFFFFF", SLATE, 1.2)
    ax.text(74, 77.2, "On-Chain Pending Queue", ha="center", va="center", fontsize=8.5, fontweight="bold", color=SLATE)
    ax.text(74, 74.2, "_pendingTransfers[vehicleId] = buyerWallet\nNOTE: Title NFT remains with seller during escrow",
            ha="center", va="center", fontsize=7.5, color=DARK_GRAY)

    draw_arrow(ax, 46.5, 76.2, 53.5, 76.2)

    # Step 2: Verification
    draw_box(ax, 2, 44, 96, 21, "#FEF3C7", AMBER, 1.0)
    ax.text(4, 61.5, "STEP 2: RTO REGISTRAR STATUTORY AUDIT & VERIFICATION (Form 30 Application)", fontsize=9.5, fontweight="bold", color=AMBER)

    draw_box(ax, 6, 46.5, 27, 12, "#FFFFFF", AMBER, 1.2)
    ax.text(19.5, 55.5, "Physical & Statutory Checks", ha="center", va="center", fontsize=8.5, fontweight="bold", color=AMBER)
    ax.text(19.5, 50.5, "• Buyer KYC & Aadhaar proof\n• Road tax clearance receipt\n• Bank loan NOC / Hypothecation\n• Valid PUC & Insurance cert",
            ha="center", va="center", fontsize=7.2, color=DARK_GRAY)

    draw_box(ax, 38, 46.5, 27, 12, "#FFFFFF", AMBER, 1.2)
    ax.text(51.5, 55.5, "RTO Registrar Invocation", ha="center", va="center", fontsize=8.5, fontweight="bold", color=AMBER)
    ax.text(51.5, 50.5, "Calls transferOwnershipByRTO(\n  vehicleId,\n  buyerWallet,\n  statutoryReasonHash\n)",
            ha="center", va="center", fontsize=7.2, color=DARK_GRAY)

    draw_box(ax, 70, 46.5, 25, 12, "#FEE2E2", CRIMSON, 1.2)
    ax.text(82.5, 55.5, "EVM Invariant Checks", ha="center", va="center", fontsize=8.5, fontweight="bold", color=CRIMSON)
    ax.text(82.5, 50.5, "• Vehicle is Active (!Scrapped)\n• Buyer != Privileged RTO\n• Caller has REGISTRAR_ROLE\nReverts if any check fails",
            ha="center", va="center", fontsize=7.2, color=CRIMSON)

    draw_arrow(ax, 74, 71.5, 74, 66.5, rad=0.0)
    draw_arrow(ax, 33.5, 52.5, 37.5, 52.5)
    draw_arrow(ax, 65.5, 52.5, 69.5, 52.5)

    # Step 3: Execution & Output
    draw_box(ax, 2, 7, 96, 32, "#F0FDF4", EMERALD, 1.0)
    ax.text(4, 35.5, "STEP 3: ON-CHAIN TITLE TRANSFER & PROVENANCE RECORDING", fontsize=9.5, fontweight="bold", color=EMERALD)

    outputs = [
        ("ERC-721 Title NFT Reassignment", "ERC-721 token transferred from Seller to Buyer wallet.\nBuyer is officially recognized as the legal title holder.", 6, 20, 41, 12, EMERALD),
        ("Immutable Ownership History Appended", "_ownershipHistory[vehicleId].push(\n  OwnershipRecord(buyerWallet, block.timestamp)\n)\nPermanent, tamper-proof chain of custody.", 53, 20, 41, 12, EMERALD),
        ("Clear Pending Escrow State", "_pendingTransfers[vehicleId] reset to address(0).\nPrevents double-spend and unauthorized re-approval.", 6, 9.5, 41, 8.5, SLATE),
        ("Emit TransferRecorded Event", "Event emitted with anonymized vehicleId and addresses\nindexed for public verification without exposing PII.", 53, 9.5, 41, 8.5, SLATE)
    ]
    for title, desc, x_pos, y_pos, w, h, col in outputs:
        draw_box(ax, x_pos, y_pos, w, h, "#FFFFFF", col, 1.1)
        ax.text(x_pos + w/2, y_pos + h*0.72, title, ha="center", va="center", fontsize=8.5, fontweight="bold", color=col)
        ax.text(x_pos + w/2, y_pos + h*0.35, desc, ha="center", va="center", fontsize=7.2, color=DARK_GRAY)

    draw_arrow(ax, 82.5, 46.5, 82.5, 40)

    plt.tight_layout()
    out_file = os.path.join(OUT_DIR, "diagram_3_transfer_workflow.png")
    fig.savefig(out_file, dpi=300, bbox_inches="tight")
    plt.close(fig)
    print(f"Generated: {out_file}")

# =============================================================================
# DIAGRAM 4: STATE MACHINE & SCRAPPAGE LIFECYCLE
# =============================================================================
def generate_diagram_4():
    fig, ax = plt.subplots(figsize=(11, 7.2), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")

    ax.text(50, 96, "Vehicle Lifecycle & Terminal Scrappage State Machine",
            ha="center", va="center", fontsize=15, fontweight="bold", color=NAVY)
    ax.text(50, 92.5, "Irreversible State Transition Guarding Against Salvage Title Laundering",
            ha="center", va="center", fontsize=10, fontstyle="italic", color=DARK_GRAY)

    # State 0: ACTIVE
    draw_box(ax, 6, 45, 38, 38, "#ECFDF5", EMERALD, 1.8)
    ax.text(25, 78, "STATE 0: ACTIVE", ha="center", va="center", fontsize=13, fontweight="bold", color=EMERALD)
    ax.text(25, 74, "(Normal Roadworthy Operation)", ha="center", va="center", fontsize=8.5, fontstyle="italic", color=DARK_GRAY)

    active_items = [
        "• Newly minted by RTO Registrar",
        "• Legal roadworthiness certified",
        "• ERC-721 Title transferable via RTO",
        "• Can initiate transfer to buyer",
        "• Viewable on public registry",
        "• Hypothecation liens applicable"
    ]
    y_pos = 68
    for item in active_items:
        ax.text(9, y_pos, item, fontsize=8, color=DARK_GRAY)
        y_pos -= 4.5

    # State 1: SCRAPPED
    draw_box(ax, 56, 45, 38, 38, "#FEF2F2", CRIMSON, 1.8)
    ax.text(75, 78, "STATE 1: SCRAPPED", ha="center", va="center", fontsize=13, fontweight="bold", color=CRIMSON)
    ax.text(75, 74, "(Permanent Terminal State)", ha="center", va="center", fontsize=8.5, fontstyle="italic", color=CRIMSON)

    scrapped_items = [
        "• Triggered by RTO Enforcement Officer",
        "• Mandatory for 15+ yr / totaled cars",
        "• All pending transfers cancelled",
        "• ERC-721 token permanently locked",
        "• Re-registration strictly blocked",
        "• Transfer attempts revert on-chain"
    ]
    y_pos = 68
    for item in scrapped_items:
        ax.text(59, y_pos, item, fontsize=8, color=DARK_GRAY)
        y_pos -= 4.5

    # Transition Arrow
    draw_arrow(ax, 44.5, 64, 55.5, 64, color=CRIMSON, lw=2.5)
    draw_box(ax, 42.5, 68, 15, 7.5, "#FFFFFF", CRIMSON, 1.0)
    ax.text(50, 73, "updateVehicleState()", ha="center", va="center", fontsize=7.5, fontweight="bold", color=CRIMSON)
    ax.text(50, 70, "By RTO Officer Only", ha="center", va="center", fontsize=6.8, fontstyle="italic", color=DARK_GRAY)

    # Rejection Loop (Scrapped cannot return to Active)
    draw_arrow(ax, 75, 45, 75, 34, color=CRIMSON, lw=2.0)
    draw_box(ax, 56, 17, 38, 16, "#FFF1F2", CRIMSON, 1.2)
    ax.text(75, 29.5, "ATTEMPTED RE-REGISTRATION / TRANSFER", ha="center", va="center", fontsize=8.5, fontweight="bold", color=CRIMSON)
    ax.text(75, 23.5, "Reverts immediately with custom error:\nVehicleIsScrapped(vehicleId)\nMathematical guarantee that totaled / salvage\nvehicles can never return to road use.",
            ha="center", va="center", fontsize=7.5, color=DARK_GRAY)

    # Active Loop (Multiple Transfers in Active State)
    draw_arrow(ax, 25, 45, 25, 34, color=EMERALD, lw=2.0)
    draw_box(ax, 6, 17, 38, 16, "#F0FDF4", EMERALD, 1.2)
    ax.text(25, 29.5, "STATUTORY OWNERSHIP TRANSFER CYCLE", ha="center", va="center", fontsize=8.5, fontweight="bold", color=EMERALD)
    ax.text(25, 23.5, "transferOwnershipByRTO()\nVehicle remains in Active state (State 0).\nOwnership history array is sequentially appended\nfor every legal change of hands.",
            ha="center", va="center", fontsize=7.5, color=DARK_GRAY)

    # Small connector
    draw_arrow(ax, 25, 17, 25, 12, rad=0.0)
    ax.text(25, 8.5, "Owner 1  ──>  Owner 2  ──>  Owner 3 ...", ha="center", va="center", fontsize=8.5, fontweight="bold", color=SLATE)

    plt.tight_layout()
    out_file = os.path.join(OUT_DIR, "diagram_4_state_lifecycle.png")
    fig.savefig(out_file, dpi=300, bbox_inches="tight")
    plt.close(fig)
    print(f"Generated: {out_file}")

# =============================================================================
# DIAGRAM 5: CRYPTOGRAPHIC COMMITMENTS & PRIVACY ARCHITECTURE
# =============================================================================
def generate_diagram_5():
    fig, ax = plt.subplots(figsize=(11, 7.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")

    ax.text(50, 96, "Cryptographic Commitment Scheme for Citizen Privacy",
            ha="center", va="center", fontsize=15, fontweight="bold", color=NAVY)
    ax.text(50, 92.5, "Separating Public Verifiable Proofs from Private Personally Identifiable Information (PII)",
            ha="center", va="center", fontsize=10, fontstyle="italic", color=DARK_GRAY)

    # Input Box: Raw Vehicular & Citizen Data
    draw_box(ax, 3, 56, 27, 30, "#FFFFFF", SLATE, 1.5)
    ax.text(16.5, 82, "RAW REAL-WORLD INPUTS", ha="center", va="center", fontsize=9, fontweight="bold", color=SLATE)

    inputs = [
        ("Chassis Number (VIN)", "e.g., 'MA3ERLF3S00123456'"),
        ("Registration Plate", "e.g., 'MH20DE1234'"),
        ("Vehicle Specifications", "Make, Model, Year, Fuel"),
        ("Citizen Identity (PII)", "Owner Name, Aadhaar, Phone")
    ]
    y_in = 76
    for title, val in inputs:
        ax.text(5, y_in, title, fontsize=7.8, fontweight="bold", color=DARK_GRAY)
        ax.text(5, y_in - 2.8, val, fontsize=7.2, color=MUTED_GRAY if 'MUTED_GRAY' in globals() else "#64748B")
        y_in -= 6.2

    # Hashing & Normalization Engine (Center)
    draw_box(ax, 36, 56, 26, 30, "#FEF3C7", AMBER, 1.5)
    ax.text(49, 82, "CRYPTOGRAPHIC ENGINE", ha="center", va="center", fontsize=9, fontweight="bold", color=AMBER)
    ax.text(49, 78, "(Keccak-256 Commitments)", ha="center", va="center", fontsize=7.5, fontstyle="italic", color=DARK_GRAY)

    hash_funcs = [
        "Normalize(VIN)\n  ──> Keccak256(VIN)",
        "Normalize(Plate)\n  ──> Keccak256(Plate)",
        "CanonicalJSON(Specs)\n  ──> Keccak256(Metadata)",
        "AES-256-GCM Encryption\n  ──> Encrypt(Citizen PII)"
    ]
    y_h = 71
    for hf in hash_funcs:
        ax.text(38, y_h, hf, fontsize=7.2, color=DARK_GRAY)
        y_h -= 6.5

    draw_arrow(ax, 30.5, 71, 35.5, 71)

    # Destination 1: Public Ethereum Blockchain (Hashes Only)
    draw_box(ax, 68, 56, 29, 30, "#EFF6FF", NAVY, 1.5)
    ax.text(82.5, 82, "PUBLIC ETHEREUM LEDGER", ha="center", va="center", fontsize=9, fontweight="bold", color=NAVY)
    ax.text(82.5, 78, "(VehicleRegistry.sol)", ha="center", va="center", fontsize=7.5, fontstyle="italic", color=SLATE)

    bc_items = [
        "• vinCommitment (bytes32)",
        "• registrationCommitment (bytes32)",
        "• metadataHash (bytes32)",
        "• ERC-721 Title Token (VTITLE)",
        "• Chronological OwnershipRecord[]",
        "• ZERO Plaintext PII on-chain"
    ]
    y_bc = 72
    for item in bc_items:
        ax.text(70, y_bc, item, fontsize=7.2, color=DARK_GRAY)
        y_bc -= 4.2

    draw_arrow(ax, 62.5, 76, 67.5, 76)

    # Destination 2: Off-Chain Encrypted Vault
    draw_box(ax, 68, 17, 29, 31, "#F0FDF4", EMERALD, 1.5)
    ax.text(82.5, 43, "OFF-CHAIN SECURE VAULT", ha="center", va="center", fontsize=9, fontweight="bold", color=EMERALD)
    ax.text(82.5, 39, "(Encrypted Storage / IPFS)", ha="center", va="center", fontsize=7.5, fontstyle="italic", color=DARK_GRAY)

    vault_items = [
        "• Encrypted Citizen Full Name",
        "• Encrypted Residential Address",
        "• Mobile Number & Email",
        "• Digitized Aadhaar & Form 29/30",
        "• Vehicle Service & Fitness Records",
        "• Accessible only with private key"
    ]
    y_v = 33
    for item in vault_items:
        ax.text(70, y_v, item, fontsize=7.2, color=DARK_GRAY)
        y_v -= 4.2

    draw_arrow(ax, 62.5, 62, 67.5, 35, rad=-0.2)

    # Verification Box (Bottom Left)
    draw_box(ax, 3, 17, 59, 31, "#F8FAFC", BORDER_GRAY, 1.2)
    ax.text(32.5, 43, "HOW AUTHORITIES & CITIZENS VERIFY TITLE INTEGRITY (O(1) HASH MATCH)",
            ha="center", va="center", fontsize=8.5, fontweight="bold", color=NAVY)

    verif_steps = (
        "1. Physical Verification: An RTO officer or buyer scans the physical plate or RC document.\n"
        "2. Deterministic Hash: The client application computes Keccak-256(Scanned_Plate).\n"
        "3. Instant Look-Up: The smart contract checks _plateToVehicleId[commitment] in constant time O(1).\n"
        "4. Tamper Detection: If a rogue party changed a single letter or character, the hashes mismatch.\n"
        "5. Result: Guaranteed anti-tamper authenticity with zero personal citizen data exposed to the public."
    )
    ax.text(5, 28, verif_steps, fontsize=7.8, color=DARK_GRAY, linespacing=1.4)

    # Bottom Privacy Callout
    draw_box(ax, 3, 3, 94, 9.5, "#EFF6FF", NAVY, 1.0)
    ax.text(50, 7.8, "COMPLIANCE & LEGAL BENCHMARK", ha="center", va="center", fontsize=8.5, fontweight="bold", color=NAVY)
    ax.text(50, 4.8, "Fully complies with India's Digital Personal Data Protection Act (DPDPA 2023) and GDPR Article 25 (Privacy by Design).",
            ha="center", va="center", fontsize=8, color=DARK_GRAY)

    plt.tight_layout()
    out_file = os.path.join(OUT_DIR, "diagram_5_privacy_commitments.png")
    fig.savefig(out_file, dpi=300, bbox_inches="tight")
    plt.close(fig)
    print(f"Generated: {out_file}")

if __name__ == "__main__":
    generate_diagram_1()
    generate_diagram_2()
    generate_diagram_3()
    generate_diagram_4()
    generate_diagram_5()
    print("ALL 5 DIAGRAMS GENERATED SUCCESSFULLY.")
