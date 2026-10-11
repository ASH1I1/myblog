# NewBlog 个人博客

一个个人博客系统：用户端（首页 / 文章详情 / 关于我）+ 博主管理后台（登录 / 仪表盘 / 文章管理）。

## 技术栈

- **Next.js 16**（App Router、Cache Components）+ TypeScript
- **Tailwind CSS v4**（移动优先，断点对齐 PRD：768 / 1024）
- **SQLite**（better-sqlite3 + Drizzle ORM，数据库即 `data/blog.db` 单文件）
- **bcryptjs** 密码哈希 + 自管理 Session（httpOnly Cookie，7 天）
- **react-markdown** 渲染文章正文（默认不执行原始 HTML，防 XSS）

## 环境要求

- Node.js ≥ 20.9（当前开发环境为 24.x，已验证）

## 本地开发

```bash
npm install       # 安装依赖
npm run db:setup  # 初始化数据库 + 写入默认管理员和示例文章（仅首次需要）
npm run dev       # 启动开发服务器 http://localhost:3000
```

其他命令：

```bash
npm run build     # 生产构建
npm run start     # 启动生产服务
npm run lint      # ESLint 检查
npm run db:seed   # 重新执行种子（会用 .env 覆盖更新管理员密码）
```

> 应用启动时会自动应用数据库迁移（幂等），日常开发无需手工建表；
> `db:setup` 只在首次初始化（或需要重置示例数据）时执行。

## 环境变量（.env，参考 .env.example）

| 变量 | 说明 |
| --- | --- |
| `DATABASE_PATH` | SQLite 数据库文件路径，默认 `./data/blog.db` |
| `ADMIN_USERNAME` | 初始管理员账号（仅首次 seed 时使用） |
| `ADMIN_PASSWORD` | 初始管理员密码（仅首次 seed 时使用） |

## 管理员账号

- 首次执行 `npm run db:seed` 时，会用 `.env` 里的 `ADMIN_USERNAME` / `ADMIN_PASSWORD` 创建管理员（密码以 bcrypt 哈希存储，不存明文）。
- **修改密码**：修改 `.env` 后重新执行 `npm run db:seed` 即可覆盖更新。
- 后台入口：`/admin/login`
- ⚠️ `.env` 不进版本库（占位值见 `.env.example`）。**请自己设一个足够强的 `ADMIN_PASSWORD`**，别沿用示例里的占位串——后台只有这一道密码。

## 文档

- 需求文档：`doc/PRD.md`
- 技术方案：`doc/tech.md`
- 实施计划：`memory-back/plan.md`
