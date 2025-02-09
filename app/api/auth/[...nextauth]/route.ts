import NextAuth, { AuthOptions } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const handler = NextAuth(authOptions as AuthOptions);

export { handler as GET, handler as POST };
