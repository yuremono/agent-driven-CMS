---
description: 
alwaysApply: false
---

# Scripts

## picsum 画像の取得

`public/images/picsum/{seq}.jpg` に保存されるローカル画像を取得します。

### 使い方

```bash
./scripts/download-image.sh
./scripts/download-image.sh 600 400
./scripts/download-image.sh landscape
```

### よく使う比率

- `./scripts/download-image-square.sh` - 1:1
- `./scripts/download-image-portrait.sh` - 4:5
- `./scripts/download-image-landscape.sh` - 3:2
- `./scripts/download-image-wide.sh` - 16:10
- `./scripts/download-image-banner.sh` - 21:9

### 保存先

`public/images/picsum/{seq}.jpg`
