import re
import os

filepath = r"c:\Users\ragha\.gemini\antigravity\scratch\website_builder\frontend\src\components\Builder.jsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Make a backup
with open(filepath + ".bak2", "w", encoding="utf-8") as f:
    f.write(content)

# 1. Remove Rows and Columns from compileToStaticHtml
def replace_compile_html(match):
    return """    let bodyHtml = '';
    targetLayout.forEach(sec => {
      let secStyles = '';
      if (sec.settings) {
        Object.keys(sec.settings).forEach(k => {
          if (k === 'containerWidth') return;
          let val = sec.settings[k];
          if (['paddingTop', 'paddingBottom', 'padding', 'margin'].includes(k) && !isNaN(val) && val !== '') val = `${val}px`;
          secStyles += `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${val}; `;
        });
      }
      const containerWidth = sec.settings?.containerWidth || '1200px';

      bodyHtml += `
        <section id="${sec.id}" style="position: relative; width: 100%; min-height: 400px; ${secStyles}">
          <div class="container" style="max-width: ${containerWidth}; height: 100%; position: relative;">
      `;

      (sec.elements || []).forEach(el => {
"""

content = re.sub(
    r"    let bodyHtml = '';\n    targetLayout\.forEach\(sec => \{.*?\(\(col\.elements \|\| \[\]\)\.forEach\(el => \{",
    replace_compile_html,
    content,
    flags=re.DOTALL
)

# Fix the closing tags for compileToStaticHtml
content = re.sub(
    r"              </div>\n            `;\n          \}\);\n\n          bodyHtml \+= `\n            </div>\n          `;\n        \}\);\n\n        bodyHtml \+= `\n          </div>\n        `;\n      \}\);\n\n      bodyHtml \+= `\n          </div>\n        </section>\n      `;\n    \}\);",
    r"""              </div>
            `;
      });

      bodyHtml += `
          </div>
        </section>
      `;
    });""",
    content
)

# 2. Fix updateSelectedElement
content = re.sub(
    r"    const nextLayout = activeLayout\.map\(sec => \(\{\n\s*\.\.\.sec,\n\s*rows: \(sec\.rows \|\| \[\]\)\.map\(row => \(\{\n\s*\.\.\.row,\n\s*columns: \(row\.columns \|\| \[\]\)\.map\(col => \(\{\n\s*\.\.\.col,\n\s*elements: \(col\.elements \|\| \[\]\)\.map\(el => \{",
    r"""    const nextLayout = activeLayout.map(sec => ({
      ...sec,
      elements: (sec.elements || []).map(el => {""",
    content
)
content = re.sub(
    r"            return el;\n\s*\}\)\n\s*\}\)\)\n\s*\}\)\)\n\s*\}\)\);",
    r"            return el;\n          })\n    }));",
    content
)

# 3. Fix handleMoveElement
content = re.sub(
    r"    const nextLayout = activeLayout\.map\(sec => \(\{\n\s*\.\.\.sec,\n\s*rows: \(sec\.rows \|\| \[\]\)\.map\(row => \(\{\n\s*\.\.\.row,\n\s*columns: \(row\.columns \|\| \[\]\)\.map\(col => \{\n\s*const els = col\.elements \|\| \[\];",
    r"""    const nextLayout = activeLayout.map(sec => {
      const els = sec.elements || [];""",
    content
)
content = re.sub(
    r"              return \{ \.\.\.col, elements: newEls \};\n\s*\}\n\s*\}\n\s*return col;\n\s*\}\)\n\s*\}\)\)\n\s*\}\)\);",
    r"              return { ...sec, elements: newEls };\n            }\n          }\n      return sec;\n    });",
    content
)

# 4. Fix handleDuplicateElement
content = re.sub(
    r"    const nextLayout = activeLayout\.map\(sec => \(\{\n\s*\.\.\.sec,\n\s*rows: \(sec\.rows \|\| \[\]\)\.map\(row => \(\{\n\s*\.\.\.row,\n\s*columns: \(row\.columns \|\| \[\]\)\.map\(col => \{\n\s*const els = col\.elements \|\| \[\];",
    r"""    const nextLayout = activeLayout.map(sec => {
      const els = sec.elements || [];""",
    content
)
content = re.sub(
    r"            return \{ \.\.\.col, elements: newEls \};\n\s*\}\n\s*return col;\n\s*\}\)\n\s*\}\)\)\n\s*\}\)\);",
    r"            return { ...sec, elements: newEls };\n          }\n      return sec;\n    });",
    content
)

# 5. Fix handleDeleteElement
content = re.sub(
    r"    const nextLayout = activeLayout\.map\(sec => \(\{\n\s*\.\.\.sec,\n\s*rows: \(sec\.rows \|\| \[\]\)\.map\(row => \(\{\n\s*\.\.\.row,\n\s*columns: \(row\.columns \|\| \[\]\)\.map\(col => \{\n\s*const els = col\.elements \|\| \[\];",
    r"""    const nextLayout = activeLayout.map(sec => {
      const els = sec.elements || [];""",
    content
)
content = re.sub(
    r"            if \(selectedElementId === elementId\) setSelectedElementId\(null\);\n\s*return \{ \.\.\.col, elements: newEls \};\n\s*\}\n\s*return col;\n\s*\}\)\n\s*\}\)\)\n\s*\}\)\);",
    r"            if (selectedElementIds.includes(elementId)) setSelectedElementIds(prev => prev.filter(id => id !== elementId));\n            return { ...sec, elements: newEls };\n          }\n      return sec;\n    });",
    content
)

# Write it back temporarily to see progress
with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Phase 1 refactor applied")
