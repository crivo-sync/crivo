export type ProfileRole = "ADMIN" | "STAFF";

export type Profile = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: ProfileRole;
  isActive: boolean;
  createdAt: string;
};

export type ActionResult<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; data?: undefined };
