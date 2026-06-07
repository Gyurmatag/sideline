"use client";

import { createAuthClient } from "better-auth/react";

// baseURL defaults to the current origin (+/api/auth), which is what we want.
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
