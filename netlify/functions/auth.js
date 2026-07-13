const crypto = require('crypto');

exports.handler = async (event, context) => {
  // Add CORS headers for preflight and standard requests (though hosted on same domain, it is good practice)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    let body = {};
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON payload' })
      };
    }

    const { password } = body;

    if (!password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Password is required' })
      };
    }

    const MINT_HASHED_PASSWORD = process.env.MINT_HASHED_PASSWORD;
    const MINT_GITHUB_PAT = process.env.MINT_GITHUB_PAT;

    if (!MINT_HASHED_PASSWORD || !MINT_GITHUB_PAT) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server environment variables (MINT_HASHED_PASSWORD or MINT_GITHUB_PAT) are not configured.' })
      };
    }

    let isValid = false;

    // Check if the stored hash matches bcrypt format (starts with $2a$, $2b$, or $2y$)
    if (MINT_HASHED_PASSWORD.startsWith('$2a$') || MINT_HASHED_PASSWORD.startsWith('$2b$') || MINT_HASHED_PASSWORD.startsWith('$2y$')) {
      try {
        const bcrypt = require('bcryptjs');
        isValid = await bcrypt.compare(password, MINT_HASHED_PASSWORD);
      } catch (err) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Bcrypt password hashing is configured, but the bcryptjs module could not be loaded. Please ensure npm dependencies are installed, or switch to a native SHA-256 hash instead.' 
          })
        };
      }
    } else {
      // Default to SHA-256 (64 hex characters)
      const inputHash = crypto.createHash('sha256').update(password).digest('hex');
      const cleanInputHash = inputHash.trim().toLowerCase();
      const cleanStoredHash = MINT_HASHED_PASSWORD.trim().toLowerCase();

      if (cleanInputHash.length === cleanStoredHash.length) {
        try {
          isValid = crypto.timingSafeEqual(
            Buffer.from(cleanInputHash, 'hex'),
            Buffer.from(cleanStoredHash, 'hex')
          );
        } catch (e) {
          isValid = (cleanInputHash === cleanStoredHash);
        }
      } else {
        isValid = false;
      }
    }

    if (!isValid) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid password' })
      };
    }

    // Return the token and any repo configuration details set on the server
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        token: MINT_GITHUB_PAT,
        owner: process.env.MINT_GITHUB_OWNER || null,
        repo: process.env.MINT_GITHUB_REPO || null,
        branch: process.env.MINT_GITHUB_BRANCH || 'main'
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
    };
  }
};
