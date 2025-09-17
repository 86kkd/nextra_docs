# Arch Linux 回退 cursor-bin 多种方法与排错

> 场景：你已有多个旧版 `cursor-bin` 的 `.pkg.tar.zst` 包与 `.AppImage` 文件，想要快速回退或在多个版本间切换。

## 方法一：直接用本地 `.pkg.tar.zst` 安装（最稳妥）

在存放旧包的目录执行（替换为你的文件名）：

```bash
sudo pacman -U ./cursor-bin-1.5.9-18-x86_64.pkg.tar.zst
```

- 会覆盖当前已安装版本，实现“回退”。
- 若不想被系统升级覆盖，编辑 `/etc/pacman.conf`，在 `[options]` 下设置：

```ini
IgnorePkg = cursor-bin
```

之后执行 `sudo pacman -Syu` 时不会升级 `cursor-bin`。

> 你也可以将多个包名放在一行：`IgnorePkg = portable cursor-bin`
> 表示同时忽略 `portable` 与 `cursor-bin` 两个包的升级。

## 方法二：使用 downgrade（配合本地/缓存）

`downgrade` 默认只查官方仓库历史（ALA）与 pacman 缓存，不含 AUR 包。`cursor-bin` 来自 AUR/archlinuxcn，直接 `sudo downgrade cursor-bin` 可能提示 `No results found`。

安装：

```bash
sudo pacman -S downgrade
```

注意：该脚本的参数不接受等号形式（例如 `--pacman-cache=...`），必须用空格分隔（写作 `--pacman-cache 路径`，`--maxdepth 1`）。如果你已经在 `~/.cache/yay/cursor-bin` 目录，可以直接把当前目录当作缓存。

常用用法（让它在你的本地目录或 AUR helper 缓存里找包）：

- 在含有 `.pkg.tar.zst` 的目录下：

```bash
sudo downgrade --cached-only --pacman-cache "$PWD" --maxdepth 1 cursor-bin
```

- 如果你使用 `yay`/`paru`，它们的缓存常见路径：

```bash
# yay	
sudo downgrade --cached-only --pacman-cache "$HOME/.cache/yay/cursor-bin" cursor-bin

# paru	
sudo downgrade --cached-only --pacman-cache "$HOME/.cache/paru/clone/cursor-bin" cursor-bin
```

- 或者把本地包放进 pacman 缓存再使用：

```bash
sudo cp ./cursor-bin-1.5.9-18-x86_64.pkg.tar.zst /var/cache/pacman/pkg/
sudo downgrade --cached-only cursor-bin
```

可选：让 `downgrade` 自动把已回退的包加入 `IgnorePkg`（免被下次升级覆盖）：

```bash
sudo downgrade --ignore always cursor-bin
```

## 方法三：直接运行 `.AppImage`（不改系统安装）

```bash
chmod +x ./cursor-bin-1.5.9.AppImage
./cursor-bin-1.5.9.AppImage
```

- 优点：与系统包管理不冲突，适合临时测试旧版本。
- 缺点：不会自动集成系统菜单；如需菜单项，需额外放置 `.desktop` 文件并处理图标、权限等。

## 常见问题与排错

- `sudo downgrade cursor-bin` 提示 `No results found`
  - 原因：`cursor-bin` 属于 AUR/archlinuxcn，`downgrade` 默认查不到；或参数用成了等号形式（例如 `--pacman-cache=...`）。
  - 解决：使用 `--cached-only` 并指定 `--pacman-cache 路径`（空格分隔），指向你本地存包目录；或把包复制到 `/var/cache/pacman/pkg` 再运行。

- 忽略更新写法
  - 单个：`IgnorePkg = cursor-bin`
  - 多个：`IgnorePkg = portable cursor-bin`
  - 含义：这些包在 `sudo pacman -Syu` 时会被跳过，需要你手动 `pacman -U` 指定版本。

- 允许后续恢复升级
  - 手动编辑 `/etc/pacman.conf`，从 `IgnorePkg` 移除 `cursor-bin`；或
  - 使用 `downgrade --unignore` 移除忽略。

## 推荐策略

- 短期测试：直接 `.AppImage` 运行。
- 长期稳定回退：方法一或方法二，并在 `IgnorePkg` 锁定版本。

---

需要的话，我可以提供一个小脚本，自动枚举你目录中的 `.pkg.tar.zst`，让你交互选择并一键回退（兼容加入/移除 `IgnorePkg`）。
