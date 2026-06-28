import sys
import re

def find_block(text, start_pattern):
    match = re.search(start_pattern, text)
    if not match:
        return -1, -1
    
    start_idx = match.start()
    
    # Find the first '{' after start_idx
    brace_idx = text.find('{', start_idx)
    if brace_idx == -1:
        return -1, -1
        
    open_braces = 1
    idx = brace_idx + 1
    in_string = False
    string_char = ''
    in_escape = False
    
    while idx < len(text) and open_braces > 0:
        c = text[idx]
        
        if in_escape:
            in_escape = False
        elif c == '\\':
            in_escape = True
        elif in_string:
            if c == string_char:
                in_string = False
        else:
            if c in '"\'`':
                in_string = True
                string_char = c
            elif c == '{':
                open_braces += 1
            elif c == '}':
                open_braces -= 1
                
        idx += 1
        
    if open_braces == 0:
        return start_idx, idx
    return -1, -1

with open(r"src\components\Builder_original.jsx", "r", encoding="utf-16") as f:
    content = f.read()

# REPLACEMENTS
replacements = []

rep1 = """  const getSelectedElement = () => {
    if (!selectedElementId) return null;
    for (let sec of activeLayout) {
      for (let el of sec.elements || []) {
        if (el.id === selectedElementId) return el;
      }
    }
    return null;
  };"""
replacements.append((r"const getSelectedElement = \(\) => \{", rep1))

rep2 = """  const updateSelectedElement = (updates) => {
    const nextLayout = activeLayout.map(sec => ({
      ...sec,
      elements: (sec.elements || []).map(el => {
        if (el.id === selectedElementId) {
          return {
            ...el,
            content: { ...el.content, ...(updates.content || {}) },
            styles: { ...el.styles, ...(updates.styles || {}) },
            animation: { ...el.animation, ...(updates.animation || {}) },
            action: { ...el.action, ...(updates.action || {}) },
            hoverStyles: { ...el.hoverStyles, ...(updates.hoverStyles || {}) }
          };
        }
        return el;
      })
    }));
    updateLayout(nextLayout);
  };"""
replacements.append((r"const updateSelectedElement = \(updates\) => \{", rep2))

rep3 = """  const handleLayerElement = (elementId, direction) => {
    let updated = false;
    const nextLayout = activeLayout.map(sec => {
      const els = [...(sec.elements || [])];
      const idx = els.findIndex(e => e.id === elementId);
      if (idx !== -1) {
        const newIdx = direction === 'forward' ? idx + 1 : idx - 1;
        if (newIdx >= 0 && newIdx < els.length) {
          const temp = els[idx];
          els[idx] = els[newIdx];
          els[newIdx] = temp;
          updated = true;
        }
      }
      return { ...sec, elements: els };
    });
    if (updated) updateLayout(nextLayout);
  };
  
  const handleMoveElement = (elementId, direction) => {
    handleLayerElement(elementId, direction === 'up' ? 'backward' : 'forward');
  };"""
replacements.append((r"const handleMoveElement = \(elementId, direction\) => \{", rep3))

rep4 = """  const handleDuplicateElement = (elementId) => {
    let updated = false;
    const nextLayout = activeLayout.map(sec => {
      const els = [...(sec.elements || [])];
      const idx = els.findIndex(e => e.id === elementId);
      if (idx !== -1) {
        const clone = JSON.parse(JSON.stringify(els[idx]));
        clone.id = `el_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        clone.x = (clone.x || 0) + 20;
        clone.y = (clone.y || 0) + 20;
        els.splice(idx + 1, 0, clone);
        updated = true;
      }
      return { ...sec, elements: els };
    });
    if (updated) updateLayout(nextLayout);
  };"""
replacements.append((r"const handleDuplicateElement = \(elementId\) => \{", rep4))

rep5 = """  const handleDeleteElement = (elementId) => {
    let updated = false;
    const nextLayout = activeLayout.map(sec => {
      const els = sec.elements || [];
      if (els.some(e => e.id === elementId)) {
        updated = true;
        return { ...sec, elements: els.filter(e => e.id !== elementId) };
      }
      return sec;
    });
    if (updated) {
      updateLayout(nextLayout);
      if (selectedElementId === elementId) setSelectedElementId(null);
    }
  };"""
