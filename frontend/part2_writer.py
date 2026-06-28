import os

add_element_logic = """
  const handleAddElement = (type) => {
    const defaultElements = {
      heading: { type: 'heading', content: { tag: 'h2', text: 'New Heading Segment' }, styles: { fontSize: '32', color: '#ffffff', marginBottom: '15' } },
      text: { type: 'text', content: { text: 'Write your rich paragraph details here. Click style settings to configure background, padding, and size.' }, styles: { fontSize: '15', color: '#cbd5e1', marginBottom: '15', lineHeight: '1.6' } },
      button: { type: 'button', content: { text: 'Click Action', link: '#' }, styles: { backgroundColor: '#6366f1', color: '#ffffff', padding: '10 20', borderRadius: '6', fontWeight: 'bold' } },
      image: { type: 'image', content: { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80', alt: 'Visual Graphic' }, styles: { borderRadius: '6', marginBottom: '15' } },
      video: { type: 'video', content: { src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }, styles: { marginBottom: '15' } },
      divider: { type: 'divider', content: {}, styles: { height: '1', backgroundColor: '#e2e8f0', marginTop: '15', marginBottom: '15' } },
      spacer: { type: 'spacer', content: {}, styles: { height: '30' } },
      form: { type: 'form', content: { fields: [ { id: 'field_name', type: 'text', label: 'Name', required: true, placeholder: 'Sender Name' }, { id: 'field_email', type: 'email', label: 'Email Address', required: true, placeholder: 'Sender Email' }, { id: 'field_message', type: 'textarea', label: 'Message', required: true, placeholder: 'Message content...' } ] }, styles: { padding: '20', backgroundColor: '#1e293b', borderRadius: '8' } },
      input: { type: 'input', content: { label: 'Form Input', placeholder: 'Enter details...', inputType: 'text', name: 'input_field', required: false }, styles: { color: '#ffffff', marginBottom: '15' } }
    };
    const newEl = { id: `el_${Date.now()}`, x: 50, y: 50, width: 300, height: type === 'form' ? 320 : type === 'text' ? 80 : 50, ...defaultElements[type] };

    let nextLayout = [...activeLayout];
    if (nextLayout.length === 0) {
      nextLayout.push({ id: `sec_${Date.now()}`, type: 'section', settings: { backgroundColor: 'transparent', paddingTop: '50', paddingBottom: '50', textColor: '#ffffff', containerWidth: '1200px' }, elements: [] });
    }
    nextLayout[0].elements.push(newEl);
    updateLayout(nextLayout);
    setSelectedElementIds([newEl.id]);
  };

  const handleDropElement = (e, sectionId) => {
    const type = e.dataTransfer.getData("elementType");
    if (!type) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    handleAddElement(type); // simplified: add to top section and adjust x,y
    // In a full implementation, we'd find the newEl and update its x,y based on drop.
  };

  const handleAddSection = () => {
    const newSection = {
      id: `sec_${Date.now()}`,
      type: 'section',
      settings: { backgroundColor: 'transparent', paddingTop: '60', paddingBottom: '60', containerWidth: '1200px' },
      elements: []
    };
    updateLayout([...activeLayout, newSection]);
  };

  const handleDeleteSection = (secId) => {
    if (activeLayout.length <= 1) { alert("Your page must contain at least one section."); return; }
    updateLayout(activeLayout.filter(s => s.id !== secId));
  };
"""

