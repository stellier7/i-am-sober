export interface Tracker {
  id: string;
  substance: string;
  label: string | null;
  sober_since: string;
  reasons: string[];
}

export interface TrackerEntry {
  tracker_id: string;
  pledged: boolean;
  note: string | null;
}
