# dsh-backup-btn

> DSH 一键备份按钮 - 浮动按钮一键备份 DSH 数据到 GitHub Gist

![screenshot](./screenshot.png)

## 功能

- 🔘 右下角浮动备份按钮（Material Design FAB 风格）
- 💾 一键备份 DSH 数据（localStorage、会话配置等）
- ☁️ 备份到 GitHub Gist（私有 Gist，安全可控）
- 🔧 首次使用引导配置（Token + Gist ID）
- 🚀 零依赖，独立运行，不需要 dshmarket

## 安装

### 方式 1：从 GitHub 安装（推荐）

```bash
dsh plugin --profile web add github:faye0526/dsh-backup-btn
```

### 方式 2：从本地安装

```bash
git clone https://github.com/faye0526/dsh-backup-btn.git ~/.dsh/plugins/dsh-backup-btn
dsh plugin --profile web add link:../../plugins/dsh-backup-btn
```

### 方式 3：从 npm 安装（发布后可用）

```bash
dsh plugin --profile web add @faye0526/dsh-backup-btn
```

## 使用

1. 安装后**重启 DSH Desktop** 或运行 `dsh web`
2. 右下角出现紫色浮动按钮
3. 首次点击弹出配置向导：
   - **GitHub Token**：需要 `gist` 权限，[点击创建](https://github.com/settings/tokens/new?scopes=gist&description=DSH%20Backup)
   - **Gist ID**：留空自动创建新 Gist，或填写已有 Gist ID
4. 配置完成后，点击按钮即可备份
5. 备份成功后按钮变绿 ✓，Gist ID 显示在 toast 中

## 数据说明

备份内容包括：
- DSH localStorage 数据（排除敏感 token/key）
- 备份时间戳
- 插件版本号

**不备份**：
- GitHub Token（仅用于 API 认证）
- API Keys
- 其他敏感配置

## 常见问题

### Q: 为什么不用 dshmarket 的备份功能？

A: dshmarket 是可选依赖，部分用户不装 dshmarket。本插件内置 GitHub Gist API，零外部依赖，任何人装了就能用。

### Q: 备份数据存在哪里？

A: 存在你的 GitHub Gist（私有），只有你能看到。Gist ID 和 Token 存在浏览器 localStorage。

### Q: 如何更换 Gist？

A: 清除浏览器 localStorage 中的 `dsh-backup-config` 键，重新配置即可。

### Q: 支持自动备份吗？

A: 当前版本仅支持手动备份。自动备份功能计划中（通过 DSH 定时任务实现）。

## 技术细节

- **Client 插件结构**：`client.js` 经 `__ModuleLoader__.load` 注册，DSH 自动注入
- **GitHub Gist API**：使用 `fetch` 直接调用 REST API（POST/ PATCH）
- **配置存储**：浏览器 localStorage（未来支持 `.credentials.yaml`）
- **无构建步骤**：纯原生 JS，无需 webpack/rollup

## 开发

```bash
# 克隆仓库
git clone https://github.com/faye0526/dsh-backup-btn.git
cd dsh-backup-btn

# 链接到 DSH 插件目录
ln -s $(pwd) ~/.dsh/plugins/dsh-backup-btn

# 安装到 profile
dsh plugin --profile web add link:../../plugins/dsh-backup-btn

# 验证
dsh --profile web --dump-config | grep dsh-backup-btn
```

## License

MIT © 2026 faye0526

## 致谢

- DSH 团队提供的 `__ModuleLoader__.load` 机制
- dshmarket 插件提供的灵感
