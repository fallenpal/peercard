# PeerCard Handoff

## Goal

PeerCard 是一个名片识别 Web 应用：拍照/上传名片 → AI 识别 → 编辑 → 导出 vCard/CSV → 云端名片夹。部署在 Vercel 上。

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Vercel Serverless Function (`api/recognize.ts`)
- **AI**: SiliconFlow API (Qwen2.5-VL-72B)，通过 `SILICONFLOW_API_KEY` 环境变量配置
- **Auth + DB**: Supabase（Email Auth + PostgreSQL + Storage）
- **本地缓存**: IndexedDB（联系人元数据 + 图片 Blob）
- **Repo**: github.com/fallenpal/peercard，push main 自动触发 Vercel 部署

## Supabase 配置

- **URL**: `VITE_SUPABASE_URL` 环境变量（Vercel + 本地）
- **Anon Key**: `VITE_SUPABASE_ANON_KEY` 环境变量
- **Email Auth**: 已关闭 email confirmation（`mailer_autoconfirm` 需为 true）
- **密码重置**: 需确认 Site URL 为 Vercel 域名，JWT expiry 建议设为 2592000（30天）
- **数据库表**: `contacts`（RLS 按 user_id 隔离）、`visits`（访问计数）
- **RPC**: `increment_visits()` 每次页面加载 +1
- **Storage**: `card-images` bucket（私有，RLS 按 userId 文件夹隔离）

## Current Progress

### V1 功能

1. **CORS preflight 修复** — OPTIONS 处理移到 method 检查之前
2. **前端图片压缩** — Canvas 缩放 1600px + JPEG 80% 质量
3. **PeerCard 标题可点击回首页**
4. **勾选导出** — checkbox + 全选/取消全选
5. **vCard 逐个导出** — 兼容 iOS Safari

### V2 功能

6. **名片夹** — 按日期分组的列表视图，左侧缩略图 + 右侧姓名/职位/公司
7. **名片详情页** — 原图 + 结构化字段（电话可拨打、邮箱可发送）+ 导出 vCard + 删除 + **编辑**
8. **搜索** — 名片夹顶部常驻搜索框，模糊匹配姓名/公司/职位/ASN/电话/邮箱/地址
9. **底部 Tab Bar** — 固定底部：拍照（直接调系统相机）、名片夹、关于
10. **用户认证** — Supabase Email Auth，邮箱+密码注册/登录，无需验证邮箱
11. **数据隔离** — 游客可体验全部识别/导出功能，名片夹需登录
12. **云端同步** — 名片数据存 Supabase Postgres，原图存 Storage，跨设备同步
13. **登录后补存** — 游客模式识别的名片，登录后自动补存到云端（App.tsx useEffect 监听 user.id）
14. **访问计数** — 页面加载时 increment，关于页展示
15. **关于页面** — 使用说明 + 版权 + 累计访问次数
16. **移除页脚** — 删掉底部 PeerCard / Peering CRM 文案
17. **本地缓存层** — IndexedDB 缓存联系人元数据 + 图片 Blob，名片夹秒开
18. **忘记密码** — 邮箱发送重置链接，点击回跳后弹出设置新密码表单
19. **Session 持久化** — 显式开启 autoRefreshToken + persistSession + detectSessionInUrl，配合 Supabase Dashboard JWT expiry 30 天
20. **ASN 字段** — 全链路支持（类型定义/编辑表单/识别预览弹窗/详情页/vCard X-ASN 扩展字段/CSV/搜索/云端存储），可选字段，由扫描者人工录入，不从名片识别
21. **名片详情页编辑** — 已保存名片可点击编辑按钮修改所有字段（含 ASN），保存后 upsert 到 Supabase
22. **中英双语 i18n** — `i18next` + `react-i18next` + `i18next-browser-languagedetector`，自动检测浏览器语言（zh→中文，其他→英文），右上角按钮手动切换，选择存 localStorage 刷新保持

## 认证流程（auth.tsx + AuthModal.tsx）

```
登录/注册：signIn / signUp → Supabase Email Auth
忘记密码：resetPasswordForEmail() → 发邮件含 redirectTo=origin/#reset-password
密码重置回调：App.tsx useEffect 检测 hash → 弹出 AuthModal(initialMode='reset')
设置新密码：updateUser({ password }) → 完成后自动关闭弹窗
Session 续期：Supabase SDK autoRefreshToken，JWT expiry 需在 Dashboard 设为 2592000（30天）
```

## 缓存架构（db.ts）

