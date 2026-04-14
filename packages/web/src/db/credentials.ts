import { db } from "./index";

export async function setCredential(
  key: string,
  value: string
): Promise<void> {
  await db.credentials.put({ key, value });
}

export async function getCredential(
  key: string
): Promise<string | undefined> {
  const row = await db.credentials.get(key);
  return row?.value;
}

export async function getAllCredentials(): Promise<Record<string, string>> {
  const rows = await db.credentials.toArray();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function deleteCredential(key: string): Promise<void> {
  await db.credentials.delete(key);
}
