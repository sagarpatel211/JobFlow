import GithubProvider from "next-auth/providers/github";

const githubId = process.env.GITHUB_ID;
const githubSecret = process.env.GITHUB_SECRET;

if (githubId === undefined || githubId === "" || githubSecret === undefined || githubSecret === "") {
  throw new Error("Missing Github environment variables: GITHUB_ID and GITHUB_SECRET must be provided.");
}

export const authOptions = {
  providers: [
    GithubProvider({
      clientId: githubId,
      clientSecret: githubSecret,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" as const },
};
