import type { Note } from "../../types";

export type NoteDraft = Pick<Note, "title" | "content">;

export const EMPTY_NOTE_DRAFT: NoteDraft = { title: "", content: "" };
