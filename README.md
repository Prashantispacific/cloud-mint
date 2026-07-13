# Cloud Mint 🍃

Cloud Mint is a premium, minimalist, single-user file manager hosted on Netlify, using a private GitHub repository as the secure storage backend. It communicates directly with the GitHub API from the client to stream files up to 45MB, avoiding serverless timeout and payload constraints.

---

## Features

- **Direct GitHub API Streaming:** Bypasses Netlify's 6MB serverless payload limit for uploads and deletions.
- **Strict Size Control:** Intercepts file size client-side and triggers a polished modal warning if a file exceeds 45MB.
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
│   └── index.html          # Core single-page application & Vanilla JS runtime
├── .gitignore              # Local dev exclusions
├── netlify.toml            # Build / publish setup mapping
└── package.json            # Node dependency metadata (bcryptjs fallback support)
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

1. **Install Netlify CLI globally:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Create a `.env` file in the root folder:**
   ```env
   MINT_HASHED_PASSWORD=37943d0408544c7b6c7bb8cfa826978438db02b7405e3f4e1f76d90042a98f1f
   MINT_GITHUB_PAT=ghp_YourPersonalAccessTokenHere
   MINT_GITHUB_OWNER=your-github-username
   MINT_GITHUB_REPO=your-private-repo
   MINT_GITHUB_BRANCH=main
   ```

3. **Start the local simulation server:**
   ```bash
   netlify dev
   ```
   Open `http://localhost:8888` in your browser. Enter your plaintext password (e.g. `super-secret-vault`) to decrypt your storage backend!

---

## Deployment to Netlify

1. Commit your codebase to a private GitHub repository.
2. Link the repository to Netlify.
3. Configure your Environment Variables in Netlify.
4. Click **Deploy**. Netlify will automatically detect `netlify.toml`, compile the serverless function, and host the frontend.
