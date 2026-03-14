import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type { recruiters, studentSaves, recruiterTeams } from "./schema";

// ─── Select types (what comes OUT of the DB) ──
export type Recruiter = InferSelectModel<typeof recruiters>;
export type StudentSave = InferSelectModel<typeof studentSaves>;
export type RecruiterTeam = InferSelectModel<typeof recruiterTeams>;

// ─── Insert types (what goes IN to the DB) ────
export type NewRecruiter = InferInsertModel<typeof recruiters>;
export type NewStudentSave = InferInsertModel<typeof studentSaves>;
export type NewRecruiterTeam = InferInsertModel<typeof recruiterTeams>;

// ─── Response shape (uses Recruiter from drizzle) ──
export interface RecruiterListResponse {
  data: Recruiter[];
  count: number;
  page: number;
  totalPages: number;
}

// Re-export domain types and constants so server code
// can still import everything from "@rolodex/db/types"
export {
  type RecruiterStatus,
  type Accolade,
  type RoleTag,
  type IndustryTag,
  type RecruiterSearchParams,
  ACCOLADE_LABELS,
} from "./constants";
