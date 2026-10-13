import {
  BookOpen,
  FolderOpen,
  Gamepad2,
  Heart,
  House,
  Music,
  User,
  type LucideIcon,
} from "lucide-react";

/**
 * 栏目图标（导航与首页「我的栏目」共用）：
 * lucide-react 线性图标，统一 1.75 线宽渲染。
 */
export const SECTION_ICONS: Record<string, LucideIcon> = {
  "/": House,
  "/favorites": Heart,
  "/projects": FolderOpen,
  "/game": Gamepad2,
  "/music": Music,
  "/read": BookOpen,
  "/about": User,
};
