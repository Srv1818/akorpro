import { createRemoteJWKSet, jwtVerify } from "jose";

const jwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

/**
 * Firebase ID token / session cookie JWT doğrulaması (Edge middleware veya Admin yokken RSC yedek yolu).
 */
export async function verifyFirebaseJwt(token: string, projectId: string) {
  const { payload } = await jwtVerify(token, jwks, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  return payload;
}
