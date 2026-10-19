/**
 * One command does everything. No manual steps.
 *
 *   npm start
 *
 *   1. installs any missing dependencies
 *   2. compiles the contract and runs the test suite
 *   3. starts a local Hardhat blockchain
 *   4. deploys VehicleRegistry and seeds sample vehicles
 *   5. prints the blockchain-concepts proof against the live chain
 *   6. starts the web app and opens the browser
 *
 * Ctrl+C shuts everything down.
 */

const { spawn, execSync, spawnSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const RPC_URL = 'http://127.0.0.1:8545';
const WEB_URL = 'http://localhost:3000';
const COMPILED_ARTIFACT = path.join(
  ROOT,
  'artifacts/contracts/VehicleRegistry.sol/VehicleRegistry.json'
);

const children = [];
let shuttingDown = false;

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

const say = (msg) => console.log(msg);
const step = (n, total, msg) => console.log(`\n[${n}/${total}] ${msg}`);
const ok = (msg) => console.log(`   OK  ${msg}`);
const fail = (msg) => console.log(`  FAIL ${msg}`);

function run(command, args, opts = {}) {
  return spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: isWindows,
    ...opts
  });
}

function runOrThrow(command, args, label) {
  const res = run(command, args);
  if (res.status !== 0) {
    console.error(res.stdout || '');
    console.error(res.stderr || '');
    throw new Error(`${label} failed with exit code ${res.status}`);
  }
  return res.stdout || '';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpGetJson(url, body, timeout = 4000) {
  return new Promise((resolve) => {
    const payload = JSON.stringify(body);
    const req = http.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            resolve(null);
          }
        });
      }
    );
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.write(payload);
    req.end();
  });
}

function httpHeadOk(url, timeout = 4000) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout }, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function rpcIsLive() {
  const res = await httpGetJson(RPC_URL, {
    jsonrpc: '2.0',
    method: 'eth_chainId',
    params: [],
    id: 1
  });
  return Boolean(res && res.result === '0x7a69');
}

async function waitForRpc(timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await rpcIsLive()) return true;
    await sleep(1000);
  }
  return false;
}

async function waitForHttp(url, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await httpHeadOk(url)) return true;
    await sleep(1500);
  }
  return false;
}

/** True when a Hardhat node on 8545 has contracts already deployed to it. */
async function chainHasRegistry() {
  const cfgPath = path.join(ROOT, 'frontend/src/contractDetails.json');
  if (!fs.existsSync(cfgPath)) return false;
  let cfg;
  try {
    cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  } catch (err) {
    return false;
  }
  if (!cfg.address) return false;

  const res = await httpGetJson(RPC_URL, {
    jsonrpc: '2.0',
    method: 'eth_getCode',
    params: [cfg.address, 'latest'],
    id: 1
  });
  return Boolean(res && res.result && res.result !== '0x');
}
function spawnTracked(command, args, label, opts = {}) {
  const child = spawn(command, args, {
    cwd: ROOT,
    shell: isWindows,
    stdio: opts.stdio || 'pipe',
    env: { ...process.env, FORCE_COLOR: '0' }
  });
  child.__label = label;
  children.push(child);

  if (child.stdout) {
    child.stdout.on('data', (d) => {
      const text = d.toString();
      if (opts.quiet) return;
      if (opts.echo) process.stdout.write(text);
    });
  }
  if (child.stderr) {
    child.stderr.on('data', (d) => {
      const text = d.toString();
      if (opts.echo) process.stderr.write(text);
      else if (/error|Error|ERR!/.test(text) && !/ExperimentalWarning/.test(text)) {
        process.stderr.write(`[${label}] ${text}`);
      }
    });
  }
  child.on('exit', (code) => {
    if (shuttingDown) return;
    if (code !== 0 && code !== null) {
      console.log(`\n${label} stopped unexpectedly (code ${code}). Shutting down.`);
      shutdown(1);
    }
  });
  return child;
}

