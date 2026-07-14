# Cloud Mint 🍃

Cloud Mint is a premium, minimalist, single-user file manager hosted on Netlify, using a private GitHub repository as the secure storage backend. It communicates directly with the GitHub API from the client to stream files up to 100MB, avoiding serverless timeout and payload constraints.

### 🌟 The Core USP (Problem & Solution)
* **The Problem:** Traditional personal file storage solutions usually require hosting heavy databases, running complex physical home servers (like a NAS) that are hard to secure, or paying monthly subscriptions to large corporations that track and scan your personal documents. Furthermore, accessing home storage securely from a mobile device while on the go often requires configuring complex VPNs or dangerous port forwarding.
* **The Solution:** Cloud Mint is a **portable, zero-maintenance file vault** accessible from **any device, anywhere in the world** via a simple browser tab. By leveraging free serverless hosting (Netlify) and secure private repositories (GitHub), it provides an instant on-the-go portal. You can securely upload, download, search, and manage your private files from any phone, tablet, or desktop with absolute privacy and zero configuration overhead.

---

## Documentation

To help you get set up and understand the system, please refer to the following files:
- 🚀 **[Setup & Deployment Guide](SETUP.md)**: A step-by-step walkthrough to configure your private storage repo, generate a GitHub Personal Access Token (PAT), hash your password, and deploy the application to Netlify.
- 📘 **[Layman to Advanced Guide](GUIDE.md)**: A detailed user guide explaining basic usage (uploading/downloading/creating folders) as well as the advanced developer architecture (capping limits, Local Path Trie parsing, and authenticated binary downloads).

---

## Features

- **Direct GitHub API Streaming:** Bypasses Netlify's 6MB serverless payload limit for uploads and deletions.
- **Dual-Path Upload Engine:** Automatically dispatches files via the fast Contents API (for small files ≤7MB) or the Git Data API (4-step atomic commit pipeline for files up to 100MB) to ensure maximum speed and reliability.
- **Strict Size Control:** Intercepts file size client-side and triggers a polished modal warning if a file exceeds 100MB.
- **Secure Authentication Proxy:** Netlify Serverless Function `/api/auth` validates access keys and proxy-delivers the GitHub PAT.
- **Ephemeral Session Storage:** Personal Access Token is held strictly in browser `sessionStorage` (wiped when tab closes).
- **Cinematic Dark Design:** Slate backdrop with vibrant emerald accents, glassmorphic card widgets, and custom hover/long-press interactions.
- **Touch-First Controls:** Built-in mobile context menu bottom sheets and long-press event listeners.
- **Local Git Tree Parsing:** Fetches and builds directory trees in a single API round-trip, enabling instant local directory traversal and global vault searching.

---

## File Structure

```
├── netlify/
│   └── functions/
│       └── auth.js         # Secure proxy gateway (v1 Serverless function)
├── public/
│   ├── index.css           # Styling system & glassmorphism effects
│   └── index.html          # Core single-page application & Vanilla JS runtime
├── .env.example            # Environment variables configuration template
├── .gitignore              # Local dev exclusions
├── GUIDE.md                # Operating and architectural developer guide
├── netlify.toml            # Build / publish setup mapping
├── package.json            # Node dependency metadata (bcryptjs fallback support)
└── SETUP.md                # Deployment and configuration setup guide
```

---

## Configuration

Cloud Mint reads credentials from environment variables. Set the following in your Netlify Site Settings (**Site Configuration > Environment variables**):

| Variable Name | Required | Description |
| :--- | :--- | :--- |
| `MINT_HASHED_PASSWORD` | **Yes** | A SHA-256 hex string or a bcrypt hash of your master password. |
| `MINT_GITHUB_PAT` | **Yes** | A GitHub Personal Access Token (PAT) with `repo` scope. |
| `MINT_GITHUB_OWNER` | *Optional* | The owner username of your storage repository. |
| `MINT_GITHUB_REPO` | *Optional* | The repository name (must be private/public, matching the PAT scope). |
| `MINT_GITHUB_BRANCH` | *Optional* | The target branch name (defaults to `main`). |

> [!NOTE]
> If `MINT_GITHUB_OWNER` and `MINT_GITHUB_REPO` are **not** set in the environment variables, the Cloud Mint login page will dynamically render input fields allowing you to connect to *any* repository.

### Generating the Password Hash

#### Option A: Native SHA-256 (Recommended)
You can hash your password using a terminal utility without external tools. 
For example, if your password is `super-secret-vault`:

**macOS/Linux (Terminal):**
```bash
echo -n "super-secret-vault" | shasum -a 256
# Output: 37943d0408544c7b6c7bb8cfa826978438db02b7405e3f4e1f76d90042a98f1f
```

**Windows (PowerShell):**
```powershell
$bytes = [System.Text.Encoding]::UTF8.GetBytes("super-secret-vault")
$hash = [System.Security.Cryptography.SHA256Managed]::new().ComputeHash($bytes)
[System.BitConverter]::ToString($hash).Replace("-", "").ToLower()
# Output: 37943d0408544c7b6c7bb8cfa826978438db02b7405e3f4e1f76d90042a98f1f
```

Put the resulting 64-character hash into the `MINT_HASHED_PASSWORD` environment variable.

#### Option B: Bcrypt Hash
Alternatively, you can generate a standard bcrypt hash (e.g., using online tools or Node scripts) and set `MINT_HASHED_PASSWORD` to that value. The serverless function will automatically detect the bcrypt pattern and verify using `bcryptjs`.

---

## Local Development

You can run Cloud Mint locally using the Netlify CLI to simulate the production serverless environment.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Prashantispacific/cloud-mint.git
   cd cloud-mint
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install Netlify CLI globally (if not already installed):**
   ```bash
   npm install -g netlify-cli
   ```

4. **Set up your environment variables:**
   Copy the example environment template to `.env`:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your details (hashed password, GitHub PAT, owner, and repository name).

5. **Start the local simulation server:**
   ```bash
   npm run dev
   # or
   netlify dev
   ```
   Open `http://localhost:8888` in your browser. Enter your plaintext password (e.g. `super-secret-vault`) to decrypt your storage backend!

---

## Deployment to Netlify

1. Commit your codebase to a private GitHub repository.
2. Link the repository to Netlify.
3. Configure your Environment Variables in Netlify.
4. Click **Deploy**. Netlify will automatically detect `netlify.toml`, compile the serverless function, and host the frontend.
