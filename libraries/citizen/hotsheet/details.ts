import {
  getPlateByPlateText,
  hydratePlateWithHotDetails
} from "@/libraries/citizen/db/database"; // adjust path as needed

// 24 hours in milliseconds
export const HOT_DETAILS_REFRESH_INTERVAL = 24 * 60 * 60 * 1000;

// Server can send any subset of these fields
export interface HotDetails {
  make?: string;
  model?: string;
  color?: string;
  flags?: string[];
  notes?: string;
}

// Fetch full details from the server and hydrate the DB
export async function fetchHotDetailsAsync(plateText: string) {
  try {
    /*
    const response = await fetch(
      `https://yourserver.com/hot-details/${encodeURIComponent(plateText)}`
    );

    if (!response.ok) {
      console.warn(
        `Hot details fetch failed for ${plateText}:`,
        response.status
      );
      return;
    }*/

    //const details: HotDetails = await response.json();

    const details = {
      "make": "Toyota",
      "model": "Camry",
      "color": "Blue",
      "flags": ["stolen", "approach-with-caution"],
      "notes": "Call Sg. Kelly (Ottawa Police) 555-2321 if spotted."
    }

    await hydratePlateWithHotDetails(plateText, details);

    console.log(`Hydrated hot details for ${plateText}`);
  } catch (err) {
    console.warn(`Hot details fetch error for ${plateText}:`, err);
  }
}

// Guard: only fetch if stale or never fetched
export async function maybeFetchHotDetails(plateText: string): Promise<void> {
  const plate = await getPlateByPlateText(plateText);
  if (!plate) return;

  const lastFetched = plate.hotFetchedAt ?? 0;
  const age = Date.now() - lastFetched;

  if (age < HOT_DETAILS_REFRESH_INTERVAL) {
    return;
  }

  return fetchHotDetailsAsync(plateText);
}