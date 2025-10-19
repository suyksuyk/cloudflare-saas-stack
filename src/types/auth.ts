import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export interface AuthError {
  error: string;
  description?: string;
  code?: string;
}

export interface SignInOptions {
  callbackUrl?: string;
  redirect?: boolean;
}

export interface SignOutOptions {
  callbackUrl?: string;
}

export interface AuthConfig {
  providers: any[];
  pages: {
    signIn: string;
    error: string;
  };
  session: {
    strategy: "database" | "jwt";
    maxAge: number;
    updateAge: number;
  };
  callbacks: {
    signIn: (params: any) => Promise<boolean>;
    session: (params: any) => Promise<any>;
    redirect: (params: any) => string;
  };
  events: {
    signIn: (params: any) => Promise<void>;
    signOut: (params: any) => Promise<void>;
  };
}
