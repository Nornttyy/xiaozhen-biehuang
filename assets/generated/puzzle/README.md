# 美少女消消乐头像素材

- 模式：内置图片生成工具（非 CLI）。
- 成品：`assets/generated/puzzle/heroine-portraits-v1.png`，768×768 PNG，保留透明通道。
- 排列：2×2；左上小暖（火）、右上小雪（冰）、左下星铃（雷）、右下叶叶（自然）。
- 用途：静态头像卡面；由 Canvas 按四个等尺寸区域读取。战斗动作继续使用独立骨骼部件。
- 原始生成图保留在 Codex generated_images，项目版仅等比缩小，以减轻网页和微信包负担。
- 美术约束：二次元平涂、清晰线条、硬边阴影，禁止写实纹理和 PBR。

## 最终生成提示词

```text
Use case: stylized-concept.
Asset type: one production UI portrait atlas for a 2D anime match-puzzle game, four equal square portraits in an exact 2 by 2 grid, no gaps, 1024 by 1024 total.
Primary request: Four original charming adult anime heroines, each distinct and recognizable when cropped into a square game card. Head and shoulders only, face centered in each quadrant with comfortable margin around all hair. Each heroine looks toward the viewer with a friendly confident expression.
Top left (fire): peach-pink long hair, coral ribbon with a tiny flame pin, warm amber eyes, red and ivory adventurer jacket with high collar, peach flat background.
Top right (ice): silver-blue bob hair with a snowflake clip, blue eyes, powder-blue and white high-collar magical cloak, ice-blue flat background.
Bottom left (lightning): lavender twin-tail hair, small golden star clips, violet eyes, purple and white fantasy uniform, pale lilac flat background.
Bottom right (nature): chestnut braided hair with a leaf pin, green eyes, mint-green and ivory ranger tunic, soft mint flat background.
Style: polished Japanese anime cel animation key art, crisp dark colored outlines, flat solid colors with only one hard-edged shadow tier, simple graphic hair highlights. Wholesome casual puzzle-game character art. Attractive adult women, no chibi toddler proportions.
Constraints: each cell contains exactly one complete centered portrait, no overlap between cells. No lettering, text, logos, borders, UI buttons, watermarks, weapons, extra characters or background scenery.
Strict avoid: all photorealism, PBR, realistic material textures, fabric texture, leather grain, metal sheen, skin pores, subsurface scattering, volumetric light, 3D rendering, painterly brush texture.
```
