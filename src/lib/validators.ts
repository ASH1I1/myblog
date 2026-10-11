import { z } from "zod";
import {
  CONTENT_MAX_LENGTH,
  COVER_IMAGE_MAX_LENGTH,
  SUMMARY_MAX_LENGTH,
  TITLE_MAX_LENGTH,
} from "./constants";

/** 登录表单（PRD 3.3.1：两项必填） */
export const loginSchema = z.object({
  username: z.string().trim().min(1).max(50),
  password: z.string().min(1).max(100),
});

/** 文章表单（PRD 3.3.3 字段规则） */
export const postFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "标题不能为空")
    .max(TITLE_MAX_LENGTH, `标题不能超过 ${TITLE_MAX_LENGTH} 字`),
  summary: z
    .string()
    .trim()
    .max(SUMMARY_MAX_LENGTH, `摘要不能超过 ${SUMMARY_MAX_LENGTH} 字`),
  content: z
    .string()
    .trim()
    .min(1, "正文不能为空")
    .max(CONTENT_MAX_LENGTH, `正文不能超过 ${CONTENT_MAX_LENGTH} 字`),
  coverImage: z
    .string()
    .trim()
    .max(COVER_IMAGE_MAX_LENGTH, `封面图链接不能超过 ${COVER_IMAGE_MAX_LENGTH} 字符`)
    .refine(
      (value) => value === "" || /^(https?:\/\/|\/)/.test(value),
      "封面图需要是 http(s):// 或 / 开头的链接",
    ),
  status: z.enum(["draft", "published"]),
});

export type PostFormInput = z.infer<typeof postFormSchema>;
