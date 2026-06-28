from part1_writer import p1
from part2_writer import p2
from part3_writer import p3

filepath = r"c:\Users\ragha\.gemini\antigravity\scratch\website_builder\frontend\src\components\Builder.jsx"

with open(filepath, "w", encoding="utf-8") as f:
    f.write(p1 + p2 + p3)

print("Successfully wrote Builder.jsx")
