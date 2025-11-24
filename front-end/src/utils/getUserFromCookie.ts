import { jwtDecode } from "jwt-decode";

export function getUserFromCookie(): { email: string } | null {
  try {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("cognito_id_token="));

    if (!cookie) return null;

    const token = cookie.split("=")[1];
    const decoded: any = jwtDecode(token);

    return { email: decoded.email };
  } catch (err) {
    console.error("Cookie decode failed:", err);
    return null;
  }
}