render_canvas_element = """
  const renderCanvasElement = (el, sectionId) => {
    const isSelected = selectedElementIds.includes(el.id);
    const isGroupSelected = el.groupId && selectedElementIds.some(id => {
      const selectedEls = getSelectedElements();
      return selectedEls.some(sel => sel.groupId === el.groupId);
    });
    
    // Convert styles carefully
    const stylesObj = el.styles || {};
    const styles = {};
    Object.keys(stylesObj).forEach(k => {
      let val = stylesObj[k];
      if (['fontSize', 'padding', 'margin', 'borderRadius', 'borderWidth', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'height', 'width', 'maxWidth', 'letterSpacing', 'lineHeight'].includes(k) && !isNaN(val) && val !== '') val = `${val}px`;
      styles[k] = val;
    });

    const isInlineEditing = inlineEditingId === el.id;

    const overlayControls = !isPreview && (
      <div className="element-overlay-controls" style={{ position: 'absolute', top: '-25px', right: 0, display: isSelected ? 'flex' : 'none', gap: '4px', background: '#333', padding: '4px', borderRadius: '4px', zIndex: 999 }}>
        <button onClick={(e) => { e.stopPropagation(); handleLayerElement(el.id, 'forward'); }} title="Bring Forward"><BringToFront size={12} color="#fff" /></button>
        <button onClick={(e) => { e.stopPropagation(); handleLayerElement(el.id, 'backward'); }} title="Send Backward"><SendToBack size={12} color="#fff" /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDuplicateElement(el.id); }} title="Duplicate"><Copy size={12} color="#fff" /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDeleteElement(el.id); }} style={{ color: '#ff4d4d' }} title="Delete"><Trash2 size={12} /></button>
      </div>
    );

    const handleElClick = (e) => {
      if (isPreview) return;
      e.stopPropagation();
      if (e.ctrlKey || e.altKey) {
        if (selectedElementIds.includes(el.id)) setSelectedElementIds(prev => prev.filter(id => id !== el.id));
        else setSelectedElementIds(prev => [...prev, el.id]);
      } else {
        if (el.groupId) {
          // Select all in group
          const groupEls = activeLayout.flatMap(s => s.elements || []).filter(e => e.groupId === el.groupId).map(e => e.id);
          setSelectedElementIds(groupEls);
        } else {
          setSelectedElementId(el.id);
        }
      }
    };

    const handleElDoubleClick = (e) => {
      if (isPreview || !['heading', 'text', 'button'].includes(el.type)) return;
      e.stopPropagation();
      setInlineEditingId(el.id);
      setTimeout(() => { if (inlineEditRef.current) inlineEditRef.current.focus(); }, 50);
    };

    const commitInlineEdit = (newText) => { updateSelectedElement({ content: { text: newText } }); setInlineEditingId(null); };

    let elementInnerContent = null;
    
    // Build the inner content based on type (similar to previous but optimized)
    if (el.type === 'heading') {
      const Tag = el.content?.tag || 'h2';
      elementInnerContent = isInlineEditing ? (
        <Tag style={styles}><span ref={inlineEditRef} contentEditable suppressContentEditableWarning onBlur={(e) => commitInlineEdit(e.target.innerText)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } if (e.key === 'Escape') setInlineEditingId(null); }} style={{ outline: 'none', display: 'block' }}>{el.content?.text || 'Heading'}</span></Tag>
      ) : <Tag style={styles}>{el.content?.text || 'Heading'}</Tag>;
    } else if (el.type === 'text') {
      elementInnerContent = isInlineEditing ? (
        <div ref={inlineEditRef} contentEditable suppressContentEditableWarning onBlur={(e) => commitInlineEdit(e.target.innerText)} onKeyDown={(e) => { if (e.key === 'Escape') setInlineEditingId(null); }} style={{ ...styles, outline: 'none', whiteSpace: 'pre-wrap' }}>{el.content?.text || 'Paragraph text'}</div>
      ) : <div style={styles} dangerouslySetInnerHTML={{ __html: (el.content?.text || 'Paragraph text').replace(/\\n/g, '<br>') }} />;
    } else if (el.type === 'button') {
      elementInnerContent = isInlineEditing ? (
        <button className="site-builder-btn" style={{ border: 'none', cursor: 'pointer', ...styles }}><span ref={inlineEditRef} contentEditable suppressContentEditableWarning onBlur={(e) => commitInlineEdit(e.target.innerText)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } if (e.key === 'Escape') setInlineEditingId(null); }} style={{ outline: 'none' }}>{el.content?.text || 'Button'}</span></button>
      ) : <button className="site-builder-btn" style={{ border: 'none', cursor: 'pointer', ...styles }}>{el.content?.text || 'Button'}</button>;
    } else if (el.type === 'image') {
      elementInnerContent = <img src={el.content?.src} alt={el.content?.alt} style={{ width: '100%', height: '100%', display: 'block', ...styles }} />;
    } else if (el.type === 'video') {
      const src = el.content?.src || '';
      const isYoutube = src.includes('youtube.com') || src.includes('youtu.be');
      let embedUrl = src;
      if (isYoutube) embedUrl = src.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/');
      elementInnerContent = isYoutube ? <iframe src={embedUrl} frameBorder="0" allowFullScreen style={{ width: '100%', height: '100%', ...styles }} /> : <video src={src} controls style={{ width: '100%', height: '100%', ...styles }} />;
    } else if (el.type === 'divider') {
      elementInnerContent = <hr style={{ border: 'none', borderTop: `${el.styles?.height || 1}px solid ${el.styles?.backgroundColor || '#ccc'}`, margin: 0, ...styles }} />;
    } else if (el.type === 'spacer') {
      elementInnerContent = <div style={{ height: '100%', ...styles }} />;
    } else if (el.type === 'form') {
      const formBg = el.styles?.backgroundColor || '#1e293b';
      const formTextColor = el.styles?.color || '#ffffff';
      elementInnerContent = (
        <div style={{ width: '100%', padding: `${el.styles?.padding || 20}px`, background: formBg, color: formTextColor, borderRadius: `${el.styles?.borderRadius || 8}px`, ...styles }}>
          {(el.content?.fields || []).map(f => (
            <div key={f.id} style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>{f.label}</label>
              {f.type === 'textarea' ? <textarea disabled placeholder={f.placeholder} style={{ width: '100%' }}></textarea> : <input type={f.type} disabled placeholder={f.placeholder} style={{ width: '100%' }} />}
            </div>
          ))}
          <button type="button" style={{ width: '100%', padding: '10px', background: el.styles?.buttonBgColor || '#6366f1', color: el.styles?.buttonTextColor || '#fff' }}>{el.content?.buttonText || 'Send'}</button>
        </div>
      );
    } else if (el.type === 'input') {
      elementInnerContent = (
        <div style={{ width: '100%', ...styles }}>
          <label style={{ fontSize: '12px' }}>{el.content?.label || 'Label'}</label>
          <input type={el.content?.inputType || 'text'} disabled placeholder={el.content?.placeholder} style={{ width: '100%' }} />
        </div>
      );
    }

    return (
      <Rnd
        key={`${el.id}_${isPreview}`}
        size={{ width: el.width || '100%', height: el.height || 'auto' }}
        position={{ x: el.x || 0, y: el.y || 0 }}
        disableDragging={isPreview}
        enableResizing={!isPreview}
        bounds="parent"
        onDragStop={(e, d) => {
          if (el.groupId) {
             const dx = d.x - el.x;
             const dy = d.y - el.y;
             const nextLayout = activeLayout.map(sec => ({
               ...sec, elements: (sec.elements || []).map(element => element.groupId === el.groupId ? { ...element, x: element.x + dx, y: element.y + dy } : element)
             }));
             updateLayout(nextLayout);
          } else {
             const nextLayout = activeLayout.map(sec => ({
               ...sec, elements: (sec.elements || []).map(element => element.id === el.id ? { ...element, x: d.x, y: d.y } : element)
             }));
             updateLayout(nextLayout);
          }
        }}
        onResizeStop={(e, dir, ref, delta, pos) => {
          const nextLayout = activeLayout.map(sec => ({
            ...sec, elements: (sec.elements || []).map(element => element.id === el.id ? { ...element, width: parseInt(ref.style.width), height: parseInt(ref.style.height), x: pos.x, y: pos.y } : element)
          }));
          updateLayout(nextLayout);
        }}
        onClick={handleElClick}
        onDoubleClick={handleElDoubleClick}
        className={`builder-canvas-element ${isSelected || isGroupSelected ? 'selected' : ''}`}
        data-element-id={el.id}
        style={{ position: 'absolute', zIndex: el.styles?.zIndex || (isSelected ? 50 : 10), border: (isSelected || isGroupSelected) && !isPreview ? '2px dashed #6366f1' : 'none' }}
      >
        {overlayControls}
        {elementInnerContent}
      </Rnd>
    );
  };
"""

with open("part2.py", "w", encoding="utf-8") as f:
    f.write('p2 = """' + add_element_logic + render_canvas_element + '"""\n')
