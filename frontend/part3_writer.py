compile_html = """
  const compileToStaticHtml = (page = activePage, currentSite = site, allPages = pages) => {
    if (!page) return '';
    const fontFamily = currentSite.theme?.fontFamily || 'Inter, sans-serif';
    const fontName = fontFamily.split(',')[0].replace(/['"]/g, '');
    const fontImport = `@import url('https://fonts.googleapis.com/css2?family=${fontName.replace(/\\s+/g, '+')}:wght@300;400;600;800&display=swap');`;

    let pageBgColor = currentSite.theme?.backgroundColor || '#ffffff';
    let styles = `
      ${fontImport}
      :root { --primary: ${currentSite.theme?.primaryColor || '#6366f1'}; --bg-color: ${pageBgColor}; --text-color: ${currentSite.theme?.textColor || '#333333'}; --font-family: ${fontFamily}; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background-color: var(--bg-color); color: var(--text-color); font-family: var(--font-family); line-height: 1.5; overflow-x: hidden; }
      .container { width: 100%; margin: 0 auto; padding: 0 20px; position: relative; height: 100%; }
      .site-builder-btn { cursor: pointer; display: inline-block; transition: opacity 0.2s; }
      .site-builder-btn:hover { opacity: 0.9; }
      .element-wrapper { position: absolute; display: inline-block; }
    `;

    let bodyHtml = '';
    (page.layout || []).forEach(sec => {
      let secStyles = '';
      if (sec.settings) Object.keys(sec.settings).forEach(k => { if (k !== 'containerWidth') secStyles += `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${sec.settings[k]}; `; });
      const containerWidth = sec.settings?.containerWidth || '1200px';

      bodyHtml += `<section id="${sec.id}" style="position: relative; width: 100%; min-height: 400px; ${secStyles}"><div class="container" style="max-width: ${containerWidth};">`;
      (sec.elements || []).forEach(el => {
        let elStyles = `width: ${el.width ? `${el.width}px` : '100%'}; height: ${el.height ? `${el.height}px` : 'auto'}; left: ${el.x || 0}px; top: ${el.y || 0}px; `;
        if (el.styles) Object.keys(el.styles).forEach(k => {
          let val = el.styles[k];
          if (['fontSize', 'padding', 'margin', 'borderRadius', 'borderWidth', 'marginBottom', 'height', 'width', 'letterSpacing', 'lineHeight'].includes(k) && !isNaN(val) && val !== '') val = `${val}px`;
          elStyles += `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${val}; `;
        });

        let innerMarkup = '';
        if (el.type === 'heading') innerMarkup = `<${el.content?.tag || 'h2'} style="margin: 0; font-size: inherit; color: inherit;">${el.content?.text || 'Heading'}</${el.content?.tag || 'h2'}>`;
        else if (el.type === 'text') innerMarkup = `<div style="font-size: inherit; color: inherit;">${(el.content?.text || 'Paragraph text').replace(/\\n/g, '<br>')}</div>`;
        else if (el.type === 'button') innerMarkup = `<button class="site-builder-btn" style="width: 100%; height: 100%; border: none; background: transparent; color: inherit; font-size: inherit; font-weight: inherit; padding: 0; border-radius: inherit;">${el.content?.text || 'Button'}</button>`;
        else if (el.type === 'image') innerMarkup = `<img src="${el.content?.src}" alt="${el.content?.alt || 'Graphic'}" style="width: 100%; height: 100%; display: block; border-radius: inherit;" />`;
        else if (el.type === 'divider') innerMarkup = `<hr style="border: none; border-top: ${el.styles?.height || 1}px solid ${el.styles?.backgroundColor || '#ccc'}; margin: 0;" />`;
        else if (el.type === 'spacer') innerMarkup = `<div style="height: 100%;"></div>`;
        
        let wrapStart = '', wrapEnd = '';
        if (el.action?.type === 'url') { wrapStart = `<a href="${el.action.value || '#'}" target="_blank" style="text-decoration: none; color: inherit; display: block; width: 100%; height: 100%;">`; wrapEnd = `</a>`; }
        else if (el.action?.type === 'email') { wrapStart = `<a href="mailto:${el.action.value || ''}" style="text-decoration: none; color: inherit; display: block; width: 100%; height: 100%;">`; wrapEnd = `</a>`; }

        bodyHtml += `<div class="element-wrapper" id="${el.id}" style="${elStyles}">${wrapStart}${innerMarkup}${wrapEnd}</div>`;
      });
      bodyHtml += `</div></section>`;
    });

    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${page.meta_title || currentSite.name}</title><style>${styles}</style></head><body>${bodyHtml}</body></html>`;
  };

  const exportProjectToDevice = async () => {
    try {
      const zip = new JSZip();
      zip.file(`${site.subdomain || 'website'}_backup.json`, JSON.stringify({ site, pages, exportedAt: new Date().toISOString() }, null, 2));
      for (const page of pages) {
        zip.file(page.slug === 'home' ? 'index.html' : `${page.slug || 'page'}.html`, compileToStaticHtml(page, site, pages));
      }
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${site.subdomain || 'website'}_full_export.zip`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
    } catch (error) { alert('Export failed'); }
  };
"""

