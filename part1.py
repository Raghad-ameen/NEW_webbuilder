p1 = """import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Laptop, Tablet, Smartphone, Eye, EyeOff, Save, Globe,
  Type, Image as ImageIcon, Video, Square, Play, Plus, Trash2, ArrowUp, ArrowDown,
  Copy, Settings, Palette, FileCode, Layers, RefreshCw, Sparkles, Mail,
  AlignLeft, AlignCenter, AlignRight, BringToFront, SendToBack, ObjectGroup, ObjectUngroup
} from 'lucide-react';
import { Rnd } from 'react-rnd';
import JSZip from 'jszip';

export default function Builder() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [site, setSite] = useState(null);
  const [pages, setPages] = useState([]);
  const [activePage, setActivePage] = useState(null);
  const [activeLayout, setActiveLayout] = useState([]);
  
  const [selectedElementIds, setSelectedElementIds] = useState([]);
  const selectedElementId = selectedElementIds[0] || null;
  const setSelectedElementId = (id) => setSelectedElementIds(id ? [id] : []);
  
  const [lassoStart, setLassoStart] = useState(null);
  const [lassoEnd, setLassoEnd] = useState(null);
  const [isLassoing, setIsLassoing] = useState(false);
  
  const [activeLeftTab, setActiveLeftTab] = useState('elements');
  const [viewMode, setViewMode] = useState('desktop'); 
  const [isPreview, setIsPreview] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
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
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const siteRes = await fetch(`http://127.0.0.1:8000/api/sites/${siteId}/`, { headers });
      if (!siteRes.ok) { navigate('/'); return; }
      const siteData = await siteRes.json();
      setSite(siteData);
      
      const pagesRes = await fetch(`http://127.0.0.1:8000/api/pages/?site_id=${siteId}`, { headers });
      if (pagesRes.ok) {
        const pagesData = await pagesRes.json();
        const sitePages = pagesData.filter(p => p.site === parseInt(siteId));
        setPages(sitePages);
        
        const home = sitePages.find(p => p.slug === 'home') || sitePages[0];
        if (home) {
          setActivePage(home);
          // Migrate old layouts
          const cleanLayout = (home.layout || []).map(sec => {
            if (sec.elements) return sec;
            let elements = [];
            (sec.rows || []).forEach(r => (r.columns || []).forEach(c => elements.push(...(c.elements || []))));
            return { ...sec, elements, rows: undefined };
          });
          setActiveLayout(cleanLayout);
          setHistory([JSON.stringify(cleanLayout)]);
          setHistoryPointer(0);
        }
      }
    } catch (err) { console.error('Error fetching details:', err); }
  };

  useEffect(() => { if (siteId) fetchData(); }, [siteId]);

  const savePageLayout = (layoutData) => {
    if (!activePage) return;
    setIsSaving(true);
    setTimeout(async () => {
      try {
        await fetch(`http://127.0.0.1:8000/api/pages/${activePage.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}` },
          body: JSON.stringify({ layout: layoutData, meta_description: activePage.meta_description || '' })
        });
      } catch (err) { console.error('Save failed:', err); } finally { setIsSaving(false); }
    }, 1500);
  };

  const saveLayout = async () => savePageLayout(activeLayout);

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

  const handleMouseDown = (e) => {
    if (isPreview) return;
    if (e.target.closest('.builder-canvas-element') || e.target.closest('.element-overlay-controls') || e.button !== 0) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left + viewportRef.current.scrollLeft;
    const startY = e.clientY - rect.top + viewportRef.current.scrollTop;
    setLassoStart({ x: startX, y: startY });
    setLassoEnd({ x: startX, y: startY });
    setIsLassoing(true);
    if (!e.ctrlKey && !e.altKey) setSelectedElementIds([]);
  };

  const handleMouseMove = (e) => {
    if (!isLassoing || !lassoStart || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left + viewportRef.current.scrollLeft;
    const currentY = e.clientY - rect.top + viewportRef.current.scrollTop;
    setLassoEnd({ x: currentX, y: currentY });

    const elements = viewportRef.current.querySelectorAll('.builder-canvas-element');
    const selectedIds = [];
    const x1 = Math.min(lassoStart.x, currentX), y1 = Math.min(lassoStart.y, currentY);
    const x2 = Math.max(lassoStart.x, currentX), y2 = Math.max(lassoStart.y, currentY);

    elements.forEach(elNode => {
      const elId = elNode.getAttribute('data-element-id');
      const elRect = elNode.getBoundingClientRect();
      const viewRect = viewportRef.current.getBoundingClientRect();
      const elLeft = elRect.left - viewRect.left + viewportRef.current.scrollLeft;
      const elTop = elRect.top - viewRect.top + viewportRef.current.scrollTop;
      if (!(x2 < elLeft || x1 > elLeft + elRect.width || y2 < elTop || y1 > elTop + elRect.height)) {
        selectedIds.push(elId);
      }
    });
    setSelectedElementIds(selectedIds);
  };

  const handleMouseUp = () => { setIsLassoing(false); setLassoStart(null); setLassoEnd(null); };

  const getSelectedElements = () => {
    const els = [];
    activeLayout.forEach(sec => {
      (sec.elements || []).forEach(el => {
        if (selectedElementIds.includes(el.id)) els.push(el);
      });
    });
    return els;
  };
  const selectedElement = getSelectedElements()[0] || null;

  const updateSelectedElement = (updates) => {
    const nextLayout = activeLayout.map(sec => ({
      ...sec,
      elements: (sec.elements || []).map(el => {
        if (selectedElementIds.includes(el.id)) {
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
    }));
    updateLayout(nextLayout);
  };

  const handleDuplicateElement = (elementId) => {
    let updated = false;
    const nextLayout = activeLayout.map(sec => {
      const els = [...(sec.elements || [])];
      const idx = els.findIndex(e => e.id === elementId);
      if (idx !== -1) {
        const clone = JSON.parse(JSON.stringify(els[idx]));
        clone.id = `el_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        clone.x += 20; clone.y += 20;
        els.splice(idx + 1, 0, clone);
        updated = true;
      }
      return { ...sec, elements: els };
    });
    if (updated) updateLayout(nextLayout);
  };

  const handleDeleteElement = (elementId) => {
    const nextLayout = activeLayout.map(sec => ({
      ...sec, elements: (sec.elements || []).filter(e => e.id !== elementId)
    }));
    if (selectedElementIds.includes(elementId)) setSelectedElementIds(prev => prev.filter(id => id !== elementId));
    updateLayout(nextLayout);
  };

  const handleLayerElement = (elementId, direction) => {
    let updated = false;
    const nextLayout = activeLayout.map(sec => {
      const els = [...(sec.elements || [])];
      const idx = els.findIndex(e => e.id === elementId);
      if (idx !== -1) {
        const item = els.splice(idx, 1)[0];
        if (direction === 'forward') els.splice(Math.min(idx + 1, els.length), 0, item);
        else els.splice(Math.max(idx - 1, 0), 0, item);
        updated = true;
      }
      return { ...sec, elements: els };
    });
    if (updated) updateLayout(nextLayout);
  };

  const handleGroup = () => {
    if (selectedElementIds.length < 2) return;
    const groupId = `group_${Date.now()}`;
    const nextLayout = activeLayout.map(sec => ({
      ...sec,
      elements: (sec.elements || []).map(el => selectedElementIds.includes(el.id) ? { ...el, groupId } : el)
    }));
    updateLayout(nextLayout);
  };

  const handleUngroup = () => {
    if (selectedElementIds.length === 0) return;
    const nextLayout = activeLayout.map(sec => ({
      ...sec,
      elements: (sec.elements || []).map(el => selectedElementIds.includes(el.id) ? { ...el, groupId: null } : el)
    }));
    updateLayout(nextLayout);
  };

  const alignElements = (alignment) => {
    if (selectedElementIds.length < 2) return;
    const els = getSelectedElements();
    let targetVal = 0;
    if (alignment === 'left') targetVal = Math.min(...els.map(e => e.x));
    if (alignment === 'right') targetVal = Math.max(...els.map(e => e.x + (e.width||0)));
    if (alignment === 'top') targetVal = Math.min(...els.map(e => e.y));
    if (alignment === 'bottom') targetVal = Math.max(...els.map(e => e.y + (e.height||0)));
    if (alignment === 'center') {
      const minX = Math.min(...els.map(e => e.x));
      const maxX = Math.max(...els.map(e => e.x + (e.width||0)));
      targetVal = minX + (maxX - minX) / 2;
    }

    const nextLayout = activeLayout.map(sec => ({
      ...sec,
      elements: (sec.elements || []).map(el => {
        if (selectedElementIds.includes(el.id)) {
          let newEl = { ...el };
          if (alignment === 'left') newEl.x = targetVal;
          if (alignment === 'right') newEl.x = targetVal - (newEl.width||0);
          if (alignment === 'top') newEl.y = targetVal;
          if (alignment === 'bottom') newEl.y = targetVal - (newEl.height||0);
          if (alignment === 'center') newEl.x = targetVal - (newEl.width||0) / 2;
          return newEl;
        }
        return el;
      })
    }));
    updateLayout(nextLayout);
  };
"""
