/** 全局共享常量（务必保持无 Node 依赖，proxy 也要引用） */

/** 登录会话 Cookie 名 */
export const SESSION_COOKIE_NAME = "newblog_session";

/** 会话有效期（天，PRD 3.3.1 建议 7 天） */
export const SESSION_TTL_DAYS = 7;

/** 登录失败上限与锁定时长（分钟，PRD 3.3.1 推荐） */
export const LOGIN_MAX_FAILURES = 5;
export const LOGIN_LOCK_MINUTES = 10;

/** 列表分页大小（PRD 3.2.1 / 3.3.3） */
export const SITE_POSTS_PER_PAGE = 9;
export const ADMIN_POSTS_PER_PAGE = 10;

/** 仪表盘「最近文章」条数（PRD 3.3.2） */
export const RECENT_POSTS_LIMIT = 5;

/** 字段长度限制（PRD 3.3.3 字段规则） */
export const TITLE_MAX_LENGTH = 100;
export const SUMMARY_MAX_LENGTH = 200;
export const CONTENT_MAX_LENGTH = 50_000;
export const COVER_IMAGE_MAX_LENGTH = 500;

/** 摘要自动截取长度（PRD：留空时前台自动截取正文前 100 字） */
export const AUTO_SUMMARY_LENGTH = 100;
