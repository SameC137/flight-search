let cachedToken:string |null = null;
let tokenExpiryTime:number |null= null;

export const getAmadeusToken = async () => {
  const currentTime = Date.now();

  // Check if token exists and is still valid (with a 10-second buffer)
  if (cachedToken && tokenExpiryTime && currentTime < tokenExpiryTime - 10000) {
    return cachedToken;
  }

  try {
    const response = await fetch( 'https://test.api.amadeus.com/v1/security/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams([
            ['grant_type', 'client_credentials'],
            ['client_id', process.env.AMADEUS_CLIENT_ID || ''],
            ['client_secret', process.env.AMADEUS_CLIENT_SECRET || '']
        ]).toString(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch Amadeus token');
      }
      
      const uploadResult = await response.json();

    cachedToken = uploadResult.access_token;
    tokenExpiryTime = Date.now() + uploadResult.expires_in * 1000;

    return cachedToken;
  } catch (error) {
    console.error("Error fetching Amadeus token:", error);
    throw new Error("Authentication failed");
  }
};