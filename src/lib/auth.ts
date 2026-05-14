import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const ADMIN_EMAILS = ["admin@crystallsx.com"];

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/cuenta/login" },
  providers: [
    CredentialsProvider({
      id: "customer",
      name: "Cliente",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const customer = await prisma.customer.findUnique({
          where: { email: credentials.email },
        });
        if (!customer) return null;

        const isValid = await bcrypt.compare(credentials.password, customer.password);
        if (!isValid) return null;

        const role = ADMIN_EMAILS.includes(customer.email) ? "admin" as const : "customer" as const;
        return { id: customer.id, email: customer.email, name: customer.name, role };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