render_return = """
  if (!site) return <div style={{ color: '#fff' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#090d16' }}>
      <header className="glass" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 30px', height: '65px' }}>
        <div style={{ display: 'flex', gap: '15px' }}>
           <button onClick={() => navigate('/')} className="btn-secondary"><ArrowLeft size={16} /> Back</button>
           <h2 style={{ color: '#fff', fontSize: '15px' }}>{site.name}</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
           <button onClick={handleUndo} className="btn-secondary">Undo</button>
           <button onClick={handleRedo} className="btn-secondary">Redo</button>
           <button onClick={saveLayout} className="btn-primary">Save</button>
           <button onClick={exportProjectToDevice} className="btn-secondary">Export ZIP</button>
           <button onClick={() => setIsPreview(!isPreview)} className="btn-secondary">{isPreview ? 'Edit' : 'Preview'}</button>
        </div>
      </header>

      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {!isPreview && (
          <aside className="glass" style={{ width: '300px', display: 'flex', borderRight: '1px solid var(--border)' }}>
            <div style={{ width: '65px', borderRight: '1px solid var(--border)', padding: '15px 0', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
              <button onClick={() => setActiveLeftTab('elements')}><Plus size={20} color="#fff" /></button>
            </div>
            <div style={{ padding: '20px', flexGrow: 1, overflowY: 'auto', color: '#fff' }}>
              {activeLeftTab === 'elements' && (
                <div>
                  <h3>Add Elements</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                     <button onClick={() => handleAddElement('heading')} className="btn-secondary">Heading</button>
                     <button onClick={() => handleAddElement('text')} className="btn-secondary">Text</button>
                     <button onClick={() => handleAddElement('button')} className="btn-secondary">Button</button>
                     <button onClick={() => handleAddElement('image')} className="btn-secondary">Image</button>
                     <button onClick={() => handleAddElement('divider')} className="btn-secondary">Divider</button>
                  </div>
                  <button onClick={handleAddSection} className="btn-primary" style={{ marginTop: '20px', width: '100%' }}>+ Add Section</button>
                </div>
              )}
            </div>
          </aside>
        )}

        <div ref={viewportRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} style={{ flexGrow: 1, padding: isPreview ? 0 : '40px', overflowY: 'auto', background: '#090d16', position: 'relative' }}>
          <div style={{ minHeight: '100%', background: '#fff' }}>
            {activeLayout.length === 0 ? (
               <div style={{ padding: '80px', textAlign: 'center' }}>
                  <button onClick={handleAddSection} className="btn-primary">+ Add Section</button>
               </div>
            ) : (
               activeLayout.map(sec => (
                 <section key={sec.id} style={{ position: 'relative', width: '100%', minHeight: '400px', border: isPreview ? 'none' : '1px dashed #ccc', marginBottom: '20px', ...sec.settings }}>
                   {!isPreview && <button onClick={() => handleDeleteSection(sec.id)} style={{ position: 'absolute', top: 5, left: 5, zIndex: 99 }}>Del Section</button>}
                   <div style={{ width: sec.settings?.containerWidth || '1200px', margin: '0 auto', height: '100%', position: 'relative' }} onDrop={(e) => handleDropElement(e, sec.id)} onDragOver={(e) => e.preventDefault()}>
                      {(sec.elements || []).map(el => renderCanvasElement(el, sec.id))}
                   </div>
                 </section>
               ))
            )}
          </div>
          {isLassoing && lassoStart && lassoEnd && (
            <div style={{ position: 'absolute', left: Math.min(lassoStart.x, lassoEnd.x), top: Math.min(lassoStart.y, lassoEnd.y), width: Math.abs(lassoStart.x - lassoEnd.x), height: Math.abs(lassoStart.y - lassoEnd.y), border: '1px dashed #6366f1', background: 'rgba(99,102,241,0.15)', pointerEvents: 'none', zIndex: 9999 }} />
          )}
        </div>

        {!isPreview && (
          <aside className="glass" style={{ width: '320px', padding: '20px', color: '#fff', overflowY: 'auto' }}>
             {selectedElementIds.length > 1 ? (
               <div>
                  <h3>Multiple Selection</h3>
                  <div style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
                    <button onClick={handleGroup} className="btn-primary"><ObjectGroup size={16} /> Group</button>
                  </div>
                  <h3>Alignment</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px' }}>
                    <button onClick={() => alignElements('left')} className="btn-secondary"><AlignLeft size={16}/></button>
                    <button onClick={() => alignElements('center')} className="btn-secondary"><AlignCenter size={16}/></button>
                    <button onClick={() => alignElements('right')} className="btn-secondary"><AlignRight size={16}/></button>
                  </div>
               </div>
             ) : selectedElement ? (
               <div>
                  <h3>Style Inspector</h3>
                  {selectedElement.groupId && <button onClick={handleUngroup} className="btn-secondary" style={{ margin: '10px 0' }}><ObjectUngroup size={16} /> Ungroup</button>}
                  <div style={{ marginTop: '20px' }}>
                     <label>Color</label>
                     <input type="color" value={selectedElement.styles?.color || '#000'} onChange={e => updateSelectedElement({ styles: { color: e.target.value } })} />
                  </div>
                  <div style={{ marginTop: '10px' }}>
                     <label>Background</label>
                     <input type="color" value={selectedElement.styles?.backgroundColor || '#fff'} onChange={e => updateSelectedElement({ styles: { backgroundColor: e.target.value } })} />
                  </div>
                  <div style={{ marginTop: '10px' }}>
                     <label>Opacity (0-1)</label>
                     <input type="number" step="0.1" value={selectedElement.styles?.opacity || '1'} onChange={e => updateSelectedElement({ styles: { opacity: e.target.value } })} />
                  </div>
                  <div style={{ marginTop: '10px' }}>
                     <label>Box Shadow</label>
                     <input type="text" placeholder="e.g. 0 4px 6px rgba(0,0,0,0.1)" value={selectedElement.styles?.boxShadow || ''} onChange={e => updateSelectedElement({ styles: { boxShadow: e.target.value } })} />
                  </div>
                  <div style={{ marginTop: '10px' }}>
                     <label>Border Radius</label>
                     <input type="number" value={selectedElement.styles?.borderRadius || '0'} onChange={e => updateSelectedElement({ styles: { borderRadius: e.target.value } })} />
                  </div>
               </div>
             ) : (
               <p>Select an element to style</p>
             )}
          </aside>
        )}
      </div>
    </div>
  );
}
"""

with open("part3.py", "w", encoding="utf-8") as f:
    f.write('p3 = """' + compile_html + render_return + '"""\n')
