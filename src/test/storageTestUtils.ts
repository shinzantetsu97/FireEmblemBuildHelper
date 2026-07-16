import { openDB } from "idb";
import { ensureDefaultWorkspace } from "../storage";

const DATABASE_NAME = "fire-emblem-build-helper";

export async function resetBrowserStorage(): Promise<void> {
  await ensureDefaultWorkspace();

  const database = await openDB(DATABASE_NAME, 1);
  const transaction = database.transaction(["workspaces", "notes"], "readwrite");

  await transaction.objectStore("notes").clear();
  await transaction.objectStore("workspaces").clear();
  await transaction.done;
  database.close();
}
