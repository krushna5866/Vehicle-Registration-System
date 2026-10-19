# 🚗 Confidential & Secure Blockchain Vehicle Registration System

A security-first, confidentiality-focused **Vehicle Registration & Digital Title Ledger** built on the Ethereum blockchain using **Solidity (0.8.24)**, **OpenZeppelin Contracts (ERC-721, AccessControl, Pausable)**, **Hardhat**, **Ethers.js v6**, and **React**.

---

## 🛡️ Core Guiding Principle

> **"The blockchain should prove that a record exists and has not been altered — it should not become a public database of personal or sensitive vehicle information."**

### Key Design Pillars

1. **Minimum On-Chain Data**: The blockchain ledger stores only cryptographic commitments (hashes) and operational title states. Plaintext PII (names, emails, phone numbers) and official investigation documents (Police FIRs, scrappage certificates) remain in encrypted off-chain storage.
2. **Commitment-Based Integrity**: VINs and registration plates are hashed using `keccak256` before writing to the blockchain (`vinCommitment`, `registrationCommitment`). Duplicate commitments are programmatically rejected on-chain.
3. **Cryptographic Web3 Authentication**: Zero hardcoded credentials, seed accounts, or browser-stored passwords. Citizens authenticate by cryptographically signing a one-time challenge nonce using their private key (MetaMask).
4. **On-Chain Role-Based Access Control (RBAC)**: Enforced via OpenZeppelin's `AccessControl`. RTO Officer administrative privileges require holding `RTO_REGISTRAR_ROLE` directly on the smart contract.
5. **Two-Step Safe Title Transfers**: Prevents accidental transfer to mistyped or incorrect addresses. The seller initiates the transfer; the designated buyer must sign to accept the title.
6. **Programmatic Theft Lock**: Vehicles flagged as `Stolen` under an official Police FIR are instantly and irreversibly locked from transfer until formally resolved by an authorized RTO officer.
7. **Zero Fake Blockchain Fallbacks**: If the blockchain network is unreachable, the system enters an explicit **Read-Only / Service Unavailable** mode. No browser `localStorage` mock ledger is permitted to act as an unverified blockchain.
8. **Minimal-Data Public Verification**: Public visitors can verify authentic registration and legal roadworthy status (Active / Stolen / Scrapped) without leaking owner identity, contact details, or past ownership trails.

---

## 🏛️ System Architecture

```
                                ┌──────────────────────────────────────────────┐
                                │               Public Visitor                 │
                                └──────────────────────┬───────────────────────┘
                                                       │
                       ┌───────────────────────────────┴───────────────────────────────┐
                       ▼                                                               ▼
            🔍 Public Verification Search                                   🔐 Web3 Authentication
            Route: /                                                        Route: /login
            • Query by Plate or 17-char VIN                                 • Connect Web3 Wallet (MetaMask)
            • Validates on-chain commitment                                 • Cryptographic challenge nonce signing
            • Displays make, model, year, status                            • Recover signer address & verify on-chain
            • Zero owner PII or previous owner trail                        • Resolves role: RTO_OFFICER or CITIZEN
                                                       │
                                  ┌────────────────────┴────────────────────┐
                                  ▼                                         ▼
               🏢 RTO Officer Portal (Protected)         👤 Citizen Title Portal (Protected)
               Route: /rto                               Route: /user (or /citizen)
               [On-Chain Check: RTO_REGISTRAR_ROLE]      [Access: Authenticated Title Holders]
               • Register New Vehicle Title              • View Owned Vehicles (RC Smartcards)
               • Compute VIN & Plate commitments         • Two-Step Safe Title Transfer:
               • Store specs off-chain (metadataHash)        1. Owner initiates transfer to buyer
               • Update Legal State (Active/Stolen/Scrap)    2. Buyer signs & accepts incoming title
               • Hash FIR / Scrappage reason on-chain        3. Owner cancels pending transfer if needed
               • Inspect on-chain integrity audit trail  • On-Chain cryptographic audit verification
```

---

## 📊 On-Chain vs. Off-Chain Data Separation

| Data Category | On-Chain Blockchain Ledger | Protected Off-Chain Storage |
| :--- | :--- | :--- |
| **Vehicle ID** | `bytes32 vehicleId` (Canonical Token ID) | Keyed by `vehicleId` |
| **Chassis / VIN** | `bytes32 vinCommitment` (`keccak256`) | Full 17-character VIN (encrypted) |
| **Registration Plate** | `bytes32 registrationCommitment` (`keccak256`) | Full plate (e.g. `MH 12 AB 1234`) |
| **Technical Specs** | `bytes32 metadataHash` (Integrity digest) | Make, model, year, fuel type |
| **Legal State** | `enum VehicleState { Active, Stolen, Scrapped }` | Status history & timestamp |
| **Status Reason / FIR** | `bytes32 reasonHash` (`keccak256`) | Police FIR document, station, case # |
| **Owner Identity** | `address titleHolder` (ERC-721 owner) | Owner name, email, phone, physical address |
| **Public Visibility** | Status & authenticity only | Restricted to owner & authorized officers |

---

## 🔐 Information Access Matrix

