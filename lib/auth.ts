import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      companyId?: string | null;
    };
  }

  interface User {
    role: Role;
    companyId?: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    companyId?: string | null;
  }
}

/**
 * Never use VERCEL_URL — it is a per-deploy hostname and breaks login on
 * the stable production domain (anshikalogistics.vercel.app).
 */
function resolveAuthUrl(): string | undefined {
  const configured = process.env.AUTH_URL || process.env.NEXTAUTH_URL;

  // Ignore localhost and ignore ephemeral *.vercel.app deployment hosts
  // (except the stable project production domain).
  const isEphemeralVercelHost = (url: string) =>
    /https?:\/\/[^/]+-[\w]+-[\w.-]+\.vercel\.app/i.test(url) ||
    (/vercel\.app/i.test(url) && !/anshikalogistics\.vercel\.app/i.test(url));

  if (
    configured &&
    !/localhost|127\.0\.0\.1/i.test(configured) &&
    !isEphemeralVercelHost(configured)
  ) {
    return configured.replace(/\/$/, "");
  }

  const productionHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    (process.env.VERCEL ? "anshikalogistics.vercel.app" : undefined);

  if (productionHost) {
    const host = productionHost.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}`;
  }

  return undefined;
}

const authUrl = resolveAuthUrl();
if (authUrl) {
  process.env.AUTH_URL = authUrl;
  process.env.NEXTAUTH_URL = authUrl;
}
process.env.AUTH_TRUST_HOST = "true";

const authSecret =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "fleetfuel-dev-secret-change-in-production-8f3a9c2e";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  secret: authSecret,
  providers: [
    Credentials({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).trim().toLowerCase();
        const password = String(credentials.password);

        try {
          const user = await prisma.user.findUnique({ where: { email } });

          if (!user?.password || !user.isActive) {
            return null;
          }

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            companyId: user.companyId,
          };
        } catch (error) {
          console.error("Auth authorize error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.companyId = user.companyId;
      }
      if (trigger === "update" && session) {
        token.name = session.name;
        token.image = session.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.companyId = token.companyId as string | null | undefined;
      }
      return session;
    },
  },
});