replacements.append((r"const handleDeleteElement = \(elementId\) => \{", rep5))

rep6 = """  const handleAddElement = (type) => {
    const defaultElements = {
      heading: { type: 'heading', content: { tag: 'h2', text: 'New Heading' }, styles: { fontSize: '32', color: '#ffffff' } },
      text: { type: 'text', content: { text: 'New Paragraph' }, styles: { fontSize: '15', color: '#cbd5e1' } },
      button: { type: 'button', content: { text: 'Click Here', link: '#' }, styles: { backgroundColor: '#6366f1', color: '#ffffff', padding: '10 20', borderRadius: '6' } },
      image: { type: 'image', content: { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80' }, styles: { borderRadius: '6' } },
      video: { type: 'video', content: { src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }, styles: {} },
      divider: { type: 'divider', content: {}, styles: { height: '1', backgroundColor: '#e2e8f0' } },
      spacer: { type: 'spacer', content: {}, styles: { height: '30' } },
      form: { type: 'form', content: { fields: [{ id: 'field_name', type: 'text', label: 'Name', required: true }] }, styles: { padding: '20', backgroundColor: '#1e293b', borderRadius: '8' } },
      input: { type: 'input', content: { label: 'Form Input', inputType: 'text' }, styles: { color: '#ffffff' } }
    };
    
    const newEl = {
      id: `el_${Date.now()}`,
      x: 50,
      y: 50,
      width: type === 'form' ? 300 : type === 'text' ? 250 : type === 'image' ? 300 : 200,
      height: type === 'form' ? 320 : type === 'text' ? 80 : type === 'image' ? 200 : 50,
      ...defaultElements[type]
    };

    let nextLayout = [...activeLayout];
    if (nextLayout.length === 0) {
      nextLayout.push({
        id: `sec_${Date.now()}`,
        type: 'section',
        settings: { backgroundColor: 'transparent', paddingTop: '50', paddingBottom: '50', textColor: '#ffffff' },
        elements: []
      });
    }

    nextLayout[0].elements = [...(nextLayout[0].elements || []), newEl];
    updateLayout(nextLayout);
    setSelectedElementId(newEl.id);
  };"""
replacements.append((r"const handleAddElement = \(type\) => \{", rep6))

rep7 = """  const handleDropElement = (e, sectionId) => {
    const type = e.dataTransfer.getData("elementType");
    if (!type) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const defaultElements = {
      heading: { type: 'heading', content: { tag: 'h2', text: 'New Heading' }, styles: { fontSize: '32', color: '#ffffff' } },
      text: { type: 'text', content: { text: 'New Paragraph' }, styles: { fontSize: '15', color: '#cbd5e1' } },
      button: { type: 'button', content: { text: 'Click Here', link: '#' }, styles: { backgroundColor: '#6366f1', color: '#ffffff', padding: '10 20', borderRadius: '6' } },
      image: { type: 'image', content: { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80' }, styles: { borderRadius: '6' } },
      video: { type: 'video', content: { src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }, styles: {} },
      divider: { type: 'divider', content: {}, styles: { height: '1', backgroundColor: '#e2e8f0' } },
      spacer: { type: 'spacer', content: {}, styles: { height: '30' } },
      form: { type: 'form', content: { fields: [{ id: 'field_name', type: 'text', label: 'Name', required: true }] }, styles: { padding: '20', backgroundColor: '#1e293b', borderRadius: '8' } },
      input: { type: 'input', content: { label: 'Form Input', inputType: 'text' }, styles: { color: '#ffffff' } }
    };
    
    const newEl = {
      id: `el_${Date.now()}`,
      x: Math.max(0, x - 100),
      y: Math.max(0, y - 20),
      width: type === 'form' ? 300 : type === 'text' ? 250 : type === 'image' ? 300 : 200,
      height: type === 'form' ? 320 : type === 'text' ? 80 : type === 'image' ? 200 : 50,
      ...defaultElements[type]
    };

    const nextLayout = activeLayout.map(sec => {
      if (sec.id === sectionId) {
        return { ...sec, elements: [...(sec.elements || []), newEl] };
      }
      return sec;
    });

    updateLayout(nextLayout);
    setSelectedElementId(newEl.id);
  };"""
