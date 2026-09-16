import NextAuth from "next-auth";
import Google, { type GoogleProfile } from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider !== "google") return false;

      const googleProfile = profile as GoogleProfile | undefined;
      return (
        googleProfile?.email_verified === true && Boolean(user.email?.trim())
      );
    },
    authorized({ auth: session }) {
      return Boolean(session?.user?.email);
    },
  },
  events: {
    async signIn({ account, user }) {
      if (account?.provider !== "google" || !user.email) return;

      const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
      if (!webhookUrl) {
        console.warn(
          "[auth] Google Sheets sign-in logging skipped: webhook is not configured.",
        );
        return;
      }

      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: user.name || "",
            email: user.email,
          }),
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
          console.warn(
            `[auth] Google Sheets sign-in logging returned status ${response.status}.`,
          );
        }
      } catch (error) {
        const errorType = error instanceof Error ? error.name : "UnknownError";
        console.warn(
          `[auth] Google Sheets sign-in logging failed (${errorType}).`,
        );
      }
    },
  },
  trustHost: true,
});
