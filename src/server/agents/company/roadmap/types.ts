export interface RoadmapRow {
  id: string;
  title: string;
  priority: string;
  status: string;
  phase: string;
  description: string;
  inspiration: string;
  raw: Record<string, string>;
}

export interface RoadmapDomain {
  rows: RoadmapRow[];
  notes: string;
}

export interface RoadmapContext {
  northStar: string | null;
  product: RoadmapDomain | null;
  marketing: RoadmapDomain | null;
  finance: RoadmapDomain | null;
}

export type RoadmapDomainKey = 'product' | 'marketing' | 'finance';

export interface RoadmapStatus {
  northStarLoaded: boolean;
  product: { loaded: boolean; activeRows: number; totalRows: number };
  marketing: { loaded: boolean; activeRows: number; totalRows: number };
  finance: { loaded: boolean; activeRows: number; totalRows: number };
}
