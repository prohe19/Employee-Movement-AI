import { api } from "./client";
import type {
  Announcement,
  DashboardSummary,
  ExtractionResult,
  MovementForm,
  NarrationResult,
  Paginated,
  Setting,
  Signatory,
  SignatoryResolution,
  Template,
  TransferForm,
  User,
  ValidationReport,
} from "./types";

// ---- Auth ----
export const authApi = {
  me: () => api.get<{ user: User }>("/auth/me"),
  login: (email: string, password: string) =>
    api.post<{ user: User }>("/auth/login", { email, password }),
  signup: (input: {
    fullName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => api.post<{ user: User }>("/auth/signup", input),
  google: (idToken: string) => api.post<{ user: User }>("/auth/google", { idToken }),
  logout: () => api.post<void>("/auth/logout"),
};

// ---- Forms ----
export const formsApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.upload<{ form: MovementForm }>("/forms", form);
  },
  extract: (id: string) => api.post<ExtractionResult>(`/forms/${id}/extract`),
  link: (id: string, announcementId: string) =>
    api.patch<{ form: MovementForm }>(`/forms/${id}`, { announcementId }),
};

// ---- Announcements ----
export interface AnnouncementFilters {
  movementType?: string;
  status?: string;
  company?: string;
  signatoryId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

function toQuery(filters: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== "") params.set(k, String(v));
  }
  const q = params.toString();
  return q ? `?${q}` : "";
}

function filtersToRecord(filters: AnnouncementFilters): Record<string, string | number | undefined> {
  return { ...filters };
}

export const announcementsApi = {
  list: (filters: AnnouncementFilters = {}) =>
    api.get<Paginated<Announcement>>(`/announcements${toQuery(filtersToRecord(filters))}`),
  get: (id: string) => api.get<{ announcement: Announcement }>(`/announcements/${id}`),
  create: (input: unknown) => api.post<{ announcement: Announcement }>("/announcements", input),
  update: (id: string, input: unknown) =>
    api.patch<{ announcement: Announcement }>(`/announcements/${id}`, input),
  remove: (id: string) => api.del<void>(`/announcements/${id}`),
  narrate: (id: string) => api.post<NarrationResult>(`/announcements/${id}/narrate`),
  resolveSignatory: (id: string) =>
    api.post<SignatoryResolution>(`/announcements/${id}/resolve-signatory`),
  validate: (id: string) => api.post<ValidationReport>(`/announcements/${id}/validate`),
  generatePdf: (id: string) =>
    api.post<{ announcement: Announcement }>(`/announcements/${id}/generate-pdf`),
  generateEmail: (id: string) =>
    api.post<{ announcement: Announcement }>(`/announcements/${id}/generate-email`),
  uploadPhoto: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.upload<{ url: string; key: string }>("/announcements/photo", form);
  },
};

// ---- Transfer Forms ----
export const transferFormsApi = {
  list: (search?: string) =>
    api.get<{ forms: TransferForm[] }>(`/transfer-forms${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  get: (id: string) => api.get<{ form: TransferForm }>(`/transfer-forms/${id}`),
  create: (input: unknown) => api.post<{ form: TransferForm }>("/transfer-forms", input),
  update: (id: string, input: unknown) => api.patch<{ form: TransferForm }>(`/transfer-forms/${id}`, input),
  remove: (id: string) => api.del<void>(`/transfer-forms/${id}`),
  generatePdf: (id: string) => api.post<{ form: TransferForm }>(`/transfer-forms/${id}/generate-pdf`),
};

// ---- Templates / Signatories / Settings / Dashboard ----
export const templatesApi = {
  list: () => api.get<{ templates: Template[] }>("/templates"),
  create: (input: unknown) => api.post<{ template: Template }>("/templates", input),
  update: (id: string, input: unknown) => api.patch<{ template: Template }>(`/templates/${id}`, input),
};

export const signatoriesApi = {
  list: () => api.get<{ signatories: Signatory[] }>("/signatories"),
  create: (input: unknown) => api.post<{ signatory: Signatory }>("/signatories", input),
  update: (id: string, input: unknown) =>
    api.patch<{ signatory: Signatory }>(`/signatories/${id}`, input),
};

export const settingsApi = {
  get: () => api.get<{ settings: Setting }>("/settings"),
  update: (input: unknown) => api.patch<{ settings: Setting }>("/settings", input),
};

export const dashboardApi = {
  summary: () => api.get<DashboardSummary>("/dashboard/summary"),
};
