# 宿舍报修系统

全栈宿舍报修管理系统，学生可提交报修，宿管可分配处理和查看统计。

## 技术栈

- **前端**: Vite + React 18 + TypeScript (端口 5173)
- **后端**: Express + TypeScript + better-sqlite3 (端口 3000)
- **认证**: JWT + bcryptjs
- **数据库**: SQLite (自动创建)

## 快速启动

```bash
# 1. 安装依赖
npm run install:all

# 2. 启动项目（前后端同时启动）
npm run dev
```

启动后访问 http://localhost:5173

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 学生 | test   | 123456 |
| 宿管 | admin  | 123456 |

## 功能说明

### 学生端
- 注册 / 登录
- 提交报修单（选宿舍楼、房间号、问题类型、描述、拍照上传）
- 查看个人报修记录和处理进度
- 进度状态：待受理 → 处理中 → 已修好
- 修好后可打分（1-5星）和写评价

### 宿管端
- 登录进入管理后台
- 查看所有报修单列表
- 按楼栋和状态筛选
- 查看报修详情和照片
- 分配维修员、添加处理意见、更新状态
- 数据统计：各楼栋报修量、平均评分、问题类型分布

## 目录结构

```
wje-123/
├── client/          # 前端 React 应用
│   ├── src/
│   │   ├── pages/   # 页面组件
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── api.ts
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── server/          # 后端 Express 应用
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── db.ts
│   │   ├── seed.ts
│   │   └── index.ts
│   └── package.json
└── package.json     # 根目录 concurrently
```
