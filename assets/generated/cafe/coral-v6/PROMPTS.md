# v6 内置图片生成记录

使用内置 `image_gen`，分别生成身体与头部图集，再用系统 `sips` 按实测包围框机械裁切为 28 个独立透明 PNG。不使用均匀网格裁切，不改写图像内容。

输出：`body-atlas-v6.png`、`head-atlas-v6.png` 和 `parts/*.png`。

原始生成图带有少量透明边缘杂点；独立导出不等于已清理所有彩边。所有关节、表情层仍需在组装中验证。

## 身体图集

```text
Use case: precise-object-edit.
Input: reference/edit target is an ADULT anime cafe employee atlas. Rebuild the BODY CUTOUTS ONLY with much finer separation for actual skeletal animation. Keep her coral-and-cream uniform, modest covered adult torso, small apron, skin tone and flat cel highlights, warm charcoal sheer-look stockings over opaque skin, dark ankle-strap shoes. No redesign, no change to clothing coverage. Keep the same flat anime style; NO realistic textures or 3D.
Output ONE body sprite atlas, 1536 x 1536 square, transparent alpha. EXACTLY FOUR equal columns by FOUR equal rows, 16 isolated pieces. One centered piece per cell, ample empty margins, no touching, no labels, no grid, no assembled character, no head.
EXACT cell order:
ROW 1: (1) TORSO from neck to waist, blouse only, no skirt/head/arms; (2) SKIRT AND APRON together as one separate clothing piece, no torso or legs; (3) LEFT UPPER ARM from shoulder to elbow ONLY; (4) RIGHT UPPER ARM from shoulder to elbow ONLY.
ROW 2: (1) LEFT FOREARM elbow to wrist ONLY, ABSOLUTELY NO HAND OR FINGERS; (2) RIGHT FOREARM elbow to wrist ONLY, NO HAND; (3) LEFT HAND from wrist to fingertips ONLY, NO FOREARM; (4) RIGHT HAND from wrist to fingertips ONLY, NO FOREARM.
ROW 3: (1) LEFT THIGH upper thigh to knee ONLY, no calf or foot; (2) RIGHT THIGH upper thigh to knee ONLY, no calf or foot; (3) LEFT CALF knee to ankle ONLY, stocking ends at round ankle joint, ABSOLUTELY NO FOOT OR SHOE; (4) RIGHT CALF knee to ankle ONLY, NO FOOT OR SHOE.
ROW 4: (1) LEFT FOOT WITH SHOE ONLY, ankle to toe, no calf; (2) RIGHT FOOT WITH SHOE ONLY, ankle to toe, no calf; (3) round serving tray; (4) coral coffee cup.
LEFT/RIGHT mean screen-left/screen-right in a neutral frontal pose.
CRITICAL: no entire arm in any cell, no entire leg in any cell. Wrists, elbows, knees, ankles are all real separated sprite edges. Draw only rounded flat-color joint overlap caps, no literal cylindrical stump faces, no joint-circle outlines. Match stocking fill across knee and ankle caps.
Keep every cutout centered inside its cell, with at least 30px empty padding. Actual transparent background with clean alpha, completely remove stray colored speckles. All sprite interiors opaque, including skin under sheer-look stockings. No black/white backdrop, checkerboard, watermark, text or cast shadows.
```

## 头发与表情图集

```text
Use case: stylized-concept.
Asset type: a HEAD, HAIR AND FACIAL-EXPRESSION LAYER ATLAS for the supplied clearly ADULT anime cafe employee, age 26. The supplied image is a STYLE AND IDENTITY REFERENCE ONLY: use her coral-pink bob hair, ribbon accent, warm brown eyes, peach skin and flat cel highlights. This output contains NO body, NO clothing, NO limbs.
Primary request: make her face feel cuter in a friendly, cheerful, approachable ADULT way: soft warm almond-shaped eyes, gentle brows, a subtle blush and a natural smile. Keep an adult oval face and normal adult feature proportions, not chibi, not baby-faced, not a child or teenager. Do not change hair color or general bob haircut.
Critical production requirement: face, HAIR, EYES, EYEBROWS and MOUTH MUST ALL BE SEPARATE OVERLAY SPRITES. NEVER draw an assembled complete face or completed head anywhere in this output.
Canvas: square 1536 x 1536 transparent PNG, EXACTLY FOUR equal columns and THREE equal rows. One isolated sprite or one expression-pair in each cell, centered, no labels, no grid, no extra objects, no overlap between cells. At least 40px transparent padding around every cutout.
Exact 12 cells, reading left to right:
ROW 1:
1. FACE BASE ONLY: adult front-facing oval head skin silhouette with ears, tiny nose, subtle cheek blush and small neck. NO HAIR, NO EYES, NO EYEBROWS, NO MOUTH. Leave those areas as uninterrupted skin ready for overlay sprites.
2. BACK HAIR ONLY: full coral-pink bob rear-hair mass and crown behind the face, no skin or facial features.
3. LEFT SIDE HAIR ONLY: isolated coral-pink side lock that frames the left cheek, no skin.
4. RIGHT SIDE HAIR ONLY: isolated coral-pink side lock that frames the right cheek with her small coral ribbon, no skin.
ROW 2:
1. BANGS / FRINGE ONLY: isolated front coral-pink bangs for the forehead, no scalp or skin or face.
2. PAIR OF OPEN EYES ONLY: warm brown adult almond-shaped anime eyes with eyelashes, no brows, no surrounding face skin.
3. PAIR OF CLOSED EYES ONLY: gentle smiling closed eyelash arcs, no brows, no surrounding skin.
4. PAIR OF NEUTRAL EYEBROWS ONLY: slim soft brown eyebrows, no eyes or skin.
ROW 3:
1. PAIR OF HAPPY EYEBROWS ONLY: gently lifted warm eyebrows, no eyes or skin.
2. SMALL SMILING MOUTH ONLY: a natural friendly curved smile, no face or chin.
3. TALKING MOUTH ONLY: a small open smiling mouth, no face or chin.
4. NEUTRAL MOUTH ONLY: a small relaxed mouth line, no face or chin.
The open and closed eye pairs share identical eye-center spacing and alignment for swapping. Eyebrow pairs share the same spacing. All mouth shapes use one consistent center and compatible size.
Style: 2D Japanese anime, crisp lines and flat cel fills, subtle small graphic highlights only. Absolutely NO realistic skin, NO photoreal texture, NO 3D/PBR. Genuine transparent alpha outside all sprites, clean silhouettes without colored speckles, no checkerboard or colored background.
```
