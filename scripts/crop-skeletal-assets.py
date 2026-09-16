from pathlib import Path

from PIL import Image
from PIL import ImageDraw


SHEETS = (
    (
        "assets/generated/ranger/atlas-anime-v2.png",
        (
            "head",
            "hair_back",
            "hair_front",
            "torso",
            "arm_rear_upper",
            "arm_rear_lower",
            "arm_front_upper",
            "arm_front_lower",
            "leg_rear_upper",
            "leg_rear_lower",
            "leg_front_upper",
            "leg_front_lower",
            "bow",
            "quiver",
            "cape",
            "arrow_fx",
        ),
    ),
    (
        "assets/generated/slime/atlas-anime-v2.png",
        (
            "body",
            "face",
            "horn_left",
            "horn_right",
            "arm_left",
            "arm_right",
            "core",
            "shadow",
        ),
    ),
)

CELL_SIZE = 256
COLUMNS = 4


def clean_cell(cell: Image.Image) -> Image.Image:
    """Remove neighboring-cell bleed while preserving antialiased part edges."""
    alpha = cell.getchannel("A")
    draw = ImageDraw.Draw(alpha)
    border = 4
    draw.rectangle((0, 0, CELL_SIZE - 1, border - 1), fill=0)
    draw.rectangle((0, CELL_SIZE - border, CELL_SIZE - 1, CELL_SIZE - 1), fill=0)
    draw.rectangle((0, 0, border - 1, CELL_SIZE - 1), fill=0)
    draw.rectangle((CELL_SIZE - border, 0, CELL_SIZE - 1, CELL_SIZE - 1), fill=0)
    alpha = alpha.point(lambda value: 0 if value < 24 else value)
    cell.putalpha(alpha)
    return cell


for source_name, part_names in SHEETS:
    source = Path(source_name)
    image = Image.open(source).convert("RGBA")
    output = source.parent / "parts"
    output.mkdir(parents=True, exist_ok=True)
    for index, part_name in enumerate(part_names):
        x = index % COLUMNS * CELL_SIZE
        y = index // COLUMNS * CELL_SIZE
        box = (x, y, x + CELL_SIZE, y + CELL_SIZE)
        clean_cell(image.crop(box)).save(output / f"{part_name}.png", optimize=True)

print(f"cropped {sum(len(names) for _, names in SHEETS)} skeletal parts")
