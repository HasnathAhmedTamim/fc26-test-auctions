export type AppRole = "admin" | "manager";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
};