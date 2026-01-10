// A full row from the local SQLite `plates` table
export interface PlateRecord {
  id: number;
  fullImage: string;
  plateImage: string;
  plateText: string;
  type: string;
  createdAt: number;
  sent: number;
  sendError: number;

  // Hot sheet enrichment fields
  isHot: number;                 // 0 or 1
  hotFetchedAt: number | null;   // timestamp or null
  hotJson: string | null;        // raw server payload (JSON string)
  make: string | null;
  model: string | null;
  color: string | null;
  flags: string | null;          // JSON array string
  notes: string | null;
}

// Server payload for hot-sheet details.
// All fields optional — server may send partial data.
export interface HotDetails {
  make?: string;
  model?: string;
  color?: string;
  flags?: string[];
  notes?: string;
}

// Minimal fields required to insert a new plate locally
export interface InsertPlateInput {
  fullImage: string;
  plateImage: string;
  plateText: string;
  type: string;
}

// Partial update object for updating any plate fields
export interface UpdatePlateInput {
  plateText?: string;
  type?: string;
  sent?: number;
  sendError?: number;

  // Hot fields
  isHot?: number;
  hotFetchedAt?: number | null;
  hotJson?: any;
  make?: string | null;
  model?: string | null;
  color?: string | null;
  flags?: string[] | null;
  notes?: string | null;
}