| Information Field | Public Verification | Citizen (Owner) | RTO Transport Officer |
| :--- | :---: | :---: | :---: |
| **Vehicle Existence & Validity** | ✅ Verified | ✅ Verified | ✅ Verified |
| **Legal Status (Active / Stolen / Scrapped)** | ✅ Visible | ✅ Visible | ✅ Visible |
| **Make, Model, Year** | ✅ Visible | ✅ Visible | ✅ Visible |
| **Masked Plate / Masked VIN** | ✅ Minimal | ✅ Full (Own vehicle) | ✅ Full |
| **Owner Identity (Name, Email, Phone)** | ❌ Never | ✅ Own vehicle only | 🔒 Authorized inquiries only |
| **Full Historical Transfer Trail** | ❌ Never | 🔒 Own transfer logs | 🔒 Authorized audit |
| **Police FIR Reference Details** | ❌ Never | ❌ Never | ✅ Full investigation record |
| **Initiate Title Transfer** | ❌ Forbidden | ✅ Own vehicle only | ❌ Forbidden |
| **Update Vehicle Legal State** | ❌ Forbidden | ❌ Forbidden | ✅ Authorized RTO officer |

---

## ⚡ Quick Start (1-Command Automated Startup)

To start the local blockchain, compile contracts, run tests, deploy the registry, verify on-chain proofs, and launch the web portal:

```bash
npm start
```

### What this automated command does:
1. Verifies root and frontend dependencies.
2. Compiles smart contracts with Hardhat (`evmVersion: cancun`, Solidity `0.8.24`).
3. Runs the automated test suite (**16 unit tests passing**).
4. Launches a local Ethereum blockchain node on `http://127.0.0.1:8545` (Chain ID: `31337`).
5. Deploys `VehicleRegistry.sol` granting `DEFAULT_ADMIN_ROLE` and `RTO_REGISTRAR_ROLE`.
6. Seeds initial vehicle records using cryptographic commitments and exports contract details & off-chain metadata.
7. Executes the on-chain security proof suite (`scripts/prove-blockchain.js`).
8. Starts the Vite web application on **`http://localhost:3000`** and opens your browser.

---

## 🔑 Authentication Workflow

### Citizen Sign-In:
1. Navigate to `/login` and click **"Connect Web3 Wallet (MetaMask)"**.
2. Click **"Sign Security Challenge to Authenticate"**.
3. A random one-time nonce is generated and presented in MetaMask.
4. Sign the challenge message with your private key.
5. The application verifies your cryptographic signature and establishes an authenticated session.

### RTO Officer Access:
1. Connect MetaMask using the wallet assigned `RTO_REGISTRAR_ROLE` during deployment.
2. Sign the security challenge.
3. The smart contract verifies on-chain role authorization via `AccessControl.hasRole()`.
4. Access to `/rto` is granted. Non-authorized wallets visiting `/rto` receive a `403 Forbidden` notice.

---

## 🧪 Testing & Verification

### Run Smart Contract Test Suite
```bash
npm test
```
*Executes 16 tests covering RBAC authorization, commitment uniqueness, two-step safe transfers, theft locking, pausable emergency controls, and event privacy.*

### Run Live Blockchain Security Proofs
```bash
npm run prove
```
*Proves role-based access control, duplicate rejection, safe two-step transfer, theft freeze, and admin pause against the live network.*

### Production Frontend Build
```bash
npm run frontend:build
```
*Builds production bundles using Vite.*

---

## 📁 Repository Structure

```
BC project/
├── contracts/
│   └── VehicleRegistry.sol           # Core ERC-721 + AccessControl + Pausable contract
├── test/
│   └── VehicleRegistry.test.js       # Comprehensive unit test suite (16 tests)
├── scripts/
│   ├── deploy.js                     # Deploys contract & initializes off-chain store
│   ├── prove-blockchain.js           # Live on-chain security & privacy verification
│   └── start-all.js                  # Automated 1-command startup script
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Masked address & node status navigation
│   │   │   ├── HSRPPlate.jsx         # High Security Registration Plate component
│   │   │   └── ProtectedRoute.jsx    # Web3 RBAC route guard
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # Cryptographic challenge-nonce signing
│   │   │   └── BlockchainContext.jsx # On-chain contract & two-step transfer context
│   │   ├── pages/
│   │   │   ├── HomePage.jsx          # Minimal-data public verification search
│   │   │   ├── LoginPage.jsx         # Web3 signature authentication
│   │   │   ├── CitizenPortalPage.jsx # Digital RC titles & two-step transfer UI
│   │   │   └── RtoPortalPage.jsx     # Official RTO registration & status desk
│   │   ├── services/
│   │   │   └── offchainStorageService.js # Off-chain hashing & metadata service
│   │   └── constants/
│   │       └── vehicleConstants.js   # UI constants & privacy masking utilities
│   └── package.json
├── .env.example                      # Safe environment template (zero secrets)
├── .gitignore                        # Git exclusion rules for keys, credentials, env
├── hardhat.config.js                 # Hardhat configuration
└── package.json                      # Root configuration & scripts
```

---

## 📄 License

This project is licensed under the **MIT License**.
