'use server';

import { cookies } from 'next/headers';

const USER_COOKIE = 'cognito_user';

export async function setUserCookie(user: any) {
  const cookieStore = await cookies();   // ⬅️ FIX: await the promise

  cookieStore.set({
    name: USER_COOKIE,
    value: JSON.stringify(user),
    httpOnly: false,
    path: '/',
  });
}
