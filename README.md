# Linux 命令大全 APK

基于开源项目 [jaywcjlove/linux-command](https://github.com/jaywcjlove/linux-command) 的 600+ Linux 命令手册，打包成完全离线的 Android 应用。打开 App 即可搜索使用，无需网络。

## 功能

- 617 个 Linux 命令完整文档，离线内置
- 按命令名 / 中文简介模糊搜索，结果高亮
- Markdown 详情渲染（语法、参数、示例）
- 深色模式自动跟随系统

## 自动更新

`.github/workflows/build-apk.yml` 会在每年 **2/5/8/11 月 1 日**（北京时间上午 11 点）自动拉取上游仓库最新数据：

- 上游命令数据有更新 → 自动重新打包 APK 并发布到 [Releases](../../releases)
- 上游无更新 → 跳过构建
- 也可以在 Actions 页面手动触发（可选强制构建）

想改检查频率：把 `build-apk.yml` 里的 cron 从 `2,5,8,11` 月改成 `1-12` 的子集即可，例如每月检查 `"0 3 1 1-12 *"`。

## 本地构建

```bash
# 1. 拉取上游数据、生成 web/app-data.js（需要 Node 18+ 和 tar）
node scripts/gen-data.mjs

# 2. 构建 APK（需要 JDK 17 和 Android SDK）
cd android
./gradlew assembleRelease
# 产物: android/app/build/outputs/apk/release/app-release.apk
```

签名使用仓库内的 `android/release-key.jks`（别名 `linuxcmd`，密码 `linuxcmd123`）。
⚠️ 该密钥仅用于个人测试分发，请勿用于正式发布；若仓库公开，任何拿到它的人都能签出伪装更新。
