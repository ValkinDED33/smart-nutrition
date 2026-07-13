import {
  BookOpen,
  BarChart3,
  Bot,
  ShieldCheck,
  Utensils,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@domain/user/types";
import { canAccessAdminCenter } from "@domain/user/roles";

type NavigationAccess = "authenticated" | "adminCenter";

export interface AppNavigationItem {
  value: string;
  labelKey: string;
  access: NavigationAccess;
  icon?: LucideIcon;
}

export const desktopNavigationItems: AppNavigationItem[] = [
  { value: "/dashboard", labelKey: "navigation.dashboard", access: "authenticated" },
  { value: "/meals", labelKey: "navigation.food", access: "authenticated" },
  { value: "/recipes", labelKey: "navigation.recipes", access: "authenticated" },
  { value: "/coach", labelKey: "navigation.coach", access: "authenticated" },
  { value: "/community", labelKey: "navigation.community", access: "authenticated" },
  { value: "/progress", labelKey: "navigation.progress", access: "authenticated" },
  { value: "/profile", labelKey: "navigation.profile", access: "authenticated" },
  { value: "/admin", labelKey: "navigation.admin", access: "adminCenter" },
];

export const mobileNavigationItems: AppNavigationItem[] = [
  {
    value: "/meals",
    labelKey: "navigation.food",
    access: "authenticated",
    icon: Utensils,
  },
  {
    value: "/recipes",
    labelKey: "navigation.recipes",
    access: "authenticated",
    icon: BookOpen,
  },
  {
    value: "/coach",
    labelKey: "navigation.coach",
    access: "authenticated",
    icon: Bot,
  },
  {
    value: "/community",
    labelKey: "navigation.community",
    access: "authenticated",
    icon: UsersRound,
  },
  {
    value: "/progress",
    labelKey: "navigation.progress",
    access: "authenticated",
    icon: BarChart3,
  },
  {
    value: "/profile",
    labelKey: "navigation.profile",
    access: "authenticated",
    icon: UserRound,
  },
  {
    value: "/admin",
    labelKey: "navigation.admin",
    access: "adminCenter",
    icon: ShieldCheck,
  },
];

export const adminRouteRoles: UserRole[] = [
  "HELPER",
  "NUTRITIONIST",
  "MODERATOR",
  "ADMIN",
  "OWNER",
  "SUPER_ADMIN",
];

const canAccessNavigationItem = (
  item: AppNavigationItem,
  role: UserRole | null | undefined
) => item.access === "authenticated" || canAccessAdminCenter(role);

export const getVisibleNavigationItems = (
  items: AppNavigationItem[],
  role: UserRole | null | undefined
) => items.filter((item) => canAccessNavigationItem(item, role));
