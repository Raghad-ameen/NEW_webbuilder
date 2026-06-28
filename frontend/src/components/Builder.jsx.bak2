import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Laptop, Tablet, Smartphone, Eye, EyeOff, Save, Check, Globe,
  Type, Image as ImageIcon, Video, Square, Play, Plus, Trash2, ArrowUp, ArrowDown,
  Copy, Settings, Palette, FileCode, Layers, CheckCircle, RefreshCw, Sparkles, Mail
} from 'lucide-react';
import { TEMPLATES } from '../utils/TemplateData';
import { Rnd } from 'react-rnd';
import JSZip from 'jszip';

function Builder() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [site, setSite] = useState(null);
  const [pages, setPages] = useState([]);
  const [activePage, setActivePage] = useState(null);
  const [activeLayout, setActiveLayout] = useState([]);
  
  const [selectedElementIds, setSelectedElementIds] = useState([]);
  const selectedElementId = selectedElementIds[0] || null;
  const setSelectedElementId = (id) => {
    setSelectedElementIds(id ? [id] : []);
  };
  const [selectedColumnId, setSelectedColumnId] = useState(null);
  const [lassoStart, setLassoStart] = useState(null);
  const [lassoEnd, setLassoEnd] = useState(null);
  const [isLassoing, setIsLassoing] = useState(false);
  
  const [activeLeftTab, setActiveLeftTab] = useState('elements');
  const [viewMode, setViewMode] = useState('desktop'); 
  const [isPreview, setIsPreview] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeFormEl, setActiveFormEl] = useState(null);
  const viewportRef = useRef(null);
  
  const [history, setHistory] = useState([]);
  const [historyPointer, setHistoryPointer] = useState(-1);
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState(null);

  const [renamingPageId, setRenamingPageId] = useState(null);
  const [renamePageValue, setRenamePageValue] = useState('');

  const [inlineEditingId, setInlineEditingId] = useState(null);
  const inlineEditRef = useRef(null);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token'); 
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const siteRes = await fetch(`http://127.0.0.1:8000/api/sites/${siteId}/`, { headers });
      
      if (siteRes.status === 403) {
        navigate('/', { state: { showSuspendedModal: true } });
        return;
      }

      if (!siteRes.ok) {
        navigate('/');
        return;
      }

      const siteData = await siteRes.json();
      if (siteData && siteData.is_active === false) {
        navigate('/', { state: { showSuspendedModal: true } });
        return;
      }
      setSite(siteData);
      
      const pagesRes = await fetch(`http://127.0.0.1:8000/api/pages/?site_id=${siteId}`, { headers });
      if (pagesRes.ok) {
        const pagesData = await pagesRes.json();
        const sitePages = pagesData.filter(p => p.site === parseInt(siteId));
        setPages(sitePages);
        
        const home = sitePages.find(p => p.slug === 'home') || sitePages[0];
        if (home) {
          setActivePage(home);
          setActiveLayout(home.layout || []);
          setHistory([JSON.stringify(home.layout || [])]);
          setHistoryPointer(0);
        } else {
          setActivePage(null);
          setActiveLayout([]);
          setHistory([]);
          setHistoryPointer(-1);
        }
      }
    } catch (err) {
      console.error('Error fetching builder details:', err);
    }
  };

  useEffect(() => {
    if (siteId) {
      fetchData();
    }
  }, [siteId]);  

  const saveLayout = async () => {
    if (!activePage) {
      alert("No active page found to save.");
      return;
    }
    setIsSaving(true);
    
    try {
      const token = localStorage.getItem('access_token');
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://127.0.0.1:8000/api/pages/${activePage.id}/`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({
          site: parseInt(siteId),
          title: activePage.title,
          slug: activePage.slug,
          layout: activeLayout,
          meta_title: activePage.meta_title || '',
          meta_description: activePage.meta_description || ''
        })
      });

      if (response.ok) {
        setIsSaving(false);
        setIsSaveModalOpen(true);
      } else {
        setIsSaving(false);
        const errorData = await response.json();
        console.error('Save failed:', errorData);
        alert('Failed to save layout. Server returned an error.');
      }
    } catch (err) {
      setIsSaving(false);
      console.error('Error saving layout:', err);
      alert('An error occurred while saving.');
    }
  };

  const handleMouseDown = (e) => {
    if (isPreview) return;
    if (
      e.target.closest('.builder-canvas-element') || 
      e.target.closest('.element-overlay-controls') || 
      e.target.closest('input') || 
      e.target.closest('select') || 
      e.target.closest('textarea') || 
      e.target.closest('button') || 
      e.button !== 0
    ) {
      return;
    }
    const rect = viewportRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left + viewportRef.current.scrollLeft;
    const startY = e.clientY - rect.top + viewportRef.current.scrollTop;
    setLassoStart({ x: startX, y: startY });
    setLassoEnd({ x: startX, y: startY });
    setIsLassoing(true);
    setSelectedElementIds([]);
    setSelectedColumnId(null);
  };

  const handleMouseMove = (e) => {
    if (!isLassoing || !lassoStart || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left + viewportRef.current.scrollLeft;
    const currentY = e.clientY - rect.top + viewportRef.current.scrollTop;
    setLassoEnd({ x: currentX, y: currentY });

    const elements = viewportRef.current.querySelectorAll('.builder-canvas-element');
    const selectedIds = [];
    
    const x1 = Math.min(lassoStart.x, currentX);
    const y1 = Math.min(lassoStart.y, currentY);
    const x2 = Math.max(lassoStart.x, currentX);
    const y2 = Math.max(lassoStart.y, currentY);

    elements.forEach(elNode => {
      const elId = elNode.getAttribute('data-element-id');
      if (!elId) return;

      const elRect = elNode.getBoundingClientRect();
      const viewRect = viewportRef.current.getBoundingClientRect();
      
      const elLeft = elRect.left - viewRect.left + viewportRef.current.scrollLeft;
      const elTop = elRect.top - viewRect.top + viewportRef.current.scrollTop;
      const elRight = elLeft + elRect.width;
      const elBottom = elTop + elRect.height;

      const overlap = !(x2 < elLeft || x1 > elRight || y2 < elTop || y1 > elBottom);
      if (overlap) {
        selectedIds.push(elId);
      }
    });
    setSelectedElementIds(selectedIds);
  };

  const handleMouseUp = () => {
    setIsLassoing(false);
    setLassoStart(null);
    setLassoEnd(null);
  };

  const compileToStaticHtml = (page = activePage, currentSite = site, allPages = pages) => {
    if (!page) return '';
    const fontFamily = currentSite.theme?.fontFamily || 'Inter, sans-serif';
    const fontName = fontFamily.split(',')[0].replace(/['"]/g, '');
    const fontImport = `@import url('https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@300;400;600;800&display=swap');`;

    let pageBgColor = currentSite.theme?.backgroundColor || '#ffffff';
    try {
      if (page.meta_description && page.meta_description.startsWith('{')) {
        const settings = JSON.parse(page.meta_description);
        if (settings.useGlobalBackground === false) {
          pageBgColor = settings.backgroundColor || '#ffffff';
        }
      }
    } catch (e) {}

    const animationKeyframes = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes slideDown {
        from { transform: translateY(-30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-15px); }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes zoomIn {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    `;

    // Generate Hover Styles CSS for static build
    let hoverStylesCss = '';
    const targetLayout = page.layout || [];
    targetLayout.forEach(sec => {
      sec.rows?.forEach(row => {
        row.columns?.forEach(col => {
          col.elements?.forEach(el => {
            if (el.hoverStyles) {
              let hoverRules = '';
              if (el.hoverStyles.backgroundColor) hoverRules += `background-color: ${el.hoverStyles.backgroundColor} !important; `;
              if (el.hoverStyles.color) hoverRules += `color: ${el.hoverStyles.color} !important; `;
              if (el.hoverStyles.opacity) hoverRules += `opacity: ${el.hoverStyles.opacity} !important; `;
              if (el.hoverStyles.transform) hoverRules += `transform: ${el.hoverStyles.transform} !important; `;
              
              if (hoverRules) {
                hoverStylesCss += `
                  [data-element-id="${el.id}"] {
                    transition: all ${el.hoverStyles.transitionSpeed || '0.2'}s ease-in-out !important;
                  }
                  [data-element-id="${el.id}"]:hover {
                    ${hoverRules}
                  }
                `;
              }
            }
          });
        });
      });
    });

    let styles = `
      ${fontImport}
      
      :root {
        --primary: ${currentSite.theme?.primaryColor || '#6366f1'};
        --bg-color: ${pageBgColor};
        --text-color: ${currentSite.theme?.textColor || '#333333'};
        --font-family: ${fontFamily};
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        background-color: var(--bg-color);
        color: var(--text-color);
        font-family: var(--font-family);
        line-height: 1.5;
        overflow-x: hidden;
      }

      .container {
        width: 100%;
        margin: 0 auto;
        padding: 0 20px;
      }

      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        margin-bottom: 20px;
      }

      .col {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 15px;
        min-height: 400px;
      }

      .col-12 { flex: 0 0 100%; width: 100%; }
      .col-9 { flex: 0 0 calc(75% - 5px); width: calc(75% - 5px); }
      .col-8 { flex: 0 0 calc(66.66% - 6.66px); width: calc(66.66% - 6.66px); }
      .col-6 { flex: 0 0 calc(50% - 10px); width: calc(50% - 10px); }
      .col-4 { flex: 0 0 calc(33.33% - 13.33px); width: calc(33.33% - 13.33px); }
      .col-3 { flex: 0 0 calc(25% - 15px); width: calc(25% - 15px); }

      @media (max-width: 768px) {
        .col {
          flex: 0 0 100% !important;
          width: 100% !important;
        }
        .row {
          flex-direction: column;
        }
      }

      .element-wrapper {
        position: absolute;
        display: inline-block;
      }

      .site-builder-btn {
        border: none;
        cursor: pointer;
        display: inline-block;
        transition: opacity 0.2s;
      }
      
      .site-builder-btn:hover {
        opacity: 0.9;
      }

      .platform-contact-form {
        width: 100%;
        padding: 20px;
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.05);
        border-radius: 8px;
      }

      .form-group {
        margin-bottom: 12px;
      }

      .form-group label {
        display: block;
        font-size: 12px;
        margin-bottom: 4px;
        font-weight: 600;
      }

      .form-group input, .form-group textarea {
        width: 100%;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 6px;
        color: inherit;
        padding: 10px;
        font-family: inherit;
        font-size: 14px;
      }

      .form-submit-btn {
        width: 100%;
        padding: 10px 18px;
        font-weight: bold;
        cursor: pointer;
        border: none;
        transition: opacity 0.2s;
      }

      .form-submit-btn:hover {
        opacity: 0.9;
      }

      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }

      .modal-overlay.active {
        opacity: 1;
        pointer-events: auto;
      }

      .modal-content {
        background: var(--bg-color);
        color: var(--text-color);
        width: 100%;
        max-width: 450px;
        padding: 30px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
        position: relative;
      }

      .modal-close {
        position: absolute;
        top: 15px;
        right: 15px;
        background: none;
        border: none;
        color: inherit;
        font-size: 18px;
        cursor: pointer;
        opacity: 0.7;
      }

      .modal-close:hover {
        opacity: 1;
      }

      ${animationKeyframes}
      ${hoverStylesCss}
      ${currentSite.custom_css || ''}
    `;

    let navHtml = '';
    if (allPages.length > 1) {
      navHtml = `
        <nav style="display: flex; justify-content: space-between; align-items: center; padding: 15px 30px; border-bottom: 1px solid rgba(0,0,0,0.06); background: rgba(0,0,0,0.01);">
          <span style="font-weight: bold; color: var(--primary);">${currentSite.name}</span>
          <div style="display: flex; gap: 20px; font-size: 14px;">
            ${allPages.map(p => `
              <a href="${p.slug === 'home' ? 'index.html' : `${p.slug}.html`}" style="text-decoration: none; color: inherit; font-weight: ${page.id === p.id ? 'bold' : 'normal'}; border-bottom: ${page.id === p.id ? '2px solid var(--primary)' : 'none'}; padding-bottom: 2px;">
                ${p.title}
              </a>
            `).join('')}
          </div>
        </nav>
      `;
    }

    let bodyHtml = '';
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
        <section id="${sec.id}" style="position: relative; width: 100%; ${secStyles}">
          <div class="container" style="max-width: ${containerWidth};">
      `;

      (sec.rows || []).forEach(row => {
        let rowStyles = '';
        if (row.settings) {
          Object.keys(row.settings).forEach(k => {
            let val = row.settings[k];
            if (['paddingTop', 'paddingBottom', 'padding', 'margin'].includes(k) && !isNaN(val) && val !== '') val = `${val}px`;
            rowStyles += `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${val}; `;
          });
        }

        bodyHtml += `
          <div class="row" style="${rowStyles}">
        `;

        (row.columns || []).forEach(col => {
          let colStyles = '';
          if (col.settings) {
            Object.keys(col.settings).forEach(k => {
              if (k === 'width') return;
              let val = col.settings[k];
              if (['paddingTop', 'paddingBottom', 'padding', 'margin'].includes(k) && !isNaN(val) && val !== '') val = `${val}px`;
              colStyles += `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${val}; `;
            });
          }
          const colWidth = col.settings?.width || '12';

          bodyHtml += `
            <div class="col col-${colWidth}" style="${colStyles}">
          `;

          (col.elements || []).forEach(el => {
            let elStyles = `width: ${el.width ? `${el.width}px` : '100%'}; height: ${el.height ? `${el.height}px` : 'auto'}; left: ${el.x || 0}px; top: ${el.y || 0}px; `;
            
            if (el.styles) {
              Object.keys(el.styles).forEach(k => {
                let val = el.styles[k];
                if (['fontSize', 'padding', 'margin', 'borderRadius', 'borderWidth', 'marginBottom', 'height', 'width'].includes(k) && !isNaN(val) && val !== '') val = `${val}px`;
                elStyles += `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${val}; `;
              });
            }

            if (el.animation && el.animation.type && el.animation.type !== 'none') {
              elStyles += `animation-name: ${el.animation.type}; `;
              elStyles += `animation-duration: ${el.animation.duration || 1}s; `;
              elStyles += `animation-delay: ${el.animation.delay || 0}s; `;
              elStyles += `animation-iteration-count: ${el.animation.iteration || '1'}; `;
              elStyles += `animation-fill-mode: both; `;
            }

            let innerMarkup = '';
            if (el.type === 'heading') {
              const Tag = el.content?.tag || 'h2';
              innerMarkup = `<${Tag} style="margin: 0; font-size: inherit; color: inherit;">${el.content?.text || 'Heading'}</${Tag}>`;
            } else if (el.type === 'text') {
              innerMarkup = `<div style="font-size: inherit; color: inherit;">${(el.content?.text || 'Paragraph text').replace(/\n/g, '<br>')}</div>`;
            } else if (el.type === 'button') {
              if (el.action && el.action.type === 'submit_inputs') {
                innerMarkup = `<button class="site-builder-btn" onclick="submitInputs(event, '${el.action.value || ''}')" style="width: 100%; height: 100%; border: none; background: transparent; color: inherit; font-size: inherit; font-weight: inherit; padding: 0; border-radius: inherit;">${el.content?.text || 'Submit'}</button>`;
              } else {
                innerMarkup = `<button class="site-builder-btn" style="width: 100%; height: 100%; border: none; background: transparent; color: inherit; font-size: inherit; font-weight: inherit; padding: 0; border-radius: inherit;">${el.content?.text || 'Button'}</button>`;
              }
            } else if (el.type === 'image') {
              innerMarkup = `<img src="${el.content?.src}" alt="${el.content?.alt || 'Graphic'}" style="width: 100%; height: 100%; display: block; border-radius: inherit;" />`;
            } else if (el.type === 'video') {
              const src = el.content?.src || '';
              const isYoutube = src.includes('youtube.com') || src.includes('youtu.be');
              let embedUrl = src;
              if (isYoutube) {
                if (src.includes('watch?v=')) {
                  embedUrl = src.replace('watch?v=', 'embed/');
                } else if (src.includes('youtu.be/')) {
                  embedUrl = src.replace('youtu.be/', 'youtube.com/embed/');
                }
              }
              if (isYoutube) {
                innerMarkup = `<iframe src="${embedUrl}" frameborder="0" allowfullscreen style="width: 100%; height: 100%; border-radius: inherit;"></iframe>`;
              } else if (src) {
                innerMarkup = `<video src="${src}" controls style="width: 100%; height: 100%; border-radius: inherit;"></video>`;
              }
            } else if (el.type === 'divider') {
              innerMarkup = `<hr style="border: none; border-top: ${el.styles?.height || 1}px solid ${el.styles?.backgroundColor || '#ccc'}; margin: 0;" />`;
            } else if (el.type === 'spacer') {
              innerMarkup = `<div style="height: 100%;"></div>`;
            } else if (el.type === 'form') {
              const formBg = el.styles?.backgroundColor || '#1e293b';
              const formTextColor = el.styles?.color || '#ffffff';
              const formPadding = el.styles?.padding || '20';
              const formRadius = el.styles?.borderRadius || '8';
              const btnBg = el.styles?.buttonBgColor || '#6366f1';
              const btnColor = el.styles?.buttonTextColor || '#ffffff';
              
              const fields = el.content?.fields || [
                { id: 'field_name', type: 'text', label: 'Name', required: true, placeholder: 'Sender Name' },
                { id: 'field_email', type: 'email', label: 'Email Address', required: true, placeholder: 'Sender Email' },
                { id: 'field_message', type: 'textarea', label: 'Message', required: true, placeholder: 'Message content...' }
              ];

              innerMarkup = `
                <form class="platform-contact-form" onsubmit="submitContactForm(event)" style="background: ${formBg}; color: ${formTextColor}; padding: ${formPadding}px; border-radius: ${formRadius}px;">
                  ${fields.map(field => `
                    <div class="form-group">
                      <label>${field.label}</label>
                      ${field.type === 'textarea' ? `
                        <textarea name="${field.id}" ${field.required ? 'required' : ''} placeholder="${field.placeholder || ''}" rows="3"></textarea>
                      ` : `
                        <input type="${field.type}" name="${field.id}" ${field.required ? 'required' : ''} placeholder="${field.placeholder || ''}" />
                      `}
                    </div>
                  `).join('')}
                  <button type="submit" class="form-submit-btn" style="background-color: ${btnBg}; color: ${btnColor}; border-radius: 4px;">
                    ${el.content?.buttonText || 'Send Message'}
                  </button>
                </form>
              `;
            } else if (el.type === 'input') {
              innerMarkup = `
                <div style="display: flex; flex-direction: column; gap: 5px; width: 100%;">
                  <label style="font-size: 12px; font-weight: bold;">${el.content?.label || 'Input Label'}</label>
                  <input 
                    type="${el.content?.inputType || 'text'}" 
                    placeholder="${el.content?.placeholder || ''}" 
                    name="${el.content?.name || el.id}"
                    ${el.content?.required ? 'required' : ''}
                    style="padding: 8px 12px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.1); background: rgba(0,0,0,0.02); color: inherit; width: 100%; font-size: 14px;" 
                  />
                </div>
              `;
            }

            let wrapStart = '';
            let wrapEnd = '';
            if (el.action && el.action.type && el.action.type !== 'none') {
              const { type, value, subject, openInNewTab } = el.action;
              if (type === 'url') {
                wrapStart = `<a href="${value || '#'}" target="${openInNewTab ? '_blank' : '_self'}" rel="noopener noreferrer" style="text-decoration: none; color: inherit; display: block; width: 100%; height: 100%;">`;
                wrapEnd = `</a>`;
              } else if (type === 'page') {
                wrapStart = `<a href="${value === 'home' ? 'index.html' : `${value}.html`}" style="text-decoration: none; color: inherit; display: block; width: 100%; height: 100%;">`;
                wrapEnd = `</a>`;
              } else if (type === 'anchor') {
                wrapStart = `<a href="#${value || ''}" style="text-decoration: none; color: inherit; display: block; width: 100%; height: 100%;">`;
                wrapEnd = `</a>`;
              } else if (type === 'email') {
                wrapStart = `<a href="mailto:${value || ''}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}" style="text-decoration: none; color: inherit; display: block; width: 100%; height: 100%;">`;
                wrapEnd = `</a>`;
              } else if (type === 'form') {
                wrapStart = `<div onclick="openContactFormModal()" style="cursor: pointer; width: 100%; height: 100%;">`;
                wrapEnd = `</div>`;
              }
            }

            bodyHtml += `
              <div class="element-wrapper" data-element-id="${el.id}" style="${elStyles}">
                ${wrapStart}
                ${innerMarkup}
                ${wrapEnd}
              </div>
            `;
          });

          bodyHtml += `
            </div>
          `;
        });

        bodyHtml += `
          </div>
        `;
      });

      bodyHtml += `
          </div>
        </section>
      `;
    });

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${page.meta_title || currentSite.name}</title>
        <meta name="description" content="${page.meta_description || ''}">
        <style>
          ${styles}
        </style>
      </head>
      <body>
        ${navHtml}
        ${bodyHtml}

        <div id="contact-modal" class="modal-overlay">
          <div class="modal-content">
            <button class="modal-close" onclick="closeContactFormModal()">✕</button>
            <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">Contact Us</h3>
            <p style="font-size: 13px; margin-bottom: 20px; opacity: 0.7;">Please fill out the form below. We will get back to you shortly.</p>
            <form onsubmit="submitContactForm(event)">
              <div class="form-group">
                <label>Name</label>
                <input type="text" name="name" required />
              </div>
              <div class="form-group">
                <label>Email Address</label>
                <input type="email" name="email" required />
              </div>
              <div class="form-group">
                <label>Message</label>
                <textarea name="message" required rows="4" style="resize: none;"></textarea>
              </div>
              <button type="submit" class="form-submit-btn" style="background-color: var(--primary); color: #ffffff; border-radius: 6px;">
                Submit Message
              </button>
            </form>
          </div>
        </div>

        <script>
          function openContactFormModal() {
            document.getElementById('contact-modal').classList.add('active');
          }
          function closeContactFormModal() {
            document.getElementById('contact-modal').classList.remove('active');
          }
          async function submitContactForm(event) {
            event.preventDefault();
            const form = event.target;
            const data = {
              name: form.name.value,
              email: form.email.value,
              message: form.message.value
            };
            try {
              const response = await fetch('http://localhost:8001/api/sites/${siteId}/submit-message/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
              });
              if (response.ok) {
                alert('Thank you! Your message has been sent successfully.');
                form.reset();
                closeContactFormModal();
              } else {
                alert('Oops, something went wrong. Please try again.');
              }
            } catch (error) {
              console.error('Error submitting form:', error);
              alert('Network error. Please try again.');
            }
          }

          async function submitInputs(event, endpointUrl) {
            event.preventDefault();
            const data = {};
            const inputs = document.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
              if (input.name) {
                if (input.type === 'checkbox') {
                  data[input.name] = input.checked;
                } else {
                  data[input.name] = input.value;
                }
              }
            });
            const targetUrl = endpointUrl || 'http://localhost:8001/api/sites/${siteId}/submit-data/';
            try {
              const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
              });
              if (response.ok) {
                alert('Data submitted successfully!');
                inputs.forEach(input => {
                  if (input.type === 'checkbox') input.checked = false;
                  else input.value = '';
                });
              } else {
                alert('Failed to submit form.');
              }
            } catch (error) {
              console.error(error);
              alert('Network error.');
            }
          }
        </script>
      </body>
      </html>
    `;
  };

  const exportProjectToDevice = async () => {
    try {
      const zip = new JSZip();
      zip.file(`${site.subdomain || 'website'}_backup.json`, JSON.stringify({ site, pages, exportedAt: new Date().toISOString() }, null, 2));

      for (const page of pages) {
        const pageHtml = compileToStaticHtml(page, site, pages); 
        const fileName = page.slug === 'home' ? 'index.html' : `${page.slug || 'page'}.html`;
        zip.file(fileName, pageHtml);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${site.subdomain || 'website'}_full_export.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Export failed:", error);
      alert('حدث خطأ أثناء التصدير');
    }
  };

  const updateLayout = (newLayout, pushToHistory = true) => {
    setActiveLayout(newLayout);
    if (pushToHistory) {
      const newHistory = history.slice(0, historyPointer + 1);
      newHistory.push(JSON.stringify(newLayout));
      setHistory(newHistory);
      setHistoryPointer(newHistory.length - 1);
    }
    savePageLayout(newLayout);
  };

  const saveTimeout = useRef(null);
  const savePageLayout = (layoutData) => {
    if (!activePage) return;
    setIsSaving(true);
    
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    
    saveTimeout.current = setTimeout(async () => {
      try {
        await fetch(`/api/pages/${activePage.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            layout: layoutData,
            meta_description: activePage.meta_description || ''
          })
        });
      } catch (err) {
        console.error('Autosave page failed:', err);
      } finally {
        setIsSaving(false);
      }
    }, 1500);
  };

  const handleUndo = () => {
    if (historyPointer > 0) {
      const nextPointer = historyPointer - 1;
      setHistoryPointer(nextPointer);
      const prevLayout = JSON.parse(history[nextPointer]);
      setActiveLayout(prevLayout);
      savePageLayout(prevLayout);
    }
  };

  const handleRedo = () => {
    if (historyPointer < history.length - 1) {
      const nextPointer = historyPointer + 1;
      setHistoryPointer(nextPointer);
      const nextLayout = JSON.parse(history[nextPointer]);
      setActiveLayout(nextLayout);
      savePageLayout(nextLayout);
    }
  };

  const getSelectedElement = () => {
    if (!selectedElementId) return null;
    for (let sec of activeLayout) {
      for (let row of sec.rows || []) {
        for (let col of row.columns || []) {
          for (let el of col.elements || []) {
            if (el.id === selectedElementId) return el;
          }
        }
      }
    }
    return null;
  };

  const selectedElement = getSelectedElement();

  const updateSelectedElement = (updates) => {
    const nextLayout = activeLayout.map(sec => ({
      ...sec,
      rows: (sec.rows || []).map(row => ({
        ...row,
        columns: (row.columns || []).map(col => ({
          ...col,
          elements: (col.elements || []).map(el => {
            if (el.id === selectedElementId) {
              return {
                ...el,
                content: { ...el.content, ...updates.content },
                styles: { ...el.styles, ...updates.styles },
                animation: { ...el.animation, ...updates.animation },
                action: { ...el.action, ...updates.action },
                hoverStyles: { ...el.hoverStyles, ...updates.hoverStyles }
              };
            }
            return el;
          })
        }))
      }))
    }));
    updateLayout(nextLayout);
  };

  const handleMoveElement = (elementId, direction) => {
    let updated = false;
    const nextLayout = activeLayout.map(sec => ({
      ...sec,
      rows: (sec.rows || []).map(row => ({
        ...row,
        columns: (row.columns || []).map(col => {
          const els = col.elements || [];
          const idx = els.findIndex(e => e.id === elementId);
          if (idx !== -1) {
            const newIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (newIdx >= 0 && newIdx < els.length) {
              const newEls = [...els];
              const temp = newEls[idx];
              newEls[idx] = newEls[newIdx];
              newEls[newIdx] = temp;
              updated = true;
              return { ...col, elements: newEls };
            }
          }
          return col;
        })
      }))
    }));
    if (updated) updateLayout(nextLayout);
  };

  const handleDuplicateElement = (elementId) => {
    let updated = false;
    const nextLayout = activeLayout.map(sec => ({
      ...sec,
      rows: (sec.rows || []).map(row => ({
        ...row,
        columns: (row.columns || []).map(col => {
          const els = col.elements || [];
          const idx = els.findIndex(e => e.id === elementId);
          if (idx !== -1) {
            const clone = JSON.parse(JSON.stringify(els[idx]));
            clone.id = `el_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const newEls = [...els];
            newEls.splice(idx + 1, 0, clone);
            updated = true;
            return { ...col, elements: newEls };
          }
          return col;
        })
      }))
    }));
    if (updated) updateLayout(nextLayout);
  };

  const handleDeleteElement = (elementId) => {
    let updated = false;
    const nextLayout = activeLayout.map(sec => ({
      ...sec,
      rows: (sec.rows || []).map(row => ({
        ...row,
        columns: (row.columns || []).map(col => {
          const els = col.elements || [];
          const idx = els.findIndex(e => e.id === elementId);
          if (idx !== -1) {
            const newEls = els.filter(e => e.id !== elementId);
            updated = true;
            if (selectedElementId === elementId) setSelectedElementId(null);
            return { ...col, elements: newEls };
          }
          return col;
        })
      }))
    }));
    if (updated) updateLayout(nextLayout);
  };

  const handleAddElement = (type) => {
    const defaultElements = {
      heading: {
        type: 'heading',
        content: { tag: 'h2', text: 'New Heading Segment' },
        styles: { fontSize: '32', color: '#ffffff', marginBottom: '15' }
      },
      text: {
        type: 'text',
        content: { text: 'Write your rich paragraph details here. Click style settings to configure background, padding, and size.' },
        styles: { fontSize: '15', color: '#cbd5e1', marginBottom: '15', lineHeight: '1.6' }
      },
      button: {
        type: 'button',
        content: { text: 'Click Action', link: '#' },
        styles: { backgroundColor: '#6366f1', color: '#ffffff', padding: '10 20', borderRadius: '6', fontWeight: 'bold' }
      },
      image: {
        type: 'image',
        content: { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80', alt: 'Visual Graphic' },
        styles: { borderRadius: '6', marginBottom: '15' }
      },
      video: {
        type: 'video',
        content: { src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        styles: { marginBottom: '15' }
      },
      divider: {
        type: 'divider',
        content: {},
        styles: { height: '1', backgroundColor: '#e2e8f0', marginTop: '15', marginBottom: '15' }
      },
      spacer: {
        type: 'spacer',
        content: {},
        styles: { height: '30' }
      },
      form: {
        type: 'form',
        content: {
          fields: [
            { id: 'field_name', type: 'text', label: 'Name', required: true, placeholder: 'Sender Name' },
            { id: 'field_email', type: 'email', label: 'Email Address', required: true, placeholder: 'Sender Email' },
            { id: 'field_message', type: 'textarea', label: 'Message', required: true, placeholder: 'Message content...' }
          ]
        },
        styles: { padding: '20', backgroundColor: '#1e293b', borderRadius: '8' }
      },
      input: {
        type: 'input',
        content: { label: 'Form Input', placeholder: 'Enter details...', inputType: 'text', name: 'input_field', required: false },
        styles: { color: '#ffffff', marginBottom: '15' }
      }
    };

    const newEl = {
      id: `el_${Date.now()}`,
      ...defaultElements[type]
    };

    let nextLayout = [...activeLayout];
    if (nextLayout.length === 0) {
      nextLayout.push({
        id: `sec_${Date.now()}`,
        type: 'section',
        settings: { backgroundColor: '#0f172a', paddingTop: '50', paddingBottom: '50', textColor: '#ffffff' },
        rows: [
          {
            id: `row_${Date.now()}`,
            settings: {},
            columns: [
              {
                id: `col_${Date.now()}`,
                settings: { width: '12' },
                elements: []
              }
            ]
          }
        ]
      });
    }

    let added = false;
    nextLayout = nextLayout.map(sec => ({
      ...sec,
      rows: (sec.rows || []).map(row => ({
        ...row,
        columns: (row.columns || []).map(col => {
          if ((selectedColumnId && col.id === selectedColumnId) || (!selectedColumnId && !added)) {
            added = true;
            return {
              ...col,
              elements: [...(col.elements || []), newEl]
            };
          }
          return col;
        })
      }))
    }));

    updateLayout(nextLayout);
    setSelectedElementId(newEl.id);
  };

  const handleDropElement = (e, columnId) => {
    const type = e.dataTransfer.getData("elementType");
    if (!type) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const defaultElements = {
      heading: {
        type: 'heading',
        content: { tag: 'h2', text: 'New Heading Segment' },
        styles: { fontSize: '32', color: '#ffffff', marginBottom: '15' }
      },
      text: {
        type: 'text',
        content: { text: 'Write your rich paragraph details here. Click style settings to configure background, padding, and size.' },
        styles: { fontSize: '15', color: '#cbd5e1', marginBottom: '15', lineHeight: '1.6' }
      },
      button: {
        type: 'button',
        content: { text: 'Click Action', link: '#' },
        styles: { backgroundColor: '#6366f1', color: '#ffffff', padding: '10 20', borderRadius: '6', fontWeight: 'bold' }
      },
      image: {
        type: 'image',
        content: { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80', alt: 'Visual Graphic' },
        styles: { borderRadius: '6', marginBottom: '15' }
      },
      video: {
        type: 'video',
        content: { src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        styles: { marginBottom: '15' }
      },
      divider: {
        type: 'divider',
        content: {},
        styles: { height: '1', backgroundColor: '#e2e8f0', marginTop: '15', marginBottom: '15' }
      },
      spacer: {
        type: 'spacer',
        content: {},
        styles: { height: '30' }
      },
      form: {
        type: 'form',
        content: {
          fields: [
            { id: 'field_name', type: 'text', label: 'Name', required: true, placeholder: 'Sender Name' },
            { id: 'field_email', type: 'email', label: 'Email Address', required: true, placeholder: 'Sender Email' },
            { id: 'field_message', type: 'textarea', label: 'Message', required: true, placeholder: 'Message content...' }
          ]
        },
        styles: { padding: '20', backgroundColor: '#1e293b', borderRadius: '8' }
      },
      input: {
        type: 'input',
        content: { label: 'Form Input', placeholder: 'Enter details...', inputType: 'text', name: 'input_field', required: false },
        styles: { color: '#ffffff', marginBottom: '15' }
      }
    };

    const newEl = {
      id: `el_${Date.now()}`,
      x: Math.max(0, x - 100),
      y: Math.max(0, y - 20),
      width: 250,
      height: type === 'form' ? 320 : type === 'text' ? 80 : 50,
      ...defaultElements[type]
    };

    const nextLayout = activeLayout.map(sec => ({
      ...sec,
      rows: (sec.rows || []).map(row => ({
        ...row,
        columns: (row.columns || []).map(col => {
          if (col.id === columnId) {
            return {
              ...col,
              elements: [...(col.elements || []), newEl]
            };
          }
          return col;
        })
      }))
    }));

    updateLayout(nextLayout);
    setSelectedElementId(newEl.id);
  };

  const handleAddSection = (columnsCount) => {
    const secId = `sec_${Date.now()}`;
    const rowId = `row_${Date.now()}`;
    
    const columns = [];
    const width = columnsCount === 1 ? '12' : columnsCount === 2 ? '6' : '4';
    
    for (let i = 0; i < columnsCount; i++) {
      columns.push({
        id: `col_${Date.now()}_${i}`,
        settings: { width: width, padding: '15' },
        elements: []
      });
    }

    const newSection = {
      id: secId,
      type: 'section',
      settings: {
        backgroundColor: site?.theme?.backgroundColor || '#1e293b',
        paddingTop: '60',
        paddingBottom: '60',
        containerWidth: '1200px'
      },
      rows: [
        {
          id: rowId,
          settings: {},
          columns: columns
        }
      ]
    };

    updateLayout([...activeLayout, newSection]);
  };

  const handleDeleteSection = (secId) => {
    if (activeLayout.length <= 1) {
      alert("Your page must contain at least one section.");
      return;
    }
    const nextLayout = activeLayout.filter(s => s.id !== secId);
    updateLayout(nextLayout);
  };

  const saveSiteConfig = async (updatedSite) => {
    setSite(updatedSite);
    setIsSaving(true);
    try {
      await fetch(`/api/sites/${siteId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: updatedSite.theme,
          custom_css: updatedSite.custom_css
        })
      });
    } catch (err) {
      console.error('Save site settings failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePage = async (e) => {
    e.preventDefault();
    if (!newPageTitle || !newPageSlug) return;
    
    try {
      const token = localStorage.getItem('access_token'); 
      const res = await fetch('/api/pages/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '' 
        },
        body: JSON.stringify({
          site: parseInt(siteId),
          title: newPageTitle,
          slug: newPageSlug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
          layout: [
            {
              id: `sec_${Date.now()}`,
              type: 'section',
              settings: { backgroundColor: site?.theme?.backgroundColor || '#ffffff', paddingTop: '60', paddingBottom: '60' },
              rows: [{
                id: `row_${Date.now()}`,
                settings: {},
                columns: [{
                  id: `col_${Date.now()}`,
                  settings: { width: '12' },
                  elements: [{
                    id: `el_init_${Date.now()}`,
                    type: 'heading',
                    content: { tag: 'h2', text: `Welcome to ${newPageTitle}` },
                    styles: { fontSize: '32', color: site?.theme?.textColor || '#333333', marginBottom: '15' }
                  }]
                }]
              }]
            }
          ]
        })
      });

      if (res.ok) {
        const pageData = await res.json();
        setPages([...pages, pageData]);
        setActivePage(pageData);
        setActiveLayout(pageData.layout);
        setNewPageTitle('');
        setNewPageSlug('');
        setShowNewPageModal(false);
      } else {
        if (res.status === 401) {
          alert('Unauthorized: Please ensure you are logged in.');
        } else if (res.status === 400) {
          alert('Slug is already in use on this website or the data is invalid.');
        } else {
          alert(`An unexpected error occurred: ${res.status}`);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to the server.');
    }
  };

  const handleDeleteClick = (pageId, e) => {
    e.stopPropagation(); 
    setPageToDelete(pageId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeletePage = async () => {
    if (!pageToDelete) return;

    try {
      const token = localStorage.getItem('access_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://127.0.0.1:8000/api/pages/${pageToDelete}/`, {
        method: 'DELETE',
        headers: headers,
      });

      if (response.ok) {
        const remaining = pages.filter(p => p.id !== pageToDelete);
        setPages(remaining);

        if (activePage?.id === pageToDelete) {
          if (remaining.length > 0) {
            const nextPage = remaining[0];
            setActivePage(nextPage);
            setActiveLayout(nextPage.layout || []);
            setHistory([JSON.stringify(nextPage.layout || [])]);
            setHistoryPointer(0);
          } else {
            setActivePage(null);
            setActiveLayout([]);
            setHistory([]);
            setHistoryPointer(-1);
          }
        }
      } else {
        const errorData = await response.json();
        console.error('Deletion failed:', errorData);
        alert('Failed to delete the page. Server returned an error.');
      }
    } catch (err) {
      console.error('Connection error:', err);
      alert('A network error occurred. Please check your connection.');
    } finally {
      setIsDeleteModalOpen(false);
      setPageToDelete(null);
    }
  };

  const handleCommitRename = async (pageId) => {
    const trimmed = renamePageValue.trim();
    if (!trimmed) { setRenamingPageId(null); return; }
    const target = pages.find(p => p.id === pageId);
    if (!target) { setRenamingPageId(null); return; }

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:8000/api/pages/${pageId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ title: trimmed })
      });
      if (res.ok) {
        setPages(prev => prev.map(p => p.id === pageId ? { ...p, title: trimmed } : p));
        if (activePage?.id === pageId) setActivePage(prev => ({ ...prev, title: trimmed }));
      }
    } catch (err) { console.error('Rename failed:', err); }
    setRenamingPageId(null);
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setPageToDelete(null);
  };

  const handleSwitchPage = (page) => {
    setActivePage(page);
    setActiveLayout(page.layout || []);
    setSelectedElementId(null);
    setSelectedColumnId(null);
    setHistory([JSON.stringify(page.layout || [])]);
    setHistoryPointer(0);
  };

  const handlePublishToggle = async (shouldPublish) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: shouldPublish })
      });
      if (res.ok) {
        const updated = await res.json();
        setSite(updated);
        if (shouldPublish) {
          setShowPublishModal(true);
        }
      }
    } catch (err) {
      console.error('Failed to change publish status:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const renderInlineStyles = (stylesObj) => {
    if (!stylesObj) return {};
    const styles = {};
    Object.keys(stylesObj).forEach(k => {
      let val = stylesObj[k];
      if ([
        'fontSize', 'padding', 'margin', 'borderRadius', 'borderWidth',
        'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
        'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
        'height', 'width', 'maxWidth'
      ].includes(k) && !isNaN(val) && val !== '') {
        val = `${val}px`;
      }
      styles[k] = val;
    });
    return styles;
  };

  const getPageBgColor = () => {
    try {
      if (activePage?.meta_description && activePage.meta_description.startsWith('{')) {
        const settings = JSON.parse(activePage.meta_description);
        if (settings.useGlobalBackground === false) {
          return settings.backgroundColor || '#ffffff';
        }
      }
    } catch (e) {}
    return site?.theme?.backgroundColor || '#ffffff';
  };

  const getHoverStylesCss = () => {
    let css = '';
    activeLayout.forEach(sec => {
      sec.rows?.forEach(row => {
        row.columns?.forEach(col => {
          col.elements?.forEach(el => {
            if (el.hoverStyles) {
              let hoverRules = '';
              if (el.hoverStyles.backgroundColor) hoverRules += `background-color: ${el.hoverStyles.backgroundColor} !important; `;
              if (el.hoverStyles.color) hoverRules += `color: ${el.hoverStyles.color} !important; `;
              if (el.hoverStyles.opacity) hoverRules += `opacity: ${el.hoverStyles.opacity} !important; `;
              if (el.hoverStyles.transform) hoverRules += `transform: ${el.hoverStyles.transform} !important; `;
              
              if (hoverRules) {
                css += `
                  [data-element-id="${el.id}"] {
                    transition: all ${el.hoverStyles.transitionSpeed || '0.2'}s ease-in-out !important;
                  }
                  [data-element-id="${el.id}"]:hover {
                    ${hoverRules}
                  }
                `;
              }
            }
          });
        });
      });
    });
    return css;
  };

  const renderCanvasElement = (el) => {
    const isSelected = selectedElementIds.includes(el.id);
    const styles = renderInlineStyles(el.styles);
    const isInlineEditing = inlineEditingId === el.id;

    const overlayControls = !isPreview && (
      <div className="element-overlay-controls">
        <button onClick={(e) => { e.stopPropagation(); handleMoveElement(el.id, 'up'); }} title="Move Up"><ArrowUp size={12} /></button>
        <button onClick={(e) => { e.stopPropagation(); handleMoveElement(el.id, 'down'); }} title="Move Down"><ArrowDown size={12} /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDuplicateElement(el.id); }} title="Duplicate"><Copy size={12} /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDeleteElement(el.id); }} style={{ color: '#ff4d4d' }} title="Delete"><Trash2 size={12} /></button>
      </div>
    );

    const handleElClick = (e) => {
      if (isPreview) return;
      e.stopPropagation();
      setSelectedElementId(el.id);
      setSelectedColumnId(null);
    };

    const handleElDoubleClick = (e) => {
      if (isPreview) return;
      if (!['heading', 'text', 'button'].includes(el.type)) return;
      e.stopPropagation();
      setInlineEditingId(el.id);
      setTimeout(() => { if (inlineEditRef.current) inlineEditRef.current.focus(); }, 50);
    };

    const commitInlineEdit = (newText) => {
      updateSelectedElement({ content: { text: newText } });
      setInlineEditingId(null);
    };

    const getAnimationStyles = (el) => {
      if (!el.animation || !el.animation.type || el.animation.type === 'none') return {};
      return {
        animationName: el.animation.type,
        animationDuration: `${el.animation.duration || 1}s`,
        animationDelay: `${el.animation.delay || 0}s`,
        animationIterationCount: el.animation.iteration || '1',
        animationFillMode: 'both'
      };
    };

    const getWrappedContent = (content) => {
      if (!isPreview || !el.action || el.action.type === 'none') {
        return content;
      }
      if (el.action.type === 'url') {
        return (
          <a href={el.action.value || '#'} target={el.action.openInNewTab ? '_blank' : '_self'} rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'block', width: '100%', height: '100%' }}>
            {content}
          </a>
        );
      }
      if (el.action.type === 'page') {
        return (
          <a href="#" onClick={(e) => { e.preventDefault(); const targetPage = pages.find(p => p.slug === el.action.value); if (targetPage) handleSwitchPage(targetPage); }} style={{ textDecoration: 'none', color: 'inherit', display: 'block', width: '100%', height: '100%' }}>
            {content}
          </a>
        );
      }
      if (el.action.type === 'anchor') {
        return (
          <a href={`#${el.action.value}`} onClick={(e) => { e.preventDefault(); const sectionEl = document.getElementById(el.action.value); if (sectionEl) sectionEl.scrollIntoView({ behavior: 'smooth' }); }} style={{ textDecoration: 'none', color: 'inherit', display: 'block', width: '100%', height: '100%' }}>
            {content}
          </a>
        );
      }
      if (el.action.type === 'email') {
        return (
          <a href={`mailto:${el.action.value}${el.action.subject ? `?subject=${encodeURIComponent(el.action.subject)}` : ''}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', width: '100%', height: '100%' }}>
            {content}
          </a>
        );
      }
      if (el.action.type === 'form') {
        return (
          <div onClick={(e) => { e.stopPropagation(); setActiveFormEl(el); }} style={{ cursor: 'pointer', width: '100%', height: '100%' }}>
            {content}
          </div>
        );
      }
      return content;
    };

    const wrapWithRnd = (elementInnerContent, inlineStyles = {}) => {
      return (
        <Rnd
          key={`${el.id}_${isPreview}`}
          size={{ 
            width: el.width || '100%', 
            height: el.height || 'auto' 
          }}
          position={{ 
            x: el.x || 0, 
            y: el.y || 0 
          }}
          disableDragging={isPreview}
          enableResizing={!isPreview}
          bounds="parent"
          maxWidth={1200}
          onDragStop={(e, d) => {
            const nextLayout = activeLayout.map(sec => ({
              ...sec,
              rows: (sec.rows || []).map(row => ({
                ...row,
                columns: (row.columns || []).map(col => ({
                  ...col,
                  elements: (col.elements || []).map(element => {
                    if (element.id === el.id) {
                      return { ...element, x: d.x, y: d.y };
                    }
                    return element;
                  })
                }))
              }))
            }));
            updateLayout(nextLayout);
          }}
          onResizeStop={(e, direction, ref, delta, position) => {
            const nextLayout = activeLayout.map(sec => ({
              ...sec,
              rows: (sec.rows || []).map(row => ({
                ...row,
                columns: (row.columns || []).map(col => ({
                  ...col,
                  elements: (col.elements || []).map(element => {
                    if (element.id === el.id) {
                      return {
                        ...element,
                        width: parseInt(ref.style.width),
                        height: parseInt(ref.style.height),
                        x: position.x,
                        y: position.y
                      };
                    }
                    return element;
                  })
                }))
              }))
            }));
            updateLayout(nextLayout);
          }}
          onClick={handleElClick}
          onDoubleClick={handleElDoubleClick}
          className={`builder-canvas-element ${isSelected && !isPreview ? 'selected' : ''}`}
          data-element-id={el.id}
          style={{
            position: 'absolute',
            display: 'inline-block',
            zIndex: isSelected ? 50 : 10,
            border: isSelected && !isPreview ? '2px dashed #6366f1' : 'none',
            ...inlineStyles,
            ...getAnimationStyles(el)
          }}
        >
          {overlayControls}
          {getWrappedContent(elementInnerContent)}
        </Rnd>
      );
    };

    if (el.type === 'heading') {
      const Tag = el.content?.tag || 'h2';
      if (isInlineEditing) {
        return wrapWithRnd(
          <Tag style={styles}>
            <span
              ref={inlineEditRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => commitInlineEdit(e.target.innerText)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } if (e.key === 'Escape') { setInlineEditingId(null); } }}
              style={{ outline: 'none', display: 'block', minWidth: '60px' }}
            >
              {el.content?.text || 'Heading'}
            </span>
          </Tag>
        );
      }
      return wrapWithRnd(<Tag style={styles}>{el.content?.text || 'Heading'}</Tag>);
    }

    if (el.type === 'text') {
      if (isInlineEditing) {
        return wrapWithRnd(
          <div
            ref={inlineEditRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => commitInlineEdit(e.target.innerText)}
            onKeyDown={(e) => { if (e.key === 'Escape') { setInlineEditingId(null); } }}
            style={{ ...styles, outline: 'none', minHeight: '1em', whiteSpace: 'pre-wrap' }}
          >
            {el.content?.text || 'Paragraph text'}
          </div>
        );
      }
      return wrapWithRnd(
        <div style={styles} dangerouslySetInnerHTML={{ __html: (el.content?.text || 'Paragraph text').replace(/\n/g, '<br>') }} />
      );
    }

    if (el.type === 'button') {
      if (isInlineEditing) {
        return wrapWithRnd(
          <button className="site-builder-btn" style={{ border: 'none', cursor: 'pointer', ...styles }}>
            <span
              ref={inlineEditRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => commitInlineEdit(e.target.innerText)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } if (e.key === 'Escape') { setInlineEditingId(null); } }}
              style={{ outline: 'none' }}
            >
              {el.content?.text || 'Click Action'}
            </span>
          </button>,
          { display: 'inline-block' }
        );
      }
      return wrapWithRnd(
        <button className="site-builder-btn" style={{ border: 'none', cursor: 'pointer', ...styles }}>
          {el.content?.text || 'Click Action'}
        </button>,
        { display: 'inline-block' }
      );
    }

    if (el.type === 'image') {
      return wrapWithRnd(
        <img src={el.content?.src} alt={el.content?.alt || 'Graphic'} style={{ width: '100%', height: '100%', display: 'block', ...styles }} />
      );
    }

    if (el.type === 'video') {
      const src = el.content?.src || '';
      const isYoutube = src.includes('youtube.com') || src.includes('youtu.be');
      let embedUrl = src;
      if (isYoutube) {
        if (src.includes('watch?v=')) {
          embedUrl = src.replace('watch?v=', 'embed/');
        } else if (src.includes('youtu.be/')) {
          embedUrl = src.replace('youtu.be/', 'youtube.com/embed/');
        }
      }

      return wrapWithRnd(
        <div style={{ width: '100%', height: '100%' }}>
          {isYoutube ? (
            <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...styles }}>
              <iframe 
                src={embedUrl} 
                frameBorder="0" 
                allowFullScreen 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              />
            </div>
          ) : src ? (
            <video src={src} controls style={{ width: '100%', height: '100%', ...styles }} />
          ) : (
            <div style={{ padding: '30px', textAlign: 'center', background: '#334155', color: '#94a3b8', borderRadius: '4px', height: '100%', ...styles }}>
              <Play size={24} style={{ marginBottom: '8px' }} />
              <p style={{ fontSize: '13px' }}>Click to configure YouTube video embed link</p>
            </div>
          )}
        </div>
      );
    }

    if (el.type === 'divider') {
      return wrapWithRnd(
        <hr style={{ border: 'none', borderTop: `${el.styles?.height || 1}px solid ${el.styles?.backgroundColor || '#ccc'}`, margin: '10px 0', ...styles }} />
      );
    }

    if (el.type === 'spacer') {
      return wrapWithRnd(
        <div style={{ height: '100%', ...styles }} />
      );
    }

    if (el.type === 'form') {
      const formBg = el.styles?.backgroundColor || '#1e293b';
      const formTextColor = el.styles?.color || '#ffffff';
      const formPadding = el.styles?.padding || '20';
      const formRadius = el.styles?.borderRadius || '8';
      const btnBg = el.styles?.buttonBgColor || '#6366f1';
      const btnColor = el.styles?.buttonTextColor || '#ffffff';

      const fields = el.content?.fields || [
        { id: 'field_name', type: 'text', label: 'Name', required: true, placeholder: 'Sender Name' },
        { id: 'field_email', type: 'email', label: 'Email Address', required: true, placeholder: 'Sender Email' },
        { id: 'field_message', type: 'textarea', label: 'Message', required: true, placeholder: 'Message content...' }
      ];

      return wrapWithRnd(
        <div style={{
          width: '100%',
          padding: `${formPadding}px`,
          background: formBg,
          color: formTextColor,
          borderRadius: `${formRadius}px`,
          border: '1px solid rgba(255,255,255,0.05)',
          ...styles
        }}>
          {fields.map(field => (
            <div key={field.id} style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea disabled rows="3" placeholder={field.placeholder} style={{ background: 'rgba(255,255,255,0.05)', cursor: 'not-allowed', width: '100%', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', color: 'inherit', padding: '8px' }}></textarea>
              ) : (
                <input type={field.type} disabled placeholder={field.placeholder} style={{ background: 'rgba(255,255,255,0.05)', cursor: 'not-allowed', width: '100%', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', color: 'inherit', padding: '8px' }} />
              )}
            </div>
          ))}
          <button type="button" style={{
            backgroundColor: btnBg,
            color: btnColor,
            borderRadius: '4px',
            border: 'none',
            padding: '10px 18px',
            fontWeight: 'bold',
            cursor: 'not-allowed',
            width: '100%'
          }}>
            {el.content?.buttonText || 'Send Message'} (Disabled in editor)
          </button>
        </div>
      );
    }

    if (el.type === 'input') {
      return wrapWithRnd(
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%', ...styles }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>{el.content?.label || 'Input Label'}</label>
          <input 
            type={el.content?.inputType || 'text'} 
            placeholder={el.content?.placeholder} 
            name={el.content?.name || el.id}
            required={el.content?.required}
            disabled={!isPreview}
            style={{ 
              padding: '8px 12px', 
              borderRadius: '4px', 
              border: '1px solid rgba(255,255,255,0.1)', 
              background: 'rgba(255,255,255,0.05)', 
              color: 'inherit',
              width: '100%',
              fontSize: '14px'
            }} 
          />
        </div>
      );
    }

    return null;
  };

  if (!site) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#fff' }}>Loading builder workspace...</div>;
  }

  const getCanvasWidth = () => {
    if (viewMode === 'mobile') return '375px';
    if (viewMode === 'tablet') return '768px';
    return '100%';
  };

  if (!activePage) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#090d16' }}>
        <header className="glass" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 30px', borderBottom: '1px solid var(--border)', height: '65px', zIndex: 200
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={() => navigate('/')} className="btn-secondary" style={{ padding: '8px 12px' }}>
              <ArrowLeft size={16} /> Back
            </button>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold' }}>{site.name}</h2>
          </div>
        </header>
        <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          <aside className="glass" style={{ width: '300px', display: 'flex', borderRight: '1px solid var(--border)', flexShrink: 0, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: 'var(--text-secondary)', fontSize: '13px' }}>
            <Layers size={28} />
            <p>No pages yet</p>
            <button onClick={() => setShowNewPageModal(true)} className="btn-primary" style={{ padding: '8px 16px' }}>
              + Add First Page
            </button>
          </aside>
          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '80px', lineHeight: 1 }}>+</div>
            <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff' }}>No pages yet</h3>
            <p style={{ fontSize: '14px', maxWidth: '300px', textAlign: 'center' }}>Your project has no pages. Create your first page to start building!</p>
            <button onClick={() => setShowNewPageModal(true)} className="btn-primary" style={{ padding: '12px 28px', fontSize: '15px' }}>
              + Create First Page
            </button>
          </div>
          <aside className="glass" style={{ width: '320px', borderLeft: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              <Settings size={28} style={{ marginBottom: '8px' }} />
              <p>Select an element to inspect</p>
            </div>
          </aside>
        </div>
        {showNewPageModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15,23,42,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="glass" style={{ width: '400px', padding: '30px', borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Add Site Page</h3>
              <form onSubmit={handleCreatePage}>
                <div style={{ marginBottom: '15px' }}>
                  <label>Page Title</label>
                  <input type="text" required value={newPageTitle} onChange={(e) => { setNewPageTitle(e.target.value); if (!newPageSlug) setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')); }} placeholder="e.g. Home" />
                </div>
                <div style={{ marginBottom: '25px' }}>
                  <label>URL Slug Path</label>
                  <input type="text" required value={newPageSlug} onChange={(e) => setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="e.g. home" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" onClick={() => setShowNewPageModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Add Page</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Parse page specific background settings from activePage.meta_description
  let pageBgSettings = { backgroundColor: '#ffffff', useGlobalBackground: true };
  try {
    if (activePage?.meta_description && activePage.meta_description.startsWith('{')) {
      pageBgSettings = JSON.parse(activePage.meta_description);
    }
  } catch(e) {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#090d16' }}>
      
      <header className="glass" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 30px',
        borderBottom: '1px solid var(--border)',
        height: '65px',
        zIndex: 200
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => navigate('/')} className="btn-secondary" style={{ padding: '8px 12px' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold' }}>{site.name}</h2>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Page: <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{activePage.title} (/{activePage.slug})</span>
            </p>
          </div>
          {isSaving && (
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RefreshCw size={11} className="animate-spin" /> Autosaving...
            </span>
          )}
        </div>

        {!isPreview && (
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '3px', borderRadius: 'var(--radius-sm)' }}>
            <button 
              onClick={() => setViewMode('desktop')} 
              style={{ padding: '6px 12px', background: viewMode === 'desktop' ? 'var(--primary)' : 'transparent', borderRadius: '4px', border: 'none' }}
              title="Desktop width"
            >
              <Laptop size={15} style={{ color: '#fff' }} />
            </button>
            <button 
              onClick={() => setViewMode('tablet')} 
              style={{ padding: '6px 12px', background: viewMode === 'tablet' ? 'var(--primary)' : 'transparent', borderRadius: '4px', border: 'none' }}
              title="Tablet width"
            >
              <Tablet size={15} style={{ color: '#fff' }} />
            </button>
            <button 
              onClick={() => setViewMode('mobile')} 
              style={{ padding: '6px 12px', background: viewMode === 'mobile' ? 'var(--primary)' : 'transparent', borderRadius: '4px', border: 'none' }}
              title="Mobile width"
            >
              <Smartphone size={15} style={{ color: '#fff' }} />
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isPreview && (
            <>
              <button onClick={handleUndo} disabled={historyPointer <= 0} className="btn-secondary" style={{ padding: '8px 12px', opacity: historyPointer <= 0 ? 0.4 : 1 }}>Undo</button>
              <button onClick={handleRedo} disabled={historyPointer >= history.length - 1} className="btn-secondary" style={{ padding: '8px 12px', opacity: historyPointer >= history.length - 1 ? 0.4 : 1 }}>Redo</button>
            </>
          )}
          <button 
            onClick={saveLayout} 
            disabled={isSaving}
            className="btn-primary" 
            style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', opacity: isSaving ? 0.7 : 1 }}
          >
            {isSaving ? '⏳ Saving...' : 'Save'}
          </button>

          <button 
            onClick={exportProjectToDevice}
            className="btn-secondary" 
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Download project as ZIP archive"
          >
            ⬇ Export ZIP
          </button>

          <button 
            onClick={() => {
              setIsPreview(!isPreview);
              if (!isPreview) {
                setSelectedElementIds([]);
                setSelectedColumnId(null);
              }
            }} 
            className="btn-secondary" 
            style={{ padding: '8px 14px' }}
          >
            {isPreview ? <><EyeOff size={15} /> Edit Workspace</> : <><Eye size={15} /> Live Preview</>}
          </button>
         
          {site.is_published ? (
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => handlePublishToggle(false)} className="btn-secondary" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                Unpublish
              </button>
              <button onClick={() => setShowPublishModal(true)} className="btn-primary" style={{ background: 'var(--accent)' }}>
                <Globe size={15} /> View Link
              </button>
            </div>
          ) : (
            <button onClick={() => handlePublishToggle(true)} className="btn-primary" style={{ background: 'var(--primary)' }}>
              Publish Live
            </button>
          )}
        </div>
      </header>

      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden', position: 'relative' }}>
        
        {!isPreview && (
          <aside className="glass" style={{ width: '300px', display: 'flex', borderRight: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ width: '65px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px 0', gap: '20px' }}>
              <button 
                onClick={() => setActiveLeftTab('elements')} 
                style={{ background: activeLeftTab === 'elements' ? 'var(--primary-glow)' : 'transparent', color: activeLeftTab === 'elements' ? 'var(--primary)' : 'var(--text-secondary)' }}
                className="btn-icon" title="Add Blocks"
              >
                <Plus size={20} />
              </button>
              <button 
                onClick={() => setActiveLeftTab('pages')} 
                style={{ background: activeLeftTab === 'pages' ? 'var(--primary-glow)' : 'transparent', color: activeLeftTab === 'pages' ? 'var(--primary)' : 'var(--text-secondary)' }}
                className="btn-icon" title="Page Tree"
              >
                <Layers size={20} />
              </button>
              <button 
                onClick={() => setActiveLeftTab('theme')} 
                style={{ background: activeLeftTab === 'theme' ? 'var(--primary-glow)' : 'transparent', color: activeLeftTab === 'theme' ? 'var(--primary)' : 'var(--text-secondary)' }}
                className="btn-icon" title="Global Colors"
              >
                <Palette size={20} />
              </button>
              <button 
                onClick={() => setActiveLeftTab('css')} 
                style={{ background: activeLeftTab === 'css' ? 'var(--primary-glow)' : 'transparent', color: activeLeftTab === 'css' ? 'var(--primary)' : 'var(--text-secondary)' }}
                className="btn-icon" title="Custom CSS"
              >
                <FileCode size={20} />
              </button>
            </div>

            <div style={{ flexGrow: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              
              {activeLeftTab === 'elements' && (
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px' }}>Add Elements</h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>💡 Drag and drop blocks directly into any canvas column, or click to auto-add.</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '25px', marginTop: '10px' }}>
                    <button 
                      draggable 
                      onDragStart={(e) => e.dataTransfer.setData("elementType", "heading")}
                      onClick={() => handleAddElement('heading')} 
                      className="btn-secondary" 
                      style={{ flexDirection: 'column', height: '70px', padding: '10px', fontSize: '12px', cursor: 'grab' }}
                    >
                      <Type size={18} /> Heading
                    </button>
                    <button 
                      draggable 
                      onDragStart={(e) => e.dataTransfer.setData("elementType", "text")}
                      onClick={() => handleAddElement('text')} 
                      className="btn-secondary" 
                      style={{ flexDirection: 'column', height: '70px', padding: '10px', fontSize: '12px', cursor: 'grab' }}
                    >
                      <Plus size={18} /> Text
                    </button>
                    <button 
                      draggable 
                      onDragStart={(e) => e.dataTransfer.setData("elementType", "button")}
                      onClick={() => handleAddElement('button')} 
                      className="btn-secondary" 
                      style={{ flexDirection: 'column', height: '70px', padding: '10px', fontSize: '12px', cursor: 'grab' }}
                    >
                      <Square size={18} /> Button
                    </button>
                    <button 
                      draggable 
                      onDragStart={(e) => e.dataTransfer.setData("elementType", "image")}
                      onClick={() => handleAddElement('image')} 
                      className="btn-secondary" 
                      style={{ flexDirection: 'column', height: '70px', padding: '10px', fontSize: '12px', cursor: 'grab' }}
                    >
                      <ImageIcon size={18} /> Image
                    </button>
                    <button 
                      draggable 
                      onDragStart={(e) => e.dataTransfer.setData("elementType", "video")}
                      onClick={() => handleAddElement('video')} 
                      className="btn-secondary" 
                      style={{ flexDirection: 'column', height: '70px', padding: '10px', fontSize: '12px', cursor: 'grab' }}
                    >
                      <Video size={18} /> YouTube
                    </button>
                    <button 
                      draggable 
                      onDragStart={(e) => e.dataTransfer.setData("elementType", "form")}
                      onClick={() => handleAddElement('form')} 
                      className="btn-secondary" 
                      style={{ flexDirection: 'column', height: '70px', padding: '10px', fontSize: '12px', cursor: 'grab' }}
                    >
                      <Mail size={18} /> Contact Form
                    </button>
                    <button 
                      draggable 
                      onDragStart={(e) => e.dataTransfer.setData("elementType", "input")}
                      onClick={() => handleAddElement('input')} 
                      className="btn-secondary" 
                      style={{ flexDirection: 'column', height: '70px', padding: '10px', fontSize: '12px', cursor: 'grab' }}
                    >
                      <Type size={16} style={{ color: 'var(--accent)' }} /> Input Field
                    </button>
                    <button 
                      draggable 
                      onDragStart={(e) => e.dataTransfer.setData("elementType", "divider")}
                      onClick={() => handleAddElement('divider')} 
                      className="btn-secondary" 
                      style={{ flexDirection: 'column', height: '70px', padding: '10px', fontSize: '12px', cursor: 'grab' }}
                    >
                      <Square size={10} /> Divider
                    </button>
                    <button 
                      draggable 
                      onDragStart={(e) => e.dataTransfer.setData("elementType", "spacer")}
                      onClick={() => handleAddElement('spacer')} 
                      className="btn-secondary" 
                      style={{ flexDirection: 'column', height: '70px', padding: '10px', fontSize: '12px', cursor: 'grab' }}
                    >
                      <Plus size={10} /> Spacer
                    </button>
                  </div>

                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '10px', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>Add Layout Row</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button onClick={() => handleAddSection(1)} className="btn-secondary" style={{ fontSize: '12px', justifyContent: 'flex-start' }}>
                      <Square size={16} /> 1 Column (Full Width)
                    </button>
                    <button onClick={() => handleAddSection(2)} className="btn-secondary" style={{ fontSize: '12px', justifyContent: 'flex-start' }}>
                      <Square size={16} /> 2 Columns (50% / 50%)
                    </button>
                    <button onClick={() => handleAddSection(3)} className="btn-secondary" style={{ fontSize: '12px', justifyContent: 'flex-start' }}>
                      <Square size={16} /> 3 Columns (33% each)
                    </button>
                  </div>
                </div>
              )}

              {activeLeftTab === 'pages' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 'bold' }}>Pages</h3>
                    <button onClick={() => setShowNewPageModal(true)} className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }}>+ Add</button>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px' }}>Double-click a page name to rename it.</p>
                  {pages.map(p => (
                    <div
                      key={p.id}
                      onClick={() => { if (renamingPageId !== p.id) handleSwitchPage(p); }}
                      style={{
                        padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: activePage?.id === p.id ? 'var(--primary)' : 'rgba(255,255,255,0.02)',
                        color: activePage?.id === p.id ? '#fff' : 'var(--text-primary)',
                        fontWeight: activePage?.id === p.id ? 'bold' : 'normal'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexGrow: 1, overflow: 'hidden' }}>
                        <span>📄</span>
                        {renamingPageId === p.id ? (
                          <input
                            autoFocus
                            type="text"
                            value={renamePageValue}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setRenamePageValue(e.target.value)}
                            onBlur={() => handleCommitRename(p.id)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCommitRename(p.id); if (e.key === 'Escape') setRenamingPageId(null); }}
                            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid var(--primary)', borderRadius: '4px', color: '#fff', padding: '2px 6px', fontSize: '13px', width: '100%' }}
                          />
                        ) : (
                          <span
                            onDoubleClick={(e) => { e.stopPropagation(); setRenamingPageId(p.id); setRenamePageValue(p.title); }}
                            style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            title="Double-click to rename"
                          >
                            {p.title}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span style={{ fontSize: '10px', opacity: 0.6 }}>/{p.slug}</span>
                        <button
                          onClick={(e) => handleDeleteClick(p.id, e)}
                          title="Delete Page"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', color: '#ef4444' }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}

                  {activePage && (
                    <div style={{ borderTop: '1px solid var(--border)', marginTop: '20px', paddingTop: '15px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px' }}>SEO Details</h4>
                      <div style={{ marginBottom: '10px' }}>
                        <label>Meta Title</label>
                        <input 
                          type="text" 
                          value={activePage.meta_title || ''} 
                          onChange={(e) => {
                            const updated = { ...activePage, meta_title: e.target.value };
                            setActivePage(updated);
                            setPages(pages.map(p => p.id === activePage.id ? updated : p));
                          }}
                          placeholder="Search engine title"
                        />
                      </div>
                      <div>
                        <label>Meta Description</label>
                        <textarea 
                          rows="3"
                          value={activePage.meta_description && activePage.meta_description.startsWith('{') ? '' : (activePage.meta_description || '')} 
                          onChange={(e) => {
                            const updated = { ...activePage, meta_description: e.target.value };
                            setActivePage(updated);
                            setPages(pages.map(p => p.id === activePage.id ? updated : p));
                          }}
                          placeholder="Search engine description preview"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeLeftTab === 'theme' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '5px' }}>Global Styles</h3>

                  <div>
                    <label>Font Family</label>
                    <select
                      value={site.theme?.fontFamily || 'Inter, sans-serif'}
                      onChange={(e) => {
                        const updated = { ...site, theme: { ...site.theme, fontFamily: e.target.value } };
                        saveSiteConfig(updated);
                      }}
                    >
                      <option value="Inter, sans-serif">Inter (Modern Clean)</option>
                      <option value="Outfit, sans-serif">Outfit (Premium Bold)</option>
                      <option value="Plus Jakarta Sans, sans-serif">Jakarta (Elegant)</option>
                      <option value="Playfair Display, Georgia, serif">Playfair (Serif/Warm)</option>
                      <option value="Roboto, sans-serif">Roboto (Structured)</option>
                    </select>
                  </div>

                  <div>
                    <label>Primary Accent Color</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="color" 
                        value={site.theme?.primaryColor || '#6366f1'} 
                        onChange={(e) => {
                          const updated = { ...site, theme: { ...site.theme, primaryColor: e.target.value } };
                          saveSiteConfig(updated);
                        }}
                        style={{ width: '45px', height: '40px', padding: 0, border: 'none', cursor: 'pointer' }}
                      />
                      <input 
                        type="text" 
                        value={site.theme?.primaryColor || '#6366f1'} 
                        onChange={(e) => {
                          const updated = { ...site, theme: { ...site.theme, primaryColor: e.target.value } };
                          saveSiteConfig(updated);
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label>Global Background Color</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="color" 
                        value={site.theme?.backgroundColor || '#ffffff'} 
                        onChange={(e) => {
                          const updated = { ...site, theme: { ...site.theme, backgroundColor: e.target.value } };
                          saveSiteConfig(updated);
                        }}
                        style={{ width: '45px', height: '40px', padding: 0, border: 'none', cursor: 'pointer' }}
                      />
                      <input 
                        type="text" 
                        value={site.theme?.backgroundColor || '#ffffff'} 
                        onChange={(e) => {
                          const updated = { ...site, theme: { ...site.theme, backgroundColor: e.target.value } };
                          saveSiteConfig(updated);
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label>Base Text Color</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="color" 
                        value={site.theme?.textColor || '#333333'} 
                        onChange={(e) => {
                          const updated = { ...site, theme: { ...site.theme, textColor: e.target.value } };
                          saveSiteConfig(updated);
                        }}
                        style={{ width: '45px', height: '40px', padding: 0, border: 'none', cursor: 'pointer' }}
                      />
                      <input 
                        type="text" 
                        value={site.theme?.textColor || '#333333'} 
                        onChange={(e) => {
                          const updated = { ...site, theme: { ...site.theme, textColor: e.target.value } };
                          saveSiteConfig(updated);
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px', marginTop: '10px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Page Background Settings</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="pageBgType" 
                          checked={pageBgSettings.useGlobalBackground !== false} 
                          onChange={() => {
                            const newSettings = { ...pageBgSettings, useGlobalBackground: true };
                            const updated = { ...activePage, meta_description: JSON.stringify(newSettings) };
                            setActivePage(updated);
                            setPages(pages.map(p => p.id === activePage.id ? updated : p));
                            savePageLayout(activeLayout);
                          }}
                        />
                        Use Global background color
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="pageBgType" 
                          checked={pageBgSettings.useGlobalBackground === false} 
                          onChange={() => {
                            const newSettings = { ...pageBgSettings, useGlobalBackground: false, backgroundColor: pageBgSettings.backgroundColor || '#ffffff' };
                            const updated = { ...activePage, meta_description: JSON.stringify(newSettings) };
                            setActivePage(updated);
                            setPages(pages.map(p => p.id === activePage.id ? updated : p));
                            savePageLayout(activeLayout);
                          }}
                        />
                        Custom color for this page
                      </label>
                    </div>

                    {pageBgSettings.useGlobalBackground === false && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <input 
                          type="color" 
                          value={pageBgSettings.backgroundColor || '#ffffff'} 
                          onChange={(e) => {
                            const newSettings = { ...pageBgSettings, backgroundColor: e.target.value };
                            const updated = { ...activePage, meta_description: JSON.stringify(newSettings) };
                            setActivePage(updated);
                            setPages(pages.map(p => p.id === activePage.id ? updated : p));
                            savePageLayout(activeLayout);
                          }}
                          style={{ width: '45px', height: '40px', padding: 0, border: 'none', cursor: 'pointer' }}
                        />
                        <input 
                          type="text" 
                          value={pageBgSettings.backgroundColor || '#ffffff'} 
                          onChange={(e) => {
                            const newSettings = { ...pageBgSettings, backgroundColor: e.target.value };
                            const updated = { ...activePage, meta_description: JSON.stringify(newSettings) };
                            setActivePage(updated);
                            setPages(pages.map(p => p.id === activePage.id ? updated : p));
                            savePageLayout(activeLayout);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeLeftTab === 'css' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '5px' }}>Custom Global CSS</h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                    Inject raw styles. Classes: <code>.site-builder-btn</code>, <code>.platform-contact-form</code>
                  </p>
                  <textarea 
                    value={site.custom_css || ''}
                    onChange={(e) => {
                      const updated = { ...site, custom_css: e.target.value };
                      saveSiteConfig(updated);
                    }}
                    placeholder="/* Custom classes and rules */"
                    style={{ flexGrow: 1, fontFamily: 'monospace', fontSize: '12px', background: '#0a0a0c', resize: 'none' }}
                    rows="20"
                  />
                </div>
              )}

            </div>
          </aside>
        )}

        <div 
          ref={viewportRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ 
            flexGrow: 1, 
            padding: isPreview ? '0' : '40px', 
            overflowY: 'auto', 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'flex-start',
            background: '#090d16',
            boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8)',
            position: 'relative'
          }}
        >
          <div 
            style={{
              width: getCanvasWidth(),
              maxWidth: '100%',
              minHeight: '100%',
              backgroundColor: getPageBgColor(),
              color: site.theme?.textColor || '#333333',
              fontFamily: site.theme?.fontFamily || 'Inter, sans-serif',
              boxShadow: isPreview ? 'none' : '0 10px 40px rgba(0,0,0,0.5)',
              borderRadius: isPreview ? '0' : 'var(--radius-md)',
              border: isPreview ? 'none' : '2px solid var(--border)',
              transition: 'width 0.3s ease-in-out, border-radius 0.3s',
              overflow: 'hidden'
            }}
          >
            <style dangerouslySetInnerHTML={{ __html: site.custom_css }} />
            <style dangerouslySetInnerHTML={{ __html: getHoverStylesCss() }} />
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes slideUp {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
              @keyframes slideDown {
                from { transform: translateY(-30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
              @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-15px); }
              }
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              @keyframes zoomIn {
                from { transform: scale(0.9); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
              }
              @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
              }
            ` }} />

            {pages.length > 1 && (
              <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(0,0,0,0.01)' }}>
                <span style={{ fontWeight: 'bold', color: site.theme?.primaryColor || '#6366f1' }}>{site.name}</span>
                <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
                  {pages.map(p => (
                    <span 
                      key={p.id} 
                      onClick={() => handleSwitchPage(p)}
                      style={{ 
                        fontWeight: activePage.id === p.id ? 'bold' : 'normal',
                        borderBottom: activePage.id === p.id ? `2px solid ${site.theme?.primaryColor || '#6366f1'}` : 'none',
                        paddingBottom: '2px',
                        cursor: 'pointer'
                      }}
                    >
                      {p.title}
                    </span>
                  ))}
                </div>
              </nav>
            )}

            <div className="builder-canvas-wrapper" style={{ flex: 1, overflowY: 'auto', width: '100%', height: '100%' }}>
              {activePage && activeLayout ? (
                activeLayout.length === 0 ? (
                  <div style={{ padding: '80px 20px', textAlign: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Sparkles size={48} style={{ marginBottom: '16px', color: 'var(--primary)' }} />
                    <h4 style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '20px' }}>Empty Canvas</h4>
                    <p style={{ fontSize: '14px', maxWidth: '300px', margin: '0 auto 24px' }}>
                      Your site has no sections. Click below to add a column layout to begin!
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => handleAddSection(1)} className="btn-primary" style={{ padding: '10px 20px', cursor: 'pointer' }}>+ 1 Column</button>
                      <button onClick={() => handleAddSection(2)} className="btn-primary" style={{ padding: '10px 20px', cursor: 'pointer' }}>+ 2 Columns</button>
                    </div>
                  </div>
                ) : (
                  activeLayout.map((sec, secIdx) => {
                    const secStyles = renderInlineStyles(sec.settings);
                    const containerWidth = sec.settings?.containerWidth || '1200px';

                    return (
                      <section key={sec.id} style={{ position: 'relative', width: '100%', ...secStyles }} className={isPreview ? '' : 'builder-canvas-section'}>
                        {!isPreview && (
                          <div style={{ position: 'absolute', top: '4px', left: '4px', zIndex: 40, display: 'flex', gap: '4px', background: 'rgba(15,23,42,0.85)', padding: '3px', borderRadius: '4px' }}>
                            <span style={{ fontSize: '10px', color: '#fff', padding: '2px 4px', background: 'var(--primary)', borderRadius: '2px', fontWeight: 'bold' }}>Section</span>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteSection(sec.id); }} style={{ padding: '2px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Delete Section"><Trash2 size={11} /></button>
                          </div>
                        )}
                        <div style={{ maxWidth: containerWidth, margin: '0 auto', padding: '0 20px', boxSizing: 'border-box' }}>
                          {(sec.rows || []).map((row) => (
                            <div key={row.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px', ...renderInlineStyles(row.settings) }} className={isPreview ? '' : 'builder-canvas-row'}>
                              {(row.columns || []).map((col) => {
                                const computedWidth = { '12': '100%', '6': 'calc(50% - 10px)', '4': 'calc(33.33% - 13.33px)', '3': 'calc(25% - 15px)', '8': 'calc(66.66% - 6.66px)', '9': 'calc(75% - 5px)' }[col.settings?.width || '12'] || '100%';
                                return (
                                  <div 
                                    key={col.id} 
                                    onClick={(e) => { if (!isPreview) { e.stopPropagation(); setSelectedColumnId(col.id); } }} 
                                    onDragOver={(e) => {
                                      if (!isPreview) {
                                        e.preventDefault();
                                      }
                                    }}
                                    onDrop={(e) => {
                                      if (!isPreview) {
                                        e.preventDefault();
                                        handleDropElement(e, col.id);
                                      }
                                    }}
                                    style={{ flex: `0 0 ${computedWidth}`, width: computedWidth, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '15px', border: (!isPreview && selectedColumnId === col.id) ? '1px dashed var(--primary)' : '1px dashed transparent', padding: '8px', position: 'relative', minHeight: '450px', ...renderInlineStyles(col.settings) }}
                                  >
                                    {(col.elements || []).map(el => renderCanvasElement(el))}
                                    {!isPreview && (col.elements || []).length === 0 && <div style={{ padding: '15px', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: '4px', textAlign: 'center', color: '#64748b', fontSize: '11px' }}>Column empty. Drag elements here.</div>}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  })
                )
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff', textAlign: 'center' }}>
                  <p>No page selected. Please select or create a new page.</p>
                  <button onClick={() => setShowNewPageModal(true)} style={{ marginTop: '15px', padding: '10px 20px', cursor: 'pointer', background: 'var(--primary)', border: 'none', color: 'white', borderRadius: '5px' }}>
                    + Add New Page
                  </button>
                </div>
              )}
            </div>

          </div>
          
          {isLassoing && lassoStart && lassoEnd && (
            <div style={{
              position: 'absolute',
              left: Math.min(lassoStart.x, lassoEnd.x),
              top: Math.min(lassoStart.y, lassoEnd.y),
              width: Math.abs(lassoStart.x - lassoEnd.x),
              height: Math.abs(lassoStart.y - lassoEnd.y),
              border: '1px dashed #6366f1',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              pointerEvents: 'none',
              zIndex: 9999
            }} />
          )}
        </div>

        {!isPreview && (
          <aside className="glass" style={{ width: '320px', borderLeft: '1px solid var(--border)', padding: '20px', overflowY: 'auto', flexShrink: 0 }}>
            {selectedElement ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    Style Inspector
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 'bold', padding: '2px 6px', background: 'var(--primary-glow)', borderRadius: '4px' }}>
                    {selectedElement.type.toUpperCase()}
                  </span>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Element Content</h4>
                  
                  {['heading', 'text', 'button'].includes(selectedElement.type) && (
                    <div style={{ marginBottom: '12px' }}>
                      <label>Label Text</label>
                      {selectedElement.type === 'text' ? (
                        <textarea
                          rows="4"
                          value={selectedElement.content?.text || ''}
                          onChange={(e) => updateSelectedElement({ content: { text: e.target.value } })}
                        />
                      ) : (
                        <input
                          type="text"
                          value={selectedElement.content?.text || ''}
                          onChange={(e) => updateSelectedElement({ content: { text: e.target.value } })}
                        />
                      )}
                    </div>
                  )}

                  {selectedElement.type === 'heading' && (
                    <div style={{ marginBottom: '12px' }}>
                      <label>Heading Size</label>
                      <select
                        value={selectedElement.content?.tag || 'h2'}
                        onChange={(e) => updateSelectedElement({ content: { tag: e.target.value } })}
                      >
                        <option value="h1">Header 1 (Largest)</option>
                        <option value="h2">Header 2 (Main Section)</option>
                        <option value="h3">Header 3 (Card Subheader)</option>
                        <option value="h4">Header 4 (Block Label)</option>
                      </select>
                    </div>
                  )}

                  {['image', 'video'].includes(selectedElement.type) && (
                    <div style={{ marginBottom: '12px' }}>
                      <label>Source URL</label>
                      <input
                        type="text"
                        value={selectedElement.content?.src || ''}
                        onChange={(e) => updateSelectedElement({ content: { src: e.target.value } })}
                        placeholder="Paste image or YouTube URL here"
                      />
                    </div>
                  )}

                  {selectedElement.type === 'image' && (
                    <div style={{ marginBottom: '12px' }}>
                      <label>Or Upload from Device</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => updateSelectedElement({ content: { src: ev.target.result } });
                          reader.readAsDataURL(file);
                        }}
                        style={{ fontSize: '12px', padding: '4px 0' }}
                      />
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginTop: '3px' }}>Image will be embedded as base64</span>
                    </div>
                  )}

                  {selectedElement.type === 'image' && (
                    <div style={{ marginBottom: '12px' }}>
                      <label>Alternate Description (Alt)</label>
                      <input
                        type="text"
                        value={selectedElement.content?.alt || ''}
                        onChange={(e) => updateSelectedElement({ content: { alt: e.target.value } })}
                        placeholder="Image description"
                      />
                    </div>
                  )}

                  {selectedElement.type === 'input' && (
                    <>
                      <div style={{ marginBottom: '12px' }}>
                        <label>Input Label</label>
                        <input
                          type="text"
                          value={selectedElement.content?.label || ''}
                          onChange={(e) => updateSelectedElement({ content: { label: e.target.value } })}
                        />
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <label>Placeholder Text</label>
                        <input
                          type="text"
                          value={selectedElement.content?.placeholder || ''}
                          onChange={(e) => updateSelectedElement({ content: { placeholder: e.target.value } })}
                        />
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <label>Input Type</label>
                        <select
                          value={selectedElement.content?.inputType || 'text'}
                          onChange={(e) => updateSelectedElement({ content: { inputType: e.target.value } })}
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="email">Email</option>
                          <option value="password">Password</option>
                          <option value="date">Date</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <label>Field Name (API key)</label>
                        <input
                          type="text"
                          value={selectedElement.content?.name || ''}
                          onChange={(e) => updateSelectedElement({ content: { name: e.target.value } })}
                          placeholder="e.g. user_email"
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <input
                          type="checkbox"
                          checked={selectedElement.content?.required || false}
                          onChange={(e) => updateSelectedElement({ content: { required: e.target.checked } })}
                          id="inputRequired"
                          style={{ width: 'auto', cursor: 'pointer' }}
                        />
                        <label htmlFor="inputRequired" style={{ margin: 0, cursor: 'pointer' }}>Is Required</label>
                      </div>
                    </>
                  )}

                  {selectedElement.type === 'form' && (
                    <>
                      <div style={{ marginBottom: '12px' }}>
                        <label>Submit Button Text</label>
                        <input
                          type="text"
                          value={selectedElement.content?.buttonText || 'Send Message'}
                          onChange={(e) => updateSelectedElement({ content: { buttonText: e.target.value } })}
                        />
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <label>Manage Form Fields</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                          {(selectedElement.content?.fields || []).map((field, idx) => (
                            <div key={field.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                              <span style={{ fontSize: '12px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {field.label} ({field.type})
                              </span>
                              <button 
                                onClick={() => {
                                  const filtered = selectedElement.content.fields.filter(f => f.id !== field.id);
                                  updateSelectedElement({ content: { fields: filtered } });
                                }}
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                          <button 
                            onClick={() => {
                              const newField = {
                                id: `field_${Date.now()}`,
                                type: 'text',
                                label: 'Custom Label',
                                placeholder: 'Placeholder text...',
                                required: false
                              };
                              const fields = [...(selectedElement.content?.fields || []), newField];
                              updateSelectedElement({ content: { fields } });
                            }}
                            className="btn-secondary" 
                            style={{ padding: '6px', fontSize: '11px' }}
                          >
                            + Add Custom Field
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Visual Styling</h4>

                  {['heading', 'text', 'button', 'input'].includes(selectedElement.type) && (
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <label>Font Size</label>
                        <span style={{ fontSize: '12px', color: 'var(--primary)' }}>{selectedElement.styles?.fontSize || '16'}px</span>
                      </div>
                      <input
                        type="range"
                        min="12"
                        max="80"
                        value={selectedElement.styles?.fontSize || '16'}
                        onChange={(e) => updateSelectedElement({ styles: { fontSize: e.target.value } })}
                        style={{ padding: 0 }}
                      />
                    </div>
                  )}

                  {['heading', 'text', 'button'].includes(selectedElement.type) && (
                    <div style={{ marginBottom: '15px' }}>
                      <label>Text Align</label>
                      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '3px', borderRadius: '4px' }}>
                        {['left', 'center', 'right'].map(align => (
                          <button
                            key={align}
                            onClick={() => updateSelectedElement({ styles: { textAlign: align } })}
                            style={{
                              flexGrow: 1,
                              padding: '5px',
                              fontSize: '11px',
                              background: selectedElement.styles?.textAlign === align ? 'var(--primary)' : 'transparent',
                              borderRadius: '3px',
                              border: 'none',
                              color: '#fff',
                              textTransform: 'capitalize'
                            }}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                    {['heading', 'text', 'button', 'form', 'input'].includes(selectedElement.type) && (
                      <div>
                        <label>Text Color</label>
                        <input
                          type="color"
                          value={selectedElement.styles?.color || '#333333'}
                          onChange={(e) => updateSelectedElement({ styles: { color: e.target.value } })}
                          style={{ height: '35px', padding: '0', border: 'none', cursor: 'pointer' }}
                        />
                      </div>
                    )}
                    {['button', 'form', 'text'].includes(selectedElement.type) && (
                      <div>
                        <label>Background</label>
                        <input
                          type="color"
                          value={selectedElement.styles?.backgroundColor || '#ffffff'}
                          onChange={(e) => updateSelectedElement({ styles: { backgroundColor: e.target.value } })}
                          style={{ height: '35px', padding: '0', border: 'none', cursor: 'pointer' }}
                        />
                      </div>
                    )}
                  </div>

                  {selectedElement.type === 'form' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                      <div>
                        <label>Btn Background</label>
                        <input
                          type="color"
                          value={selectedElement.styles?.buttonBgColor || '#6366f1'}
                          onChange={(e) => updateSelectedElement({ styles: { buttonBgColor: e.target.value } })}
                          style={{ height: '35px', padding: '0', border: 'none', cursor: 'pointer' }}
                        />
                      </div>
                      <div>
                        <label>Btn Text Color</label>
                        <input
                          type="color"
                          value={selectedElement.styles?.buttonTextColor || '#ffffff'}
                          onChange={(e) => updateSelectedElement({ styles: { buttonTextColor: e.target.value } })}
                          style={{ height: '35px', padding: '0', border: 'none', cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <label>Bottom Margin</label>
                      <span style={{ fontSize: '12px', color: 'var(--primary)' }}>{selectedElement.styles?.marginBottom || '15'}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedElement.styles?.marginBottom || '15'}
                      onChange={(e) => updateSelectedElement({ styles: { marginBottom: e.target.value } })}
                      style={{ padding: 0 }}
                    />
                  </div>

                  {['button', 'image', 'form'].includes(selectedElement.type) && (
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <label>Corner Radius</label>
                        <span style={{ fontSize: '12px', color: 'var(--primary)' }}>{selectedElement.styles?.borderRadius || '4'}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={selectedElement.styles?.borderRadius || '4'}
                        onChange={(e) => updateSelectedElement({ styles: { borderRadius: e.target.value } })}
                        style={{ padding: 0 }}
                      />
                    </div>
                  )}
                  {selectedElement.type === 'spacer' && (
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <label>Spacer Height</label>
                        <span style={{ fontSize: '12px', color: 'var(--primary)' }}>{selectedElement.styles?.height || '30'}px</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="200"
                        value={selectedElement.styles?.height || '30'}
                        onChange={(e) => updateSelectedElement({ styles: { height: e.target.value } })}
                        style={{ padding: 0 }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px', marginTop: '15px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hover Styling</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label>Hover Bg</label>
                      <input
                        type="color"
                        value={selectedElement.hoverStyles?.backgroundColor || '#6366f1'}
                        onChange={(e) => updateSelectedElement({ hoverStyles: { backgroundColor: e.target.value } })}
                        style={{ height: '35px', padding: '0', border: 'none', cursor: 'pointer' }}
                      />
                    </div>
                    <div>
                      <label>Hover Text</label>
                      <input
                        type="color"
                        value={selectedElement.hoverStyles?.color || '#ffffff'}
                        onChange={(e) => updateSelectedElement({ hoverStyles: { color: e.target.value } })}
                        style={{ height: '35px', padding: '0', border: 'none', cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label>Hover Scale</label>
                      <select
                        value={selectedElement.hoverStyles?.transform || 'none'}
                        onChange={(e) => updateSelectedElement({ hoverStyles: { transform: e.target.value } })}
                      >
                        <option value="none">None</option>
                        <option value="scale(1.05)">Zoom In (1.05x)</option>
                        <option value="scale(1.1)">Zoom In (1.1x)</option>
                        <option value="scale(0.95)">Zoom Out (0.95x)</option>
                      </select>
                    </div>
                    <div>
                      <label>Transition (s)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        value={selectedElement.hoverStyles?.transitionSpeed || '0.2'}
                        onChange={(e) => updateSelectedElement({ hoverStyles: { transitionSpeed: parseFloat(e.target.value) } })}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px', marginTop: '15px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Animations</h4>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <label>Animation Effect</label>
                    <select
                      value={selectedElement.animation?.type || 'none'}
                      onChange={(e) => updateSelectedElement({ animation: { type: e.target.value } })}
                    >
                      <option value="none">None (Static)</option>
                      <option value="fadeIn">Fade In</option>
                      <option value="slideUp">Slide Up</option>
                      <option value="slideDown">Slide Down</option>
                      <option value="bounce">Bounce</option>
                      <option value="spin">Spin Loop</option>
                      <option value="zoomIn">Zoom In</option>
                      <option value="pulse">Pulse</option>
                    </select>
                  </div>

                  {selectedElement.animation?.type && selectedElement.animation?.type !== 'none' && (
                    <>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <label>Duration (s)</label>
                          <span style={{ fontSize: '12px', color: 'var(--primary)' }}>{selectedElement.animation?.duration || 1}s</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="10"
                          step="0.1"
                          value={selectedElement.animation?.duration || 1}
                          onChange={(e) => updateSelectedElement({ animation: { duration: parseFloat(e.target.value) } })}
                          style={{ padding: 0 }}
                        />
                      </div>

                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <label>Delay (s)</label>
                          <span style={{ fontSize: '12px', color: 'var(--primary)' }}>{selectedElement.animation?.delay || 0}s</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.1"
                          value={selectedElement.animation?.delay || 0}
                          onChange={(e) => updateSelectedElement({ animation: { delay: parseFloat(e.target.value) } })}
                          style={{ padding: 0 }}
                        />
                      </div>

                      <div style={{ marginBottom: '12px' }}>
                        <label>Loop / Iteration</label>
                        <select
                          value={selectedElement.animation?.iteration || '1'}
                          onChange={(e) => updateSelectedElement({ animation: { iteration: e.target.value } })}
                        >
                          <option value="1">Once</option>
                          <option value="infinite">Infinite (Loop)</option>
                          <option value="2">2 Times</option>
                          <option value="3">3 Times</option>
                          <option value="5">5 Times</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px', marginTop: '15px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Click Actions</h4>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <label>Action Type</label>
                    <select
                      value={selectedElement.action?.type || 'none'}
                      onChange={(e) => updateSelectedElement({ action: { type: e.target.value, value: '' } })}
                    >
                      <option value="none">None (Static)</option>
                      <option value="url">External URL</option>
                      <option value="page">Internal Page</option>
                      <option value="anchor">Scroll to Anchor (#id)</option>
                      <option value="email">Email (mailto:)</option>
                      <option value="form">Open Contact Form Modal</option>
                      <option value="submit_inputs">Submit Inputs to Backend</option>
                    </select>
                  </div>

                  {selectedElement.action?.type === 'url' && (
                    <>
                      <div style={{ marginBottom: '12px' }}>
                        <label>URL Link</label>
                        <input
                          type="text"
                          value={selectedElement.action?.value || ''}
                          onChange={(e) => updateSelectedElement({ action: { value: e.target.value } })}
                          placeholder="https://example.com"
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <input
                          type="checkbox"
                          checked={selectedElement.action?.openInNewTab || false}
                          onChange={(e) => updateSelectedElement({ action: { openInNewTab: e.target.checked } })}
                          id="openInNewTab"
                          style={{ width: 'auto', cursor: 'pointer' }}
                        />
                        <label htmlFor="openInNewTab" style={{ margin: 0, cursor: 'pointer' }}>Open in new tab</label>
                      </div>
                    </>
                  )}

                  {selectedElement.action?.type === 'page' && (
                    <div style={{ marginBottom: '12px' }}>
                      <label>Select Page</label>
                      <select
                        value={selectedElement.action?.value || ''}
                        onChange={(e) => updateSelectedElement({ action: { value: e.target.value } })}
                      >
                        <option value="">-- Choose Page --</option>
                        {pages.map(p => (
                          <option key={p.id} value={p.slug}>{p.title} (/{p.slug})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedElement.action?.type === 'anchor' && (
                    <div style={{ marginBottom: '12px' }}>
                      <label>Section Element ID</label>
                      <input
                        type="text"
                        value={selectedElement.action?.value || ''}
                        onChange={(e) => updateSelectedElement({ action: { value: e.target.value } })}
                        placeholder="e.g. contact"
                      />
                    </div>
                  )}

                  {selectedElement.action?.type === 'email' && (
                    <>
                      <div style={{ marginBottom: '12px' }}>
                        <label>Email Address</label>
                        <input
                          type="email"
                          value={selectedElement.action?.value || ''}
                          onChange={(e) => updateSelectedElement({ action: { value: e.target.value } })}
                          placeholder="hello@example.com"
                        />
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <label>Subject Line (Optional)</label>
                        <input
                          type="text"
                          value={selectedElement.action?.subject || ''}
                          onChange={(e) => updateSelectedElement({ action: { subject: e.target.value } })}
                          placeholder="Inquiry from site"
                        />
                      </div>
                    </>
                  )}

                  {selectedElement.action?.type === 'submit_inputs' && (
                    <div style={{ marginBottom: '12px' }}>
                      <label>Form Submit Endpoint URL</label>
                      <input
                        type="text"
                        value={selectedElement.action?.value || ''}
                        onChange={(e) => updateSelectedElement({ action: { value: e.target.value } })}
                        placeholder="e.g., http://localhost:8001/api/submit/"
                      />
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                        Collects all input values on the page and submits them to this URL via POST.
                      </span>
                    </div>
                  )}

                  {selectedElement.action?.type === 'form' && (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      When clicked, a contact form modal pop-up will overlay the page.
                    </div>
                  )}
                </div>
              </div>
            ) : selectedColumnId ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold' }}>Column Inspector</h3>
                  <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 'bold', padding: '2px 6px', background: 'rgba(16,185,129,0.15)', borderRadius: '4px' }}>COLUMN</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label>Column Grid Width (Out of 12)</label>
                    <select
                      value={
                        activeLayout.flatMap(s => s.rows).flatMap(r => r.columns).find(c => c.id === selectedColumnId)?.settings?.width || '12'
                      }
                      onChange={(e) => {
                        const widthVal = e.target.value;
                        const nextLayout = activeLayout.map(sec => ({
                          ...sec,
                          rows: (sec.rows || []).map(row => ({
                            ...row,
                            columns: (row.columns || []).map(col => {
                              if (col.id === selectedColumnId) {
                                return {
                                  ...col,
                                  settings: { ...col.settings, width: widthVal }
                                };
                              }
                              return col;
                            })
                          }))
                        }));
                        updateLayout(nextLayout);
                      }}
                    >
                      <option value="12">12 - Full Row Width (100%)</option>
                      <option value="9">9 - Three-Quarters (75%)</option>
                      <option value="8">8 - Two-Thirds (66.6%)</option>
                      <option value="6">6 - Half Row Width (50%)</option>
                      <option value="4">4 - One-Third Width (33.3%)</option>
                      <option value="3">3 - One-Quarter Width (25%)</option>
                    </select>
                  </div>

                  <div>
                    <label>Padding Top/Bottom</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={
                        activeLayout.flatMap(s => s.rows).flatMap(r => r.columns).find(c => c.id === selectedColumnId)?.settings?.paddingTop || '0'
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        const nextLayout = activeLayout.map(sec => ({
                          ...sec,
                          rows: (sec.rows || []).map(row => ({
                            ...row,
                            columns: (row.columns || []).map(col => {
                              if (col.id === selectedColumnId) {
                                return {
                                  ...col,
                                  settings: { ...col.settings, paddingTop: val, paddingBottom: val }
                                };
                              }
                              return col;
                            })
                          }))
                        }));
                        updateLayout(nextLayout);
                      }}
                      style={{ padding: 0 }}
                    />
                  </div>
                  
                  <button 
                    onClick={() => setSelectedColumnId(null)} 
                    className="btn-secondary" 
                    style={{ width: '100%', marginTop: '10px', fontSize: '12px' }}
                  >
                    Unselect Column
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-secondary)' }}>
                <Settings size={36} style={{ marginBottom: '15px', color: 'var(--text-muted)' }} />
                <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>Inspector Panel</h4>
                <p style={{ fontSize: '12px', lineHeight: '1.4' }}>
                  Select any heading, text, button, column, or contact form on the design canvas to configure content styles here.
                </p>
              </div>
            )}
          </aside>
        )}

      </div>

      {showNewPageModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass" style={{ width: '400px', padding: '30px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Add Site Page</h3>
            <form onSubmit={handleCreatePage}>
              <div style={{ marginBottom: '15px' }}>
                <label>Page Title</label>
                <input 
                  type="text" 
                  required 
                  value={newPageTitle} 
                  onChange={(e) => {
                    setNewPageTitle(e.target.value);
                    if (!newPageSlug) {
                      setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                    }
                  }} 
                  placeholder="e.g. About Us" 
                />
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label>URL Slug Path</label>
                <input 
                  type="text" 
                  required 
                  value={newPageSlug} 
                  onChange={(e) => setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} 
                  placeholder="e.g. about-us" 
                />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                  Served at: <code>/{newPageSlug}</code>
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setShowNewPageModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Add Page</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPublishModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass" style={{ width: '100%', maxWidth: '550px', padding: '35px', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
            <CheckCircle size={52} style={{ color: 'var(--accent)', marginBottom: '15px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Website Published Successfully!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '25px' }}>
              Your site code has been compiled and is now live! Anyone on your local network can access it at this URL:
            </p>

            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '12px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '30px'
            }}>
              <code style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: 'bold' }}>
                http://localhost:8001/live/{site.subdomain}/
              </code>
              <a 
                href={`/live/${site.subdomain}/`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none' }}
              >
                Visit Site
              </a>
            </div>

            <button onClick={() => setShowPublishModal(false)} className="btn-secondary" style={{ padding: '10px 24px' }}>
              Done
            </button>
          </div>
        </div>
      )}

      {isSaveModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.75)', 
          backdropFilter: 'blur(4px)', 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: '#1e293b', 
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            position: 'relative',
          }}>
            <button 
              onClick={() => setIsSaveModalOpen(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>

            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <span style={{ fontSize: '48px', color: '#6366f1' }}>✓</span>
            </div>

            <h3 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '600', marginBottom: '8px', fontFamily: 'sans-serif' }}>
              Changes Saved Successfully!
            </h3>
            
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px', fontFamily: 'sans-serif' }}>
              Your canvas layout and adjustments have been securely updated on the server.
            </p>

            <button
              onClick={() => setIsSaveModalOpen(false)}
              className="btn-primary" 
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Awesome, Got it
            </button>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="modal-content" style={{
            backgroundColor: '#1E2128',
            padding: '24px', borderRadius: '8px', width: '400px',
            color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>
              Delete Page
            </h3>
            <p style={{ marginBottom: '24px', color: '#A0AABF', fontSize: '14px' }}>
              Are you sure you want to delete this page? This action cannot be undone.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={cancelDelete}
                style={{
                  padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
                  backgroundColor: 'transparent', border: '1px solid #4B5563', color: 'white'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeletePage}
                style={{
                  padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
                  backgroundColor: '#EF4444', border: 'none', color: 'white', fontWeight: 'bold'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {activeFormEl && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            width: '450px',
            padding: '30px',
            borderRadius: '12px',
            position: 'relative',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <button 
              onClick={() => setActiveFormEl(null)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '18px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#fff', fontFamily: 'sans-serif' }}>Contact Us</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px', fontFamily: 'sans-serif' }}>
              Please fill out the form below. We will get back to you shortly.
            </p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formEl = e.target;
              const data = {};
              const fields = activeFormEl.content?.fields || [];
              fields.forEach(f => {
                data[f.id] = formEl[f.id].value;
              });

              try {
                const res = await fetch(`http://127.0.0.1:8000/api/sites/${siteId}/submit-message/`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data)
                });
                if (res.ok) {
                  alert("Message sent successfully!");
                  setActiveFormEl(null);
                } else {
                  alert("Failed to send message. Please try again.");
                }
              } catch (err) {
                console.error(err);
                alert("An error occurred. Please try again.");
              }
            }}>
              {(activeFormEl.content?.fields || []).map(f => (
                <div key={f.id} style={{ marginBottom: '15px', textAlign: 'left' }}>
                  <label style={{ fontSize: '12px', color: '#cbd5e1', display: 'block', marginBottom: '5px', fontFamily: 'sans-serif' }}>{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea name={f.id} required={f.required} rows="4" placeholder={f.placeholder || ''} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid #334155', borderRadius: '6px', color: '#fff', padding: '10px', resize: 'none' }}></textarea>
                  ) : (
                    <input type={f.type} name={f.id} required={f.required} placeholder={f.placeholder || ''} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid #334155', borderRadius: '6px', color: '#fff', padding: '10px' }} />
                  )}
                </div>
              ))}
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>
                {activeFormEl.content?.buttonText || 'Submit Message'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Builder;