replacements.append((r"const handleDropElement = \(e, [a-zA-Z]+\) => \{", rep7))

rep8 = """  const handleAddSection = () => {
    const secId = `sec_${Date.now()}`;
    const newSection = {
      id: secId,
      type: 'section',
      settings: {
        backgroundColor: 'transparent',
        paddingTop: '60',
        paddingBottom: '60',
        containerWidth: '1200px'
      },
      elements: []
    };
    updateLayout([...activeLayout, newSection]);
  };"""
replacements.append((r"const handleAddSection = \([^\)]*\) => \{", rep8))


rep9 = """  const renderCanvasElement = (el, secId) => {
    let elStyles = { ...el.styles };
    
    if (el.hoverStyles && !isPreview) {
      // In builder mode, hover is tricky, but we handled it via CSS injection in compileToStaticHtml
      // In editor mode, hover won't natively show here unless we inject it globally
    }

    let innerContent = null;
    if (el.type === 'heading') {
      const Tag = el.content?.tag || 'h2';
      innerContent = <Tag style={{ margin: 0, fontSize: 'inherit', color: 'inherit' }}>{el.content?.text || 'Heading'}</Tag>;
    } else if (el.type === 'text') {
      innerContent = <div style={{ fontSize: 'inherit', color: 'inherit', whiteSpace: 'pre-wrap' }}>{el.content?.text || 'Text'}</div>;
    } else if (el.type === 'button') {
      innerContent = <button style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', padding: 0 }}>{el.content?.text || 'Button'}</button>;
    } else if (el.type === 'image') {
      innerContent = <img src={el.content?.src} alt={el.content?.alt} style={{ width: '100%', height: '100%', display: 'block', borderRadius: 'inherit' }} />;
    } else if (el.type === 'video') {
      innerContent = <div style={{ width: '100%', height: '100%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Video size={32} color="#94a3b8" /></div>;
    } else if (el.type === 'divider') {
      innerContent = <hr style={{ border: 'none', borderTop: `${el.styles?.height || 1}px solid ${el.styles?.backgroundColor || '#ccc'}`, margin: 0 }} />;
    } else if (el.type === 'spacer') {
      innerContent = <div style={{ height: '100%' }}></div>;
    } else if (el.type === 'form') {
      const formBg = el.styles?.backgroundColor || '#1e293b';
      innerContent = (
        <form style={{ background: formBg, color: el.styles?.color || '#fff', padding: `${el.styles?.padding || 20}px`, borderRadius: `${el.styles?.borderRadius || 8}px`, width: '100%', height: '100%' }}>
          {(el.content?.fields || []).map((f, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>{f.label}</label>
              <input type="text" placeholder={f.placeholder || ''} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #334155', background: 'rgba(255,255,255,0.05)', color: '#fff' }} disabled={!isPreview} />
            </div>
          ))}
          <button type="button" style={{ width: '100%', padding: '10px', background: el.styles?.buttonBgColor || '#6366f1', color: el.styles?.buttonTextColor || '#fff', border: 'none', borderRadius: '4px', marginTop: '10px' }} disabled={!isPreview}>{el.content?.buttonText || 'Send'}</button>
        </form>
      );
    } else if (el.type === 'input') {
      innerContent = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%', height: '100%' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>{el.content?.label || 'Input'}</label>
          <input type={el.content?.inputType || 'text'} placeholder={el.content?.placeholder || ''} disabled={!isPreview} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(0,0,0,0.02)', width: '100%', fontSize: '14px' }} />
        </div>
      );
    }

    const isSelected = selectedElementIds.includes(el.id);
    
    // We render absolute elements using Rnd if not in preview, else static wrapper
    if (isPreview) {
      return (
        <div key={el.id} className="builder-canvas-element" data-element-id={el.id} style={{ position: 'absolute', left: el.x || 0, top: el.y || 0, width: el.width || '100%', height: el.height || 'auto', ...elStyles }}>
          {innerContent}
        </div>
      );
    }

    return (
      <Rnd
        key={el.id}
        bounds="parent"
        position={{ x: el.x || 0, y: el.y || 0 }}
        size={{ width: el.width || 200, height: el.height || 50 }}
        onDragStop={(e, d) => {
          if (el.groupId) {
            const dx = d.x - (el.x || 0);
            const dy = d.y - (el.y || 0);
            const nextLayout = activeLayout.map(s => {
              if (s.id === secId) {
                return {
                  ...s,
                  elements: (s.elements || []).map(ee => {
                    if (ee.groupId === el.groupId) {
                      return { ...ee, x: (ee.x || 0) + dx, y: (ee.y || 0) + dy };
                    }
                    return ee;
                  })
                };
              }
              return s;
            });
            updateLayout(nextLayout);
          } else {
            const nextLayout = activeLayout.map(s => {
              if (s.id === secId) {
                return {
                  ...s,
                  elements: (s.elements || []).map(ee => {
                    if (ee.id === el.id) {
                      return { ...ee, x: d.x, y: d.y };
                    }
                    return ee;
                  })
                };
              }
              return s;
            });
            updateLayout(nextLayout);
          }
        }}
        onResizeStop={(e, direction, ref, delta, position) => {
          const nextLayout = activeLayout.map(s => {
            if (s.id === secId) {
              return {
                ...s,
                elements: (s.elements || []).map(ee => {
                  if (ee.id === el.id) {
                    return { ...ee, width: parseInt(ref.style.width, 10), height: parseInt(ref.style.height, 10), ...position };
                  }
                  return ee;
                })
              };
            }
            return s;
          });
          updateLayout(nextLayout);
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (e.ctrlKey || e.altKey) {
            if (isSelected) {
              setSelectedElementIds(selectedElementIds.filter(id => id !== el.id));
            } else {
              setSelectedElementIds([...selectedElementIds, el.id]);
            }
          } else {
            setSelectedElementIds([el.id]);
          }
        }}
        className={`builder-canvas-element ${isSelected ? 'selected' : ''}`}
        data-element-id={el.id}
        style={{
          ...elStyles,
          zIndex: isSelected ? 100 : (elStyles.zIndex || 1),
          border: isSelected ? '2px solid #3b82f6' : '1px solid transparent',
          outline: (el.groupId && isSelected) ? '1px dashed #ef4444' : 'none'
        }}
      >
        {innerContent}
        
        {isSelected && selectedElementIds.length === 1 && (
          <div className="element-overlay-controls" style={{
            position: 'absolute', top: '-30px', right: '0', background: '#2563eb',
            color: 'white', display: 'flex', borderRadius: '4px', overflow: 'hidden', zIndex: 101,
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
          }}>
             <button onClick={(e) => { e.stopPropagation(); handleLayerElement(el.id, 'forward'); }} title="Bring Forward" style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><Layers size={14} /></button>
             <button onClick={(e) => { e.stopPropagation(); handleDuplicateElement(el.id); }} title="Duplicate" style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><Copy size={14} /></button>
             <button onClick={(e) => { e.stopPropagation(); handleDeleteElement(el.id); }} title="Delete" style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderLeft: '1px solid rgba(255,255,255,0.2)' }}><Trash2 size={14} /></button>
          </div>
        )}
      </Rnd>
    );
  };
"""

for pattern, replacement in replacements:
    start_idx, end_idx = find_block(content, pattern)
    if start_idx != -1:
        content = content[:start_idx] + replacement + content[end_idx:]
    else:
        print(f"Failed to find block for pattern: {pattern}")
        
# Inject renderCanvasElement before the return
if "const renderCanvasElement" not in content:
    return_idx = content.rfind("  return (")
    if return_idx != -1:
        content = content[:return_idx] + rep9 + "\n" + content[return_idx:]

with open(r"src\components\Builder_mod.jsx", "w", encoding="utf-16") as f:
    f.write(content)
print("Done refactoring layout functions.")
