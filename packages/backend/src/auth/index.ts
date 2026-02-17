import { Hono } from "hono";
import { Google, generateState, generateCodeVerifier } from "arctic";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { drizzle } from "drizzle-orm/d1";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

type Bindings = {
  DB: D1Database;
  SESSIONS: KVNamespace;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  REDIRECT_URI_BASE: string;
};

export const auth = new Hono<{ Bindings: Bindings }>();

const getGoogleAuth = (c: any) =>
  new Google(
    c.env.GOOGLE_CLIENT_ID,
    c.env.GOOGLE_CLIENT_SECRET,
    `${c.env.REDIRECT_URI_BASE}/auth/callback/google`,
  );

auth.get("/login/google", async (c) => {
  const google = getGoogleAuth(c);
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, [
    "openid",
    "profile",
    "email",
  ]);

  setCookie(c, "google_oauth_state", state, {
    path: "/",
    secure: true,
    httpOnly: true,
    maxAge: 600,
    sameSite: "Lax",
  });
  setCookie(c, "google_code_verifier", codeVerifier, {
    path: "/",
    secure: true,
    httpOnly: true,
    maxAge: 600,
    sameSite: "Lax",
  });

  return c.redirect(url.toString());
});

auth.get("/callback/google", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const storedState = getCookie(c, "google_oauth_state");
  const codeVerifier = getCookie(c, "google_code_verifier");

  if (
    !code ||
    !state ||
    !storedState ||
    !codeVerifier ||
    state !== storedState
  ) {
    return c.text("Invalid state or code", 400);
  }

  const google = getGoogleAuth(c);
  try {
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    const response = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.accessToken()}` },
      },
    );
    const userProfile: any = await response.json();

    const db = drizzle(c.env.DB);
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, userProfile.email))
      .get();

    let userId = existingUser?.id;
    if (!existingUser) {
      userId = crypto.randomUUID();
      await db
        .insert(users)
        .values({
          id: userId,
          email: userProfile.email,
          name: userProfile.name,
          photoUrl: userProfile.picture,
          authProvider: "google",
          authProviderId: userProfile.sub,
        })
        .execute();
    }

    const sessionId = crypto.randomUUID();
    await c.env.SESSIONS.put(`session:${sessionId}`, userId!, {
      expirationTtl: 60 * 60 * 24 * 30,
    }); // 30 days

    setCookie(c, "l1nk_session", sessionId, {
      path: "/",
      secure: true,
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "Lax",
    });

    const frontendUrl = c.env.FRONTEND_URL || "http://localhost:5173";
    return c.redirect(frontendUrl);
  } catch (e) {
    console.error(e);
    return c.text("Authentication failed", 500);
  }
});

auth.get("/me", async (c) => {
  const sessionId = getCookie(c, "l1nk_session");
  if (!sessionId) return c.json({ user: null });

  const userId = await c.env.SESSIONS.get(`session:${sessionId}`);
  if (!userId) return c.json({ user: null });

  const db = drizzle(c.env.DB);
  const user = await db.select().from(users).where(eq(users.id, userId)).get();

  return c.json({ user });
});

auth.post("/logout", async (c) => {
  const sessionId = getCookie(c, "l1nk_session");
  if (sessionId) {
    await c.env.SESSIONS.delete(`session:${sessionId}`);
  }
  deleteCookie(c, "l1nk_session");
  return c.json({ success: true });
});
