import re

with open(r"src\components\Builder_mod.jsx", "r", encoding="utf-8") as f:
    content = f.read()

rep9 = """const renderCanvasElement = (el, secId) => {
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
  };"""

# We find where const renderCanvasElement = (el, secId) => { starts and replace up to its end.
# We'll use our brace matching function from before
def find_block(text, start_pattern):
    match = re.search(start_pattern, text)
    if not match:
        return -1, -1
    
    start_idx = match.start()
    
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
            if c in "\"'`":
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

start_idx, end_idx = find_block(content, r"const renderCanvasElement = \(el, secId\) => \{")
if start_idx != -1:
    content = content[:start_idx] + rep9 + content[end_idx:]
else:
    print("Could not find renderCanvasElement!")

with open(r"src\components\Builder_mod.jsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Done replacing renderCanvasElement")
