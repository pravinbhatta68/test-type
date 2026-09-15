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
  trustHost: true,
});
