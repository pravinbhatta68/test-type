import NextAuth from "next-auth";
import Google, { type GoogleProfile } from "next-auth/providers/google";

const isAllowedGmailAddress = (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  return (
    normalizedEmail.endsWith("@gmail.com") ||
    normalizedEmail.endsWith("@googlemail.com")
  );
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider !== "google") return false;

      const googleProfile = profile as GoogleProfile | undefined;
      const email = googleProfile?.email ?? user.email ?? "";

      return googleProfile?.email_verified === true && isAllowedGmailAddress(email);
    },
    authorized({ auth: session }) {
      return Boolean(session?.user?.email);
    },
  },
  trustHost: true,
});
