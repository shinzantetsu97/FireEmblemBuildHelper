import Database from "better-sqlite3";

type CountRow = {
  count: number;
};

const db = new Database("data/app.db");

db.pragma("foreign_keys = ON");

const seedTimestamp = new Date().toISOString();

const seedNotes = [
  {
    id: "note_seed_1",
    profileId: "profile_1",
    title: "贪得无厌",
    content: "我在做贪得无厌的事情",
  },
  {
    id: "note_seed_2",
    profileId: "profile_1",
    title: "非常滴珍贵",
    content: "这个火纹project啊他非常滴珍贵",
  },
  {
    id: "note_seed_3",
    profileId: "profile_1",
    title: "保熟吗",
    content: "你这应用他保熟吗？",
  },
  {
    id: "note_seed_4",
    profileId: "profile_1",
    title: "劈应用",
    content: "你TMD劈我应用是吧（被捅）",
  },
];

const initializeDatabase = db.transaction(() => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      title TEXT,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );
  `);

  db.prepare(`
    INSERT OR IGNORE INTO profiles (id, name, created_at, updated_at)
    VALUES (@id, @name, @createdAt, @updatedAt)
  `).run({
    id: "profile_1",
    name: "Default Profile",
    createdAt: seedTimestamp,
    updatedAt: seedTimestamp,
  });

  const insertNote = db.prepare(`
    INSERT OR IGNORE INTO notes (
      id,
      profile_id,
      title,
      content,
      created_at,
      updated_at
    )
    VALUES (
      @id,
      @profileId,
      @title,
      @content,
      @createdAt,
      @updatedAt
    )
  `);

  for (const note of seedNotes) {
    insertNote.run({
      ...note,
      createdAt: seedTimestamp,
      updatedAt: seedTimestamp,
    });
  }
});

initializeDatabase();

const profileCount = db
  .prepare("SELECT COUNT(*) AS count FROM profiles")
  .get() as CountRow;

const profileNoteCount = db
  .prepare("SELECT COUNT(*) AS count FROM notes WHERE profile_id = ?")
  .get("profile_1") as CountRow;

console.log(`profiles: ${profileCount.count}`);
console.log(`notes for profile_1: ${profileNoteCount.count}`);

db.close();