function openBrowser() {
  const url = WEB_URL;
  try {
    if (isWindows) {
      spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
    } else if (process.platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch (err) {
    /* browser launch is a convenience, never a failure */
  }
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('\nShutting down AutoChain...');
  for (const child of children) {
    try {
      if (isWindows) {
        spawnSync('taskkill', ['/pid', String(child.pid), '/f', '/t'], { stdio: 'ignore' });
      } else {
        child.kill('SIGTERM');
      }
    } catch (err) {
      /* already gone */
    }
  }
  setTimeout(() => process.exit(code), 800);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

async function main() {
  const TOTAL = 6;
  say('====================================================');
  say(' AutoChain  -  Blockchain Vehicle Registration');
  say('====================================================');

  /* 1 -------------------------------------------------- dependencies */
  step(1, TOTAL, 'Installing dependencies');
  if (!fs.existsSync(path.join(ROOT, 'node_modules', 'hardhat'))) {
    say('   Installing root packages...');
    runOrThrow(npmCmd, ['install'], 'npm install');
  }
  if (!fs.existsSync(path.join(ROOT, 'frontend', 'node_modules', 'vite'))) {
    say('   Installing frontend packages...');
    runOrThrow(npmCmd, ['--prefix', 'frontend', 'install'], 'npm install (frontend)');
  }
  ok('all packages present');

  /* 2 ------------------------------------------------ compile + test */
  step(2, TOTAL, 'Compiling contract and running tests');
  runOrThrow(npxCmd, ['hardhat', 'compile'], 'hardhat compile');
  const testOut = runOrThrow(npxCmd, ['hardhat', 'test'], 'hardhat test');
  const passLine = (testOut.match(/(\d+) passing/) || [, '0'])[1];
  if (/failing/.test(testOut)) {
    throw new Error('Test suite has failures, refusing to deploy a broken build.');
  }
  ok(`contracts compiled, ${passLine} tests passing`);

  /* 3 ----------------------------------------------------- blockchain */
  step(3, TOTAL, 'Starting local blockchain');

  let startedNode = false;
  if (await rpcIsLive()) {
    ok(`reusing the node already running on ${RPC_URL}`);
  } else {
    spawnTracked(npxCmd, ['hardhat', 'node'], 'hardhat node', { quiet: true });
    if (!(await waitForRpc())) {
      throw new Error(`Local blockchain did not come up on ${RPC_URL}`);
    }
    startedNode = true;
    ok(`hardhat node live on ${RPC_URL} (chainId 31337)`);
  }

  /* 4 --------------------------------------------------------- deploy */
  step(4, TOTAL, 'Deploying VehicleRegistry');
  const deployOut = runOrThrow(
    npxCmd,
    ['hardhat', 'run', 'scripts/deploy.js', '--network', 'localhost'],
    'deploy'
  );
  const addressMatch = deployOut.match(/deployed to:\s*(0x[0-9a-fA-F]{40})/);
  if (!addressMatch) throw new Error('Could not read the deployed address from the deploy log.');
  const seeded = (deployOut.match(/Total vehicles on chain:\s*(\d+)/) || [, '?'])[1];
  ok(`contract at ${addressMatch[1]}`);
  ok(`${seeded} vehicles registered on chain`);

  /* 5 ------------------------------------------------------ the proof */
  step(5, TOTAL, 'Proving the blockchain concepts against the live chain');
  const proofOut = runOrThrow(
    npxCmd,
    ['hardhat', 'run', 'scripts/prove-blockchain.js', '--network', 'localhost'],
    'proof'
  );
  // The proof script prints its own report; just confirm it finished cleanly.
  if (!/All security & confidentiality architecture proofs verified/.test(proofOut)) {
    throw new Error('The blockchain proof did not complete.');
  }
  ok('Security & confidentiality properties verified on the live chain');

  /* 6 ---------------------------------------------------- frontend */
  step(6, TOTAL, 'Starting the web application');
  if (await httpHeadOk(WEB_URL)) {
    ok(`reusing the web app already serving on ${WEB_URL}`);
  } else {
    spawnTracked(npmCmd, ['--prefix', 'frontend', 'run', 'dev'], 'vite', { quiet: true });
    if (!(await waitForHttp(WEB_URL))) {
      throw new Error(`Frontend did not start serving on ${WEB_URL}`);
    }
    ok(`web app live on ${WEB_URL}`);
  }

  const cfg = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'frontend/src/contractDetails.json'), 'utf8')
  );

  say('');
  say('   ------------------------------------------------------');
  say(`   Web app      ${WEB_URL}`);
  say(`   Blockchain   ${RPC_URL}   (chainId 31337)`);
  say(`   Contract     ${cfg.address}`);
  say('   ------------------------------------------------------');
  say('   Authentication Model (Wallet Signature & RBAC):');
  say('     🔐 Citizen Access : Connect Web3 Wallet -> Sign cryptographic challenge nonce');
  say('     🏛️ RTO Officer    : Authorized wallet verified on-chain via RTO_REGISTRAR_ROLE');
  say('   ------------------------------------------------------');
  say('   Website Navigation & Protected Pages:');
  say('     🔍 /         - Public Vehicle Verification (Minimal Data Only)');
  say('     🔑 /login    - Cryptographic Wallet Authentication');
  say('     👤 /user     - User Portal (Authorized Title Holder Only)');
  say('     🏢 /rto      - RTO Authority Portal (On-chain RBAC Protected)');
  say('   ------------------------------------------------------');
  say('   Run the proof again any time with:  npm run prove');
  say('   Press Ctrl+C to stop everything.');
  say('');

  openBrowser();

  if (!startedNode) {
    say('   (a blockchain node was already running before this command)');
  }
}

main().catch((err) => {
  console.error(`\nStartup failed: ${err.message}`);
  shutdown(1);
});
