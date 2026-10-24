import NextAuth from "next-auth";
import { authOptions } from "../../../../lib/auth"; // O caminho sobe 4 níveis até à pasta lib

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };