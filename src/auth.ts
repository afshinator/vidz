import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/youtube.readonly',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && session.user.email) {
        session.user.id = session.user.email;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }

      if (token.refreshToken && token.expiresAt) {
        const expiresAtMs = Number(token.expiresAt) * 1000;
        const shouldRefresh = Date.now() > expiresAtMs - 60000;
        
        if (shouldRefresh) {
          try {
            const response = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                client_id: process.env.AUTH_GOOGLE_ID!,
                client_secret: process.env.AUTH_GOOGLE_SECRET!,
                grant_type: 'refresh_token',
                refresh_token: token.refreshToken as string,
              }),
            });

            if (response.ok) {
              const tokens = await response.json();
              token.accessToken = tokens.access_token;
              token.expiresAt = Math.floor(Date.now() / 1000) + tokens.expires_in;
            }
          } catch {
            // Token refresh failed - let the user re-authenticate
          }
        }
      }

      return token;
    },
  },
});