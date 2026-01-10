import * as SQLite from 'expo-sqlite';
import { PlateRecord, HotDetails, InsertPlateInput, UpdatePlateInput  } from "@/libraries/citizen/types";

export const db = SQLite.openDatabaseSync('plates.db');

export function initDatabase() {
  // Plates table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS plates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullImage TEXT NOT NULL,
      plateImage TEXT NOT NULL,
      plateText TEXT NOT NULL,
      type TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      sent INTEGER DEFAULT 0,
      sendError INTEGER DEFAULT 0,

      -- Hot sheet enrichment fields
      isHot INTEGER DEFAULT 0,
      hotFetchedAt INTEGER,
      hotJson TEXT,
      make TEXT,
      model TEXT,
      color TEXT,
      flags TEXT,
      notes TEXT
    );
  `);

  // Hot Sheet membership table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS hot_sheet (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plateText TEXT NOT NULL,
      createdAt INTEGER
    );
  `);
}

export async function insertPlate(record: InsertPlateInput): Promise<void> {
  const hot = await getLocalHotDetails(record.plateText);

  await db.runAsync(
    `INSERT INTO plates 
      (fullImage, plateImage, plateText, type, createdAt, sent, sendError,
       isHot, hotFetchedAt, hotJson)
     VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?, ?)`,
    [
      record.fullImage,
      record.plateImage,
      record.plateText,
      record.type,
      Date.now(),

      hot ? 1 : 0,
      hot ? Date.now() : null,
      hot ? JSON.stringify(hot) : null,
    ]
  );
}

export async function updatePlate(id: number, updates: UpdatePlateInput): Promise<void> {
  let isHot = updates.isHot ?? null;
  let hotFetchedAt = updates.hotFetchedAt ?? null;
  let hotJson = updates.hotJson ?? null;

  // If plateText is being changed, re-check hot sheet
  if (updates.plateText) {
    const hot = await getLocalHotDetails(updates.plateText);

    isHot = hot ? 1 : 0;
    hotFetchedAt = hot ? Date.now() : null;
    hotJson = hot ? hot : null;
  }

  await db.runAsync(
    `UPDATE plates SET 
      plateText = ?, 
      type = ?, 
      sent = ?, 
      sendError = ?,
      isHot = COALESCE(?, isHot),
      hotFetchedAt = COALESCE(?, hotFetchedAt),
      hotJson = COALESCE(?, hotJson),
      make = COALESCE(?, make),
      model = COALESCE(?, model),
      color = COALESCE(?, color),
      flags = COALESCE(?, flags),
      notes = COALESCE(?, notes)
     WHERE id = ?`,
    [
      updates.plateText ?? null,
      updates.type ?? null,
      updates.sent ?? 0,
      updates.sendError ?? 0,

      isHot,
      hotFetchedAt,
      hotJson ? JSON.stringify(hotJson) : null,
      updates.make ?? null,
      updates.model ?? null,
      updates.color ?? null,
      updates.flags ? JSON.stringify(updates.flags) : null,
      updates.notes ?? null,

      id,
    ]
  );
}

export async function deletePlate(id:number) {
  await db.runAsync(`DELETE FROM plates WHERE id = ?`, [id]);
}

export async function getPlate(id: number): Promise<PlateRecord | null> {
  const rows = await db.getAllAsync<PlateRecord>(
    "SELECT * FROM plates WHERE id = ?",
    [id]
  );
  return rows[0] ?? null;
}

export async function getAllPlates(): Promise<PlateRecord[]> {
  return db.getAllAsync<PlateRecord>(
    "SELECT * FROM plates ORDER BY createdAt DESC"
  );
}

// This is the function you’ll call after fetching server detail
export async function hydratePlateWithHotDetails(plateText: string, details: HotDetails): Promise<void> {
  await db.runAsync(
    `UPDATE plates SET
      isHot = 1,
      hotFetchedAt = ?,
      hotJson = ?,
      make = COALESCE(?, make),
      model = COALESCE(?, model),
      color = COALESCE(?, color),
      flags = COALESCE(?, flags),
      notes = COALESCE(?, notes)
     WHERE plateText = ?`,
    [
      Date.now(),
      JSON.stringify(details),
      details.make ?? null,
      details.model ?? null,
      details.color ?? null,
      details.flags ? JSON.stringify(details.flags) : null,
      details.notes ?? null,
      plateText,
    ]
  );
}

/**
 * Hot Sheets
 */
export async function getLocalHotDetails(plateText: string) {
  const row = await db.getFirstAsync(
    `SELECT * FROM hot_sheet WHERE plateText = ?`,
    [plateText]
  );
  return row ?? null;
}

// Clear all hot sheet entries
export function clearHotSheet() {
  db.execSync(`DELETE FROM hot_sheet;`);
}

// Insert a single hot sheet entry
export function insertHotSheetEntry(plateText: string, createdAt: number) {
  db.runSync(
    `INSERT INTO hot_sheet (plateText, createdAt) VALUES (?, ?)`,
    [plateText, createdAt]
  );
}

// Retrieve all hot sheet entries
export function getHotSheet() {
  return db.getAllSync<{ plateText: string }>(`
    SELECT plateText FROM hot_sheet;
  `);
}

// Refresh
export async function refreshHotSheetAsync() {
  try {
    /*const response = await fetch("https://yourserver.com/hot-sheet");
    if (!response.ok) {
      console.warn("Hot sheet fetch failed:", response.status);
      return;
    }*/

    //const list: string[] = await response.json();
    
    // Hardcode
    const list: string[] = [
      "ABC123",
      "JDKF902",
      "B7XZ11",
      "CITZ-908",
      "ONT-4432",
      "FASTPL8",
      "H0T999",
      "RED22",
      "ZK9M33",
      "PLT-777"
    ];

    clearHotSheet();

    const now = Date.now();
    for (const plate of list) {
      insertHotSheetEntry(plate, now);
    }

    console.log(`Hot sheet updated with ${list.length} entries`);
  } catch (err) {
    console.warn("Hot sheet fetch error:", err);
  }
}

export async function getPlateByPlateText(plateText: string): Promise<PlateRecord | null> {
  const rows = await db.getAllAsync<PlateRecord>(
    "SELECT * FROM plates WHERE plateText = ?",
    [plateText]
  );
  return rows[0] ?? null;
}