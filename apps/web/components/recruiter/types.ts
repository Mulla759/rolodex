export interface RecruiterData {
  id: string;
  company: string;
  name: string | null;
  email: string;
  title: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  location: string | null;
  status: string | null;
  verifiedAt: Date | string | null;
  sourceDate: string | null;
  responseRate: string | null;
  avgReplyDays: number | null;
  studentsPlaced: number | null;
  accolades: string[] | null;
  roleTags: string[] | null;
  industryTags: string[] | null;
}