```
写入流程：saveContact()
  → 上传图片到 Supabase Storage
  → 同时缓存图片 Blob 到 IndexedDB (IMAGE_STORE)
  → upsert 联系人到 Supabase Postgres

读取流程：getAllContacts() / getContact()
  → CardBook: 先 getCachedContactList() 秒开，后台 getAllContacts() 刷新
  → 图片优先读 IndexedDB 缓存 Blob → miss 则从签名 URL 下载并缓存
  → 列表缩略图：Thumbnail 组件懒加载，缓存有就直接显示

删除流程：deleteContact()
  → 删 Supabase 数据 + Storage 文件 + IndexedDB 缓存

IndexedDB 数据库：peercard_cache_{userId}
  → CACHE_STORE: 联系人元数据（不含签名 URL）
  → IMAGE_STORE: 图片 Blob（key = contactId）
```

## What Worked

- Vercel Serverless Function 作为 API 代理，API Key 安全存储在服务端
- Canvas 压缩图片方案简单有效
- 逐个 vcf 下载方案兼容 iOS Safari
- Supabase 一站式解决 Auth + DB + Storage，免费 tier 够用
- Storage RLS 按 `userId/` 文件夹隔离，简单有效
- IndexedDB 缓存层：cache-first 策略，名片夹秒开，图片离线可用
- 登录后补存逻辑：useEffect 监听 user.id 变化，自动同步当前会话名片
- `resetPasswordForEmail` + hash 检测方案：无需后端路由，纯前端处理重置回调
- ASN 用 vCard `X-ASN` 自定义扩展字段，标准客户端不识别但不影响导入
- 详情页编辑复用 `saveContact()` 的 upsert 逻辑，不传 imageFile 就不会重新上传图片
- `i18next-browser-languagedetector` 检测顺序 localStorage → navigator，手动切换后自动记住
- 翻译 key 用扁平 namespace（`app.xxx`、`auth.xxx`、`field.xxx`），便于搜索定位

## What Didn't Work

- **单 vcf 含多联系人** — iOS 只导入第一个
- **JSZip 打包方案** — 用户体验差，已废弃
- **LinkedIn 官方 API 获取头像** — 不可行，已排除
- **SQL 直接插入 storage.buckets** — 被 RLS 拦截，需通过 Supabase Dashboard 手动创建 bucket
- **Supabase RPC `.catch()`** — TS 类型不支持，需用 `.then(() => {}, () => {})` 形式
- **仅云端存储无缓存** — 每次打开名片夹都要等签名 URL 加载图片，体验很差

## Key Files

| File | Role |
|------|------|
| `api/recognize.ts` | Serverless Function，代理 SiliconFlow Vision API |
| `src/App.tsx` | 主状态管理 + 视图路由 + AuthProvider + Tab Bar + 登录后补存逻辑 |
| `src/lib/supabase.ts` | Supabase client 初始化（含 auth 持久化配置） |
| `src/lib/i18n.ts` | i18next 初始化（语言检测 + 资源加载） |
| `src/locales/zh.json` | 中文翻译（~180+ key） |
| `src/locales/en.json` | 英文翻译 |
| `src/lib/auth.tsx` | AuthContext（user/signIn/signUp/signOut/resetPassword/updatePassword） |
| `src/lib/db.ts` | 数据层：Supabase 云端 CRUD + IndexedDB 缓存层 |
| `src/lib/recognize.ts` | 前端：图片压缩 + 调用后端 API |
| `src/lib/vcard.ts` | vCard 3.0 生成 + 文件下载 |
| `src/lib/csv.ts` | CSV 生成 |
| `src/types/contact.ts` | Contact / StoredContact / AppView 类型 |
| `src/components/CardBook.tsx` | 名片夹列表（cache-first + 懒加载缩略图） |
| `src/components/CardDetail.tsx` | 名片详情页（查看 + 编辑模式 + 缓存优先图片） |
| `src/components/AuthModal.tsx` | 登录/注册/忘记密码/重置密码弹窗 |
| `src/components/AboutPage.tsx` | 关于页面 |
| `src/components/ExportPanel.tsx` | 导出面板 + 逐个下载流程 |
| `src/components/CardQueue.tsx` | 名片网格 + checkbox |
| `src/components/RecognizePreview.tsx` | 识别完成预览弹窗 |
| `src/components/CardEditor.tsx` | 编辑视图（左图右表单） |
| `src/components/UploadZone.tsx` | 上传区（拖拽 + 相机 + 相册） |

## Supabase 数据库变更

- `contacts` 表需手动添加 `asn` 列：`ALTER TABLE contacts ADD COLUMN asn text DEFAULT '';`
- 其余字段见原始建表 SQL（id, user_id, name, organization, title, emails, phones, notes, url, address, image_path, created_at）

## Next Steps

以下方向供后续参考，优先级未定：
- 移动端体验优化（当前基本可用但未专门适配）
- 识别准确率提升（prompt 优化或换模型）
- 批量操作优化（批量删除、批量编辑）
- 联系人头像获取（LinkedIn 已排除，可考虑 Clearbit/People Data Labs）
- 测试用户清理（Supabase 中有 test-verify@peercard.dev 测试账号）
