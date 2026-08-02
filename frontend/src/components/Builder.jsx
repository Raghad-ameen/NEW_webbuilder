import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Laptop, Tablet, Smartphone, Eye, EyeOff, Save, Check, Globe,
  Type, Image as ImageIcon, Video, Square, Play, Plus, Trash2, ArrowUp, ArrowDown,
  Copy, Settings, Palette, FileCode, Layers, CheckCircle, RefreshCw, Sparkles, Mail,
  ClipboardCopy, ClipboardPaste, AlignLeft, AlignCenter, AlignRight,
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  Move, Group, Ungroup, Download, X, Circle, Triangle, Link2, Search, LayoutList,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowUp as ArrowUpIcon, ArrowDown as ArrowDownIcon, ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon,
  Maximize2, Heart, Info
} from 'lucide-react';
import { TEMPLATES } from '../utils/TemplateData';
import { Rnd } from 'react-rnd';
import JSZip from 'jszip';
import { getSmartComponentTypes, getSmartComponent, calculateGroupBounds, moveElementGroup } from '../utils/SmartComponents';
const apiFetch = async (url, options = {}) => {
  let token = localStorage.getItem('access_token');
  const headers = { ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      const refreshResponse = await fetch('http://127.0.0.1:8000/api/auth/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken })
      });
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        localStorage.setItem('access_token', data.access);
        headers['Authorization'] = `Bearer ${data.access}`;
        response = await fetch(url, { ...options, headers });
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/';
      }
    } else {
      localStorage.removeItem('access_token');
      window.location.href = '/';
    }
  }
  return response;
};


// ─────────────────────────────────────────────────────────────────────────────
// IMAGE FILTERS & TRANSLATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'ar', name: 'Arabic (العربية)', flag: '🇸🇦', dir: 'rtl' },
  { code: 'fr', name: 'French (Français)', flag: '🇫🇷', dir: 'ltr' },
  { code: 'es', name: 'Spanish (Español)', flag: '🇪🇸', dir: 'ltr' },
  { code: 'de', name: 'German (Deutsch)', flag: '🇩🇪', dir: 'ltr' },
  { code: 'it', name: 'Italian (Italiano)', flag: '🇮🇹', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese (Português)', flag: '🇵🇹', dir: 'ltr' },
  { code: 'ru', name: 'Russian (Русский)', flag: '🇷🇺', dir: 'ltr' },
  { code: 'zh', name: 'Chinese (中文)', flag: '🇨🇳', dir: 'ltr' },
  { code: 'ja', name: 'Japanese (日本語)', flag: '🇯🇵', dir: 'ltr' },
  { code: 'ko', name: 'Korean (한국어)', flag: '🇰🇷', dir: 'ltr' },
  { code: 'hi', name: 'Hindi (हिन्दी)', flag: '🇮🇳', dir: 'ltr' },
  { code: 'tr', name: 'Turkish (Türkçe)', flag: '🇹🇷', dir: 'ltr' }
];

function computeImageFilter(styles) {
  if (!styles) return 'none';
  const parts = [];
  if (styles.filterBlur && styles.filterBlur !== '0' && styles.filterBlur !== '0px') parts.push(`blur(${styles.filterBlur}px)`);
  if (styles.filterBrightness && styles.filterBrightness !== '100' && styles.filterBrightness !== '100%') parts.push(`brightness(${styles.filterBrightness}%)`);
  if (styles.filterContrast && styles.filterContrast !== '100' && styles.filterContrast !== '100%') parts.push(`contrast(${styles.filterContrast}%)`);
  if (styles.filterSaturate && styles.filterSaturate !== '100' && styles.filterSaturate !== '100%') parts.push(`saturate(${styles.filterSaturate}%)`);
  if (styles.filterGrayscale && styles.filterGrayscale !== '0' && styles.filterGrayscale !== '0%') parts.push(`grayscale(${styles.filterGrayscale}%)`);
  if (styles.filterSepia && styles.filterSepia !== '0' && styles.filterSepia !== '0%') parts.push(`sepia(${styles.filterSepia}%)`);
  if (styles.filterHueRotate && styles.filterHueRotate !== '0' && styles.filterHueRotate !== '0deg') parts.push(`hue-rotate(${styles.filterHueRotate}deg)`);
  if (styles.filterInvert && styles.filterInvert !== '0' && styles.filterInvert !== '0%') parts.push(`invert(${styles.filterInvert}%)`);
  return parts.length > 0 ? parts.join(' ') : 'none';
}

function computeImageHoverFilter(styles) {
  if (!styles) return 'none';
  const base = computeImageFilter(styles);
  const parts = base === 'none' ? [] : [base];
  if (styles.hoverFilterBrightness && styles.hoverFilterBrightness !== '100') parts.push(`brightness(${styles.hoverFilterBrightness}%)`);
  if (styles.hoverFilterSaturate && styles.hoverFilterSaturate !== '100') parts.push(`saturate(${styles.hoverFilterSaturate}%)`);
  if (styles.hoverFilterBlur && styles.hoverFilterBlur !== '0') parts.push(`blur(${styles.hoverFilterBlur}px)`);
  return parts.length ? parts.join(' ') : 'none';
}

function getImageAlphaMask(src, styles) {
  if (!src || styles?.hoverOverlayRespectTransparency === false) return {};
  const imageUrl = `url("${String(src).replace(/"/g, '\\"')}")`;
  return {
    maskImage: imageUrl,
    WebkitMaskImage: imageUrl,
    maskSize: styles?.objectFit || 'cover',
    WebkitMaskSize: styles?.objectFit || 'cover',
    maskPosition: styles?.objectPosition || 'center',
    WebkitMaskPosition: styles?.objectPosition || 'center',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH SYSTEM — decoupled from UI rendering
// ─────────────────────────────────────────────────────────────────────────────

function filterElements(layout, query) {
  if (!query || !query.trim()) return null; // null = no filter active, show everything

  const q = query.toLowerCase().trim();
  const matched = new Set();

  (layout || []).forEach(sec => {
    (sec.elements || []).forEach(el => {
      const checks = [
        el.type,                        // element type: "heading", "button" …
        el.content?.text,               // text content
        el.content?.label,              // form field label
        el.content?.alt,                // image alt text
        el.content?.placeholder,        // input placeholder
        el.content?.src,                // image/video src (filename search)
        el.id,                          // direct ID search
      ];
      if (checks.some(v => v && String(v).toLowerCase().includes(q))) {
        matched.add(el.id);
      }
    });
  });

  return matched;
}

/**
 * Presentational search input with result navigation & counter.
 */
function SearchInput({ value, onQueryChange, matchCount = 0, currentMatchIndex = 0, onNextMatch, onPrevMatch, placeholder = 'Search elements…' }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevMatch && onPrevMatch();
      } else {
        onNextMatch && onNextMatch();
      }
    }
  };

  return (
    <div style={{ position: 'relative', marginBottom: '12px' }}>
      <Search
        size={13}
        style={{
          position: 'absolute',
          left: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#64748b',
          pointerEvents: 'none',
        }}
      />
      <input
        id="builder-search-input"
        type="text"
        value={value}
        onChange={e => onQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '7px 85px 7px 30px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          color: '#e2e8f0',
          fontSize: '12px',
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => { e.target.style.borderColor = '#6366f1'; }}
        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
      />
      <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '3px' }}>
        {value && matchCount > 0 && (
          <span style={{ fontSize: '10px', color: '#818cf8', fontWeight: 600, marginRight: '4px' }}>
            {currentMatchIndex + 1}/{matchCount}
          </span>
        )}
        {value && matchCount > 0 && (
          <>
            <button
              onClick={onPrevMatch}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#e2e8f0', cursor: 'pointer', borderRadius: '3px', padding: '1px 3px', display: 'flex', alignItems: 'center' }}
              title="Previous match (Shift+Enter)"
            >
              <ChevronUp size={12} />
            </button>
            <button
              onClick={onNextMatch}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#e2e8f0', cursor: 'pointer', borderRadius: '3px', padding: '1px 3px', display: 'flex', alignItems: 'center' }}
              title="Next match (Enter)"
            >
              <ChevronDown size={12} />
            </button>
          </>
        )}
        {value && (
          <button
            onClick={() => onQueryChange('')}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              marginLeft: '2px'
            }}
            title="Clear search"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function Builder() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [site, setSite] = useState(null);
  const [pages, setPages] = useState([]);
  const [activePage, setActivePage] = useState(null);
  const [activeLayout, setActiveLayout] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // ── SEARCH STATE (brain) ──────────────────────────────────────────────────
  const matchedElementIds = useMemo(
    () => filterElements(activeLayout, searchQuery),
    [activeLayout, searchQuery]
  );
  const isSearchActive = matchedElementIds !== null;
  
  const [liveSearchQuery, setLiveSearchQuery] = useState('');
  const liveMatchedElementIds = useMemo(
    () => filterElements(activeLayout, liveSearchQuery),
    [activeLayout, liveSearchQuery]
  );
  const isLiveSearchActive = liveMatchedElementIds !== null;
  
  const [language, setLanguage] = useState('en');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationCache, setTranslationCache] = useState({});

  // Cross-page search results array
  const searchResults = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const results = [];
    
    (pages || []).forEach(pg => {
      let layout = [];
      if (pg.id === activePage?.id) {
        layout = activeLayout;
      } else {
        try {
          layout = typeof pg.layout === 'string' ? JSON.parse(pg.layout) : (pg.layout || []);
        } catch(e) {
          layout = [];
        }
      }
      
      (layout || []).forEach(sec => {
        (sec.elements || []).forEach(el => {
          const textToSearch = [
            el.type,
            el.content?.text,
            el.content?.label,
            el.content?.alt,
            el.content?.placeholder,
            el.content?.src,
            el.id
          ].filter(Boolean).join(' ');

          if (textToSearch.toLowerCase().includes(q)) {
            results.push({
              pageId: pg.id,
              pageTitle: pg.title || pg.name || 'Untitled',
              elementId: el.id,
              elementType: el.type
            });
          }
        });
      });
    });

    return results;
  }, [searchQuery, pages, activePage, activeLayout]);

  const handleNextMatch = () => {
    if (searchResults.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchResults.length;
    setCurrentMatchIndex(nextIdx);
    focusMatch(searchResults[nextIdx]);
  };

  const handlePrevMatch = () => {
    if (searchResults.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentMatchIndex(prevIdx);
    focusMatch(searchResults[prevIdx]);
  };

  const focusMatch = (match) => {
    if (!match) return;
    if (match.pageId && match.pageId !== activePage?.id) {
      const targetPg = pages.find(p => p.id === match.pageId);
      if (targetPg) {
        handleSwitchPage(targetPg);
      }
    }
    setSelectedElementIds([match.elementId]);
    setFocusedElementId(match.elementId);
    setTimeout(() => {
      const elNode = document.querySelector(`[data-element-id="${match.elementId}"]`);
      if (elNode) {
        elNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  useEffect(() => {
    setCurrentMatchIndex(0);
    if (searchQuery.trim() && searchResults.length) focusMatch(searchResults[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleTranslateAll = async (targetLangCode) => {
    if (targetLangCode === language) return;
    setIsTranslating(true);
    setLanguage(targetLangCode);

    try {
      const translateText = async (str) => {
        if (!str || !str.trim() || targetLangCode === 'en') return str;
        const key = `${targetLangCode}:${str}`;
        if (translationCache[key]) return translationCache[key];
        try {
          const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(str)}&langpair=en|${targetLangCode}`);
          const data = await res.json();
          if (data.responseData?.translatedText) {
            const trans = data.responseData.translatedText;
            setTranslationCache(prev => ({ ...prev, [key]: trans }));
            return trans;
          }
        } catch(e) {
          console.error(e);
        }
        return str;
      };

      const translateLayout = async (layout) => Promise.all((layout || []).map(async (sec) => {
        const updatedElements = await Promise.all((sec.elements || []).map(async (el) => {
          const origText = el.content?.originalText || el.content?.text;
          const origAlt = el.content?.originalAlt || el.content?.alt;
          const origPlaceholder = el.content?.originalPlaceholder || el.content?.placeholder;
          const origLabel = el.content?.originalLabel || el.content?.label;
          const origButtonText = el.content?.originalButtonText || el.content?.buttonText;

          let newText = el.content?.text;
          let newAlt = el.content?.alt;
          let newPlaceholder = el.content?.placeholder;
          let newLabel = el.content?.label;
          let newButtonText = el.content?.buttonText;

          if (origText && ['heading', 'text', 'button', 'link'].includes(el.type)) {
            newText = targetLangCode === 'en' ? origText : await translateText(origText);
          }
          if (origAlt && el.type === 'image') {
            newAlt = targetLangCode === 'en' ? origAlt : await translateText(origAlt);
          }
          if (origPlaceholder && ['input', 'site_search'].includes(el.type)) {
            newPlaceholder = targetLangCode === 'en' ? origPlaceholder : await translateText(origPlaceholder);
          }
          if (origLabel) newLabel = targetLangCode === 'en' ? origLabel : await translateText(origLabel);
          if (origButtonText) newButtonText = targetLangCode === 'en' ? origButtonText : await translateText(origButtonText);

          return {
            ...el,
            content: {
              ...el.content,
              originalText: origText,
              originalAlt: origAlt,
              originalPlaceholder: origPlaceholder,
              originalLabel: origLabel,
              originalButtonText: origButtonText,
              text: newText,
              alt: newAlt,
              placeholder: newPlaceholder,
              label: newLabel,
              buttonText: newButtonText
            }
          };
        }));
        return { ...sec, elements: updatedElements };
      }));

      const newLayout = await translateLayout(activeLayout);

      updateLayout(newLayout);
      const translatedOtherPages = await Promise.all((pages || []).filter(page => page.id !== activePage?.id).map(async page => {
        const pageLayout = typeof page.layout === 'string' ? JSON.parse(page.layout) : (page.layout || []);
        const translatedLayout = await translateLayout(pageLayout);
        savePageLayout(translatedLayout, page);
        return { ...page, layout: translatedLayout };
      }));
      if (translatedOtherPages.length) {
        setPages(prev => prev.map(page => page.id === activePage?.id ? { ...page, layout: newLayout } : (translatedOtherPages.find(item => item.id === page.id) || page)));
      }
    } catch(err) {
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };
  const DICT = {
    en: {
      builder: 'Builder',
      save: 'Save',
      publish: 'Publish',
      pages: 'Pages',
      settings: 'Settings',
      layers: 'Layers',
      preview: 'Preview',
      exitPreview: 'Exit Preview',
      components: 'Components',
      properties: 'Properties'
    },
    ar: {
      builder: 'المُنشئ',
      save: 'حفظ',
      publish: 'نشر',
      pages: 'الصفحات',
      settings: 'الإعدادات',
      layers: 'الطبقات',
      preview: 'معاينة',
      exitPreview: 'الخروج من المعاينة',
      components: 'المكونات',
      properties: 'الخصائص'
    }
  };
  const t = (key) => DICT[language]?.[key] || key;

  // Debounce ref for color inputs — prevents Edge/Chrome from re-rendering on every mouse-drag pixel
  const colorDebounceRef = useRef({});
  const debouncedColorUpdate = useCallback((key, updater) => {
    if (colorDebounceRef.current[key]) clearTimeout(colorDebounceRef.current[key]);
    colorDebounceRef.current[key] = setTimeout(() => { updater(); }, 80);
  }, []);

  const [selectedElementIds, setSelectedElementIds] = useState([]);
  const selectedElementId = selectedElementIds[0] || null;
  const setSelectedElementId = (id) => {
    setSelectedElementIds(id ? [id] : []);
  };
  
  // Keyboard Navigation Focus State
  const [focusedElementId, setFocusedElementId] = useState(null);
  
  const [lassoStart, setLassoStart] = useState(null);
  const [lassoEnd, setLassoEnd] = useState(null);
  const [isLassoing, setIsLassoing] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, elementId }
  const [snapToGrid, setSnapToGrid] = useState(0); // 0 = off
  const [styleClipboard, setStyleClipboard] = useState(null);
  const [showGridGuides, setShowGridGuides] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [smartSnapEnabled, setSmartSnapEnabled] = useState(true);
  const [alignmentGuides, setAlignmentGuides] = useState([]);
  
  // Pro Builder Layout States
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(300);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(320);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [canvasZoom, setCanvasZoom] = useState(1);

  const [activeLeftTab, setActiveLeftTab] = useState('elements');
  const [viewMode, setViewMode] = useState('desktop'); 
  const [isPreview, setIsPreview] = useState(false);
  const previewWindowRef = useRef(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeFormEl, setActiveFormEl] = useState(null);
  const [activeDrawerEl, setActiveDrawerEl] = useState(null);
  const [activeModalEl, setActiveModalEl] = useState(null);
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
  const dragStartPositions = useRef({});
  const [clipboard, setClipboard] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Smart alignment configuration
  const SNAP_THRESHOLD = 5;
  const GUIDE_COLOR = '#6366f1';

  // Calculate smart alignment guides and snap position
  const calculateSmartAlignment = (dragElementId, currentX, currentY, elementWidth, elementHeight) => {
    if (!smartSnapEnabled) return { x: currentX, y: currentY, guides: [] };
    
    const guides = [];
    let snapX = currentX;
    let snapY = currentY;
    
    // Find which section this element belongs to and get container width
    let containerW = 1200;
    activeLayout.forEach(sec => {
      (sec.elements || []).forEach(el => {
        if (el.id === dragElementId) {
          const cw = sec.settings?.containerWidth || '1200px';
          containerW = parseInt(cw) || 1200;
        }
      });
    });

    // Collect all sibling elements in the same section
    const allElements = [];
    activeLayout.forEach(sec => {
      (sec.elements || []).forEach(el => {
        if (el.id !== dragElementId && !selectedElementIds.includes(el.id)) {
          const w = el.width || 100;
          const h = el.height || 50;
          allElements.push({
            id: el.id,
            left: el.x || 0,
            top: el.y || 0,
            width: w,
            height: h,
            centerX: (el.x || 0) + w / 2,
            centerY: (el.y || 0) + h / 2,
            right: (el.x || 0) + w,
            bottom: (el.y || 0) + h
          });
        }
      });
    });

    // Dragged element edges
    const dragLeft = currentX;
    const dragTop = currentY;
    const dragRight = currentX + elementWidth;
    const dragBottom = currentY + elementHeight;
    const dragCenterX = currentX + elementWidth / 2;
    const dragCenterY = currentY + elementHeight / 2;

    // Container center
    const containerCenterX = containerW / 2;

    let bestSnapX = null;
    let bestSnapXDist = SNAP_THRESHOLD;
    let bestSnapY = null;
    let bestSnapYDist = SNAP_THRESHOLD;

    const PROXIMITY_LIMIT = 150; // max distance on opposite axis to allow snapping

    // Helper: check vertical (X-axis) alignment
    const checkVertical = (targetX, sourceType, targetEl) => {
      if (targetEl) {
        const isNearY = dragBottom >= targetEl.top - PROXIMITY_LIMIT && dragTop <= targetEl.bottom + PROXIMITY_LIMIT;
        if (!isNearY) return;
      }
      
      // Left edge of dragged -> targetX
      let d = Math.abs(dragLeft - targetX);
      if (d < bestSnapXDist) {
        bestSnapXDist = d;
        bestSnapX = { snapTo: targetX, guideX: targetX, source: sourceType, target: targetEl };
      }
      // Right edge of dragged -> targetX
      d = Math.abs(dragRight - targetX);
      if (d < bestSnapXDist) {
        bestSnapXDist = d;
        bestSnapX = { snapTo: targetX - elementWidth, guideX: targetX, source: sourceType, target: targetEl };
      }
      // Center of dragged -> targetX
      d = Math.abs(dragCenterX - targetX);
      if (d < bestSnapXDist) {
        bestSnapXDist = d;
        bestSnapX = { snapTo: targetX - elementWidth / 2, guideX: targetX, source: sourceType, target: targetEl };
      }
    };

    // Helper: check horizontal (Y-axis) alignment
    const checkHorizontal = (targetY, sourceType, targetEl) => {
      if (targetEl) {
        const isNearX = dragRight >= targetEl.left - PROXIMITY_LIMIT && dragLeft <= targetEl.right + PROXIMITY_LIMIT;
        if (!isNearX) return;
      }

      let d = Math.abs(dragTop - targetY);
      if (d < bestSnapYDist) {
        bestSnapYDist = d;
        bestSnapY = { snapTo: targetY, guideY: targetY, source: sourceType, target: targetEl };
      }
      d = Math.abs(dragBottom - targetY);
      if (d < bestSnapYDist) {
        bestSnapYDist = d;
        bestSnapY = { snapTo: targetY - elementHeight, guideY: targetY, source: sourceType, target: targetEl };
      }
      d = Math.abs(dragCenterY - targetY);
      if (d < bestSnapYDist) {
        bestSnapYDist = d;
        bestSnapY = { snapTo: targetY - elementHeight / 2, guideY: targetY, source: sourceType, target: targetEl };
      }
    };

    // Check container edges & center
    checkVertical(0, 'container');
    checkVertical(containerW, 'container');
    checkVertical(containerCenterX, 'container-center');

    // Check against all other elements
    allElements.forEach(t => {
      checkVertical(t.left, 'element', t);
      checkVertical(t.right, 'element', t);
      checkVertical(t.centerX, 'element-center', t);
      checkHorizontal(t.top, 'element', t);
      checkHorizontal(t.bottom, 'element', t);
      checkHorizontal(t.centerY, 'element-center', t);
    });

    // Apply best snap and build guide lines
    if (bestSnapX) {
      snapX = bestSnapX.snapTo;
      const gx = bestSnapX.guideX;
      // Determine Y extent of the guide line
      let minY = snapY;
      let maxY = snapY + elementHeight;
      if (bestSnapX.target) {
        minY = Math.min(minY, bestSnapX.target.top);
        maxY = Math.max(maxY, bestSnapX.target.bottom);
      }
      guides.push({ type: 'vertical', position: gx, startY: minY - 20, endY: maxY + 20 });
    }

    if (bestSnapY) {
      snapY = bestSnapY.snapTo;
      const gy = bestSnapY.guideY;
      let minX = snapX;
      let maxX = snapX + elementWidth;
      if (bestSnapY.target) {
        minX = Math.min(minX, bestSnapY.target.left);
        maxX = Math.max(maxX, bestSnapY.target.right);
      }
      guides.push({ type: 'horizontal', position: gy, startX: minX - 20, endX: maxX + 20 });
    }

    // ── EQUAL-SPACING GUIDES ───────────────────────────────────────────────────
    // Find elements to the LEFT and RIGHT of the dragged element (same horizontal band)
    const BAND_TOLERANCE = elementHeight * 0.6; // vertical overlap threshold
    const dragMidY = dragTop + elementHeight / 2;

    const horizontalNeighbours = allElements
      .filter(t => Math.abs(t.top + t.height / 2 - dragMidY) < BAND_TOLERANCE + t.height / 2)
      .sort((a, b) => a.left - b.left);

    // Elements strictly to the left and right
    const leftNeighbours  = horizontalNeighbours.filter(t => t.right <= dragLeft).sort((a, b) => b.right - a.right);
    const rightNeighbours = horizontalNeighbours.filter(t => t.left  >= dragRight).sort((a, b) => a.left - b.left);

    if (leftNeighbours.length > 0 && rightNeighbours.length > 0) {
      const nearLeft  = leftNeighbours[0];
      const nearRight = rightNeighbours[0];
      const gapLeft   = dragLeft  - nearLeft.right;   // space between left neighbour's right edge and dragged left
      const gapRight  = nearRight.left - dragRight;   // space between dragged right edge and right neighbour's left

      if (Math.abs(gapLeft - gapRight) < SNAP_THRESHOLD * 2) {
        // Equal spacing detected — snap to perfectly equal position
        const totalSpan = nearRight.right - nearLeft.left;
        const equalGap  = (totalSpan - elementWidth) / 2;
        const snapXEqual = nearLeft.right + equalGap;

        if (Math.abs(snapXEqual - snapX) < SNAP_THRESHOLD * 3) {
          snapX = snapXEqual;
          const guideY = Math.min(dragTop, nearLeft.top, nearRight.top) - 18;
          const labelGap = Math.round(equalGap);
          // Left spacing bracket
          guides.push({ type: 'spacing', orientation: 'horizontal', x1: nearLeft.right, x2: snapXEqual, y: guideY, label: `${labelGap}px` });
          // Right spacing bracket
          guides.push({ type: 'spacing', orientation: 'horizontal', x1: snapXEqual + elementWidth, x2: nearRight.left, y: guideY, label: `${labelGap}px` });
        } else {
          // Not snapping but still show measurement
          const guideY = Math.min(dragTop, nearLeft.top, nearRight.top) - 18;
          guides.push({ type: 'spacing', orientation: 'horizontal', x1: nearLeft.right, x2: dragLeft, y: guideY, label: `${Math.round(gapLeft)}px` });
          guides.push({ type: 'spacing', orientation: 'horizontal', x1: dragRight, x2: nearRight.left, y: guideY, label: `${Math.round(gapRight)}px`, unequal: gapLeft !== gapRight });
        }
      } else {
        // Not equal — show gap measurements so user knows the difference
        const guideY = Math.min(dragTop, nearLeft.top, nearRight.top) - 18;
        guides.push({ type: 'spacing', orientation: 'horizontal', x1: nearLeft.right, x2: dragLeft, y: guideY, label: `${Math.round(gapLeft)}px`, unequal: true });
        guides.push({ type: 'spacing', orientation: 'horizontal', x1: dragRight, x2: nearRight.left, y: guideY, label: `${Math.round(gapRight)}px`, unequal: true });
      }
    }

    // Vertical equal-spacing (elements above and below)
    const VBAND_TOLERANCE = elementWidth * 0.6;
    const dragMidX = dragLeft + elementWidth / 2;

    const verticalNeighbours = allElements
      .filter(t => Math.abs(t.left + t.width / 2 - dragMidX) < VBAND_TOLERANCE + t.width / 2)
      .sort((a, b) => a.top - b.top);

    const topNeighbours    = verticalNeighbours.filter(t => t.bottom <= dragTop).sort((a, b) => b.bottom - a.bottom);
    const bottomNeighbours = verticalNeighbours.filter(t => t.top >= dragBottom).sort((a, b) => a.top - b.top);

    if (topNeighbours.length > 0 && bottomNeighbours.length > 0) {
      const nearTop    = topNeighbours[0];
      const nearBottom = bottomNeighbours[0];
      const gapAbove   = dragTop    - nearTop.bottom;
      const gapBelow   = nearBottom.top - dragBottom;

      if (Math.abs(gapAbove - gapBelow) < SNAP_THRESHOLD * 2) {
        const totalSpan = nearBottom.bottom - nearTop.top;
        const equalGap  = (totalSpan - elementHeight) / 2;
        const snapYEqual = nearTop.bottom + equalGap;

        if (Math.abs(snapYEqual - snapY) < SNAP_THRESHOLD * 3) {
          snapY = snapYEqual;
          const guideX = Math.min(dragLeft, nearTop.left, nearBottom.left) - 18;
          const labelGap = Math.round(equalGap);
          guides.push({ type: 'spacing', orientation: 'vertical', y1: nearTop.bottom, y2: snapYEqual, x: guideX, label: `${labelGap}px` });
          guides.push({ type: 'spacing', orientation: 'vertical', y1: snapYEqual + elementHeight, y2: nearBottom.top, x: guideX, label: `${labelGap}px` });
        } else {
          const guideX = Math.min(dragLeft, nearTop.left, nearBottom.left) - 18;
          guides.push({ type: 'spacing', orientation: 'vertical', y1: nearTop.bottom, y2: dragTop, x: guideX, label: `${Math.round(gapAbove)}px` });
          guides.push({ type: 'spacing', orientation: 'vertical', y1: dragBottom, y2: nearBottom.top, x: guideX, label: `${Math.round(gapBelow)}px`, unequal: true });
        }
      } else {
        const guideX = Math.min(dragLeft, nearTop.left, nearBottom.left) - 18;
        guides.push({ type: 'spacing', orientation: 'vertical', y1: nearTop.bottom, y2: dragTop, x: guideX, label: `${Math.round(gapAbove)}px`, unequal: true });
        guides.push({ type: 'spacing', orientation: 'vertical', y1: dragBottom, y2: nearBottom.top, x: guideX, label: `${Math.round(gapBelow)}px`, unequal: true });
      }
    }
    // ──────────────────────────────────────────────────────────────────────────

    return { x: snapX, y: snapY, guides };
  };


  // Migrate old row/column layout to new flat structure
  const migrateLayout = useCallback((layout) => {
    if (!layout || !Array.isArray(layout)) return [];
    return layout.map(sec => {
      if (sec.elements) return sec; // Already migrated
      const elements = (sec.rows || []).flatMap(row => 
        (row.columns || []).flatMap(col => col.elements || [])
      );
      return {
        ...sec,
        elements,
        // Remove old structure
        rows: undefined,
        columns: undefined
      };
    }).filter(sec => sec.elements || sec.settings);
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token'); 
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const siteRes = await apiFetch(`http://127.0.0.1:8000/api/sites/${siteId}/`, { headers });
      
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
      
      const pagesRes = await apiFetch(`http://127.0.0.1:8000/api/pages/?site_id=${siteId}`, { headers });
      if (pagesRes.ok) {
        const pagesData = await pagesRes.json();
        const sitePages = pagesData.filter(p => p.site === parseInt(siteId));
        setPages(sitePages);
        
        const home = sitePages.find(p => p.slug === 'home') || sitePages[0];
        if (home) {
          setActivePage(home);
          const migratedLayout = migrateLayout(home.layout || []);
          setActiveLayout(migratedLayout);
          setHistory([JSON.stringify(migratedLayout)]);
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        setIsCtrlPressed(true);
      }
      // Keyboard shortcuts
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        switch(e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            handleUndo();
            break;
          case 'y':
            e.preventDefault();
            handleRedo();
            break;
          case 'c':
            e.preventDefault();
            handleCopy();
            break;
          case 'v':
            e.preventDefault();
            handlePaste();
            break;
          case 'a':
            e.preventDefault();
            handleSelectAll();
            break;
          case 'g':
            e.preventDefault();
            if (selectedElementIds.length > 1) handleGroupElements();
            break;
          case 'd':
            e.preventDefault();
            if (selectedElementId) handleDuplicateElement(selectedElementId);
            break;
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementIds.length > 0 && document.activeElement === document.body) {
          e.preventDefault();
          handleDeleteSelected();
        }
      }
      if (e.key === 'Escape') {
        setSelectedElementIds([]);
        setFocusedElementId(null);
        setInlineEditingId(null);
      }
      
      // Selection Navigation - Arrow keys cycle through elements by proximity
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const activeEl = document.activeElement;
        const isInputFocused = activeEl && (
          activeEl.tagName === 'INPUT' || 
          activeEl.tagName === 'TEXTAREA' || 
          activeEl.isContentEditable
        );
        
        if (!isInputFocused && !isPreview) {
          e.preventDefault();
          
          // Get all elements on canvas
          const allElements = [];
          activeLayout.forEach(sec => {
            (sec.elements || []).forEach(el => {
              allElements.push({
                id: el.id,
                x: el.x || 0,
                y: el.y || 0,
                width: el.width || 100,
                height: el.height || 50,
                centerX: (el.x || 0) + (el.width || 100) / 2,
                centerY: (el.y || 0) + (el.height || 50) / 2
              });
            });
          });
          
          if (allElements.length === 0) return;
          
          // Determine current reference element (focused or selected)
          const currentId = focusedElementId || selectedElementId;
          const currentEl = currentId ? allElements.find(el => el.id === currentId) : null;
          
          // Define direction vector
          let dirX = 0, dirY = 0;
          switch(e.key) {
            case 'ArrowUp': dirY = -1; break;
            case 'ArrowDown': dirY = 1; break;
            case 'ArrowLeft': dirX = -1; break;
            case 'ArrowRight': dirX = 1; break;
          }
          
          // Find closest element in the pressed direction
          let closestEl = null;
          let closestDist = Infinity;
          
          allElements.forEach(el => {
            if (el.id === currentId) return; // Skip current element
            
            // Calculate vector from current to candidate
            const dx = el.centerX - (currentEl?.centerX || el.centerX);
            const dy = el.centerY - (currentEl?.centerY || el.centerY);
            
            // Check if element is in the pressed direction
            const dotProduct = dx * dirX + dy * dirY;
            if (dotProduct <= 0) return; // Not in the right direction
            
            // Calculate distance (weighted by direction alignment)
            const dist = Math.sqrt(dx * dx + dy * dy);
            const alignment = dotProduct / dist; // 1 = perfect alignment
            
            // Prioritize elements that are more aligned with the direction
            const weightedDist = dist / alignment;
            
            if (weightedDist < closestDist) {
              closestDist = weightedDist;
              closestEl = el;
            }
          });
          
          // If no element found in direction, wrap around or do nothing
          if (closestEl) {
            setFocusedElementId(closestEl.id);
            setSelectedElementIds([closestEl.id]);
          } else if (!currentEl && allElements.length > 0) {
            // If no current element, select the first one
            setFocusedElementId(allElements[0].id);
            setSelectedElementIds([allElements[0].id]);
          }
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        setIsCtrlPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedElementIds, activeLayout, history, historyPointer, isPreview]);

  // AOS Intersection Observer for Builder Preview
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const el = entry.target;
        if (entry.isIntersecting) {
          if (el.dataset.aosName && el.dataset.aosName !== 'none') {
            el.style.animationName = el.dataset.aosName;
            el.style.animationDuration = el.dataset.aosDuration || '1s';
            el.style.animationDelay = el.dataset.aosDelay || '0s';
            el.style.animationIterationCount = el.dataset.aosIteration || '1';
            el.style.animationFillMode = 'both';
            if (el.style.opacity === '0') el.style.opacity = '';
          }
        } else {
          if (el.dataset.aosName && el.dataset.aosName !== 'none') {
            el.style.animationName = 'none';
            if (['fadeIn','fadeInUp','fadeInDown','fadeInLeft','fadeInRight','slideUp','slideDown','slideLeft','slideRight','zoomIn','zoomInUp','zoomInDown','flipInX','flipInY','rotateIn','rollIn','lightSpeedIn','jackInTheBox','expandIn','dropIn'].includes(el.dataset.aosName)) {
              el.style.opacity = '0';
            }
          }
        }
      });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll('.aos-element');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [activeLayout, isPreview, activePage]);

  // Media Slider Interaction Logic
  useEffect(() => {
    if (isPreview) return; // Only initialize in editor mode

    const initSliders = () => {
      // Find all slider containers by looking for elements with _arrow_left suffix
      const arrowLeft = document.querySelector('[id$="_arrow_left"]');
      if (!arrowLeft) return;

      // Get the baseId from the arrow element
      const baseId = arrowLeft.id.replace('_arrow_left', '');
      
      // Check if we have slider data for this slider
      const sliderInfo = window.sliderData?.[baseId];
      if (!sliderInfo) return;

      const totalSlides = sliderInfo.slides.length;
      let currentSlide = 0;
      let autoplayTimer = null;
      let isTransitioning = false;

      // Get all slider elements
      const getEl = (suffix) => document.getElementById(`${baseId}_${suffix}`);

      const updateSlides = (slideIndex, direction = 'forward') => {
        if (isTransitioning) return; // Prevent rapid transitions
        isTransitioning = true;
        
        const transition = sliderInfo.transition || 'fade';
        const duration = sliderInfo.transitionDuration || 0.5;
        
        // Determine exit and entry transforms based on direction
        const getExitTransform = (isForward) => {
          switch(transition) {
            case 'slideLeft':
              return isForward ? 'translateX(-100%)' : 'translateX(100%)';
            case 'slideRight':
              return isForward ? 'translateX(100%)' : 'translateX(-100%)';
            case 'zoom':
              return 'scale(0.8)';
            case 'flip':
              return 'perspective(1000px) rotateY(90deg)';
            default: // fade
              return 'none';
          }
        };

        const getEntryTransform = (isForward) => {
          switch(transition) {
            case 'slideLeft':
              return isForward ? 'translateX(100%)' : 'translateX(-100%)';
            case 'slideRight':
              return isForward ? 'translateX(-100%)' : 'translateX(100%)';
            case 'zoom':
              return 'scale(0.8)';
            case 'flip':
              return 'perspective(1000px) rotateY(-90deg)';
            default: // fade
              return 'none';
          }
        };
        
        const currentIndex = currentSlide;
        const isForward = direction === 'forward';
        
        // Update images with transition effects
        for (let i = 1; i <= totalSlides; i++) {
          const img = getEl(`slide${i}_img`);
          const text = getEl(`slide${i}_text`);
          
          if (i === slideIndex) {
            // Entry slide - start from entry position
            if (img) {
              img.style.transition = 'none';
              img.style.opacity = '1';
              img.style.transform = getEntryTransform(isForward);
              img.style.zIndex = '1';
              
              // Force reflow
              img.offsetHeight;
              
              // Animate to final position
              img.style.transition = `all ${duration}s ease-in-out`;
              img.style.transform = 'translateX(0) scale(1) rotateY(0deg)';
              img.style.zIndex = '2';
            }
            if (text) {
              text.style.transition = `opacity ${duration}s ease-in-out`;
              text.style.opacity = '1';
            }
          } else if (i === currentIndex) {
            // Exit slide - animate out
            if (img) {
              img.style.transition = `all ${duration}s ease-in-out`;
              img.style.opacity = '0';
              img.style.transform = getExitTransform(isForward);
              img.style.zIndex = '1';
            }
            if (text) {
              text.style.transition = `opacity ${duration}s ease-in-out`;
              text.style.opacity = '0';
            }
          } else {
            // Other slides - hide immediately
            if (img) {
              img.style.transition = 'none';
              img.style.opacity = '0';
              img.style.transform = 'none';
              img.style.zIndex = '0';
            }
            if (text) {
              text.style.transition = 'none';
              text.style.opacity = '0';
            }
          }
        }

        // Update dots
        for (let i = 1; i <= totalSlides; i++) {
          const dot = getEl(`dot${i}`);
          if (dot) {
            dot.style.transition = `all ${duration}s ease-in-out`;
            dot.style.backgroundColor = i === slideIndex ? '#6366f1' : 'rgba(255,255,255,0.4)';
            dot.style.transform = i === slideIndex ? 'scale(1.3)' : 'scale(1)';
            dot.style.boxShadow = i === slideIndex ? '0 0 10px rgba(99,102,241,0.8)' : 'none';
          }
        }

        currentSlide = slideIndex;
        
        // Allow next transition after animation completes
        setTimeout(() => {
          isTransitioning = false;
        }, duration * 1000);
      };

      // Arrow click handlers
      const leftArrow = getEl('arrow_left');
      const rightArrow = getEl('arrow_right');

      if (leftArrow) {
        leftArrow.onclick = (e) => {
          e.stopPropagation();
          const newSlide = currentSlide === 0 ? totalSlides - 1 : currentSlide - 1;
          const direction = currentSlide === 0 ? 'backward' : 'backward';
          updateSlides(newSlide, direction);
          resetAutoplay();
        };
      }

      if (rightArrow) {
        rightArrow.onclick = (e) => {
          e.stopPropagation();
          const newSlide = currentSlide === totalSlides - 1 ? 0 : currentSlide + 1;
          const direction = currentSlide === totalSlides - 1 ? 'forward' : 'forward';
          updateSlides(newSlide, direction);
          resetAutoplay();
        };
      }

      // Dot click handlers
      for (let i = 1; i <= totalSlides; i++) {
        const dot = getEl(`dot${i}`);
        if (dot) {
          dot.onclick = (e) => {
            e.stopPropagation();
            const direction = i - 1 > currentSlide ? 'forward' : 'backward';
            updateSlides(i - 1, direction);
            resetAutoplay();
          };
        }
      }

      // Autoplay
      const startAutoplay = () => {
        autoplayTimer = setInterval(() => {
          const newSlide = currentSlide === totalSlides - 1 ? 0 : currentSlide + 1;
          // When looping from last to first, use backward direction for smooth transition
          const direction = currentSlide === totalSlides - 1 ? 'backward' : 'forward';
          updateSlides(newSlide, direction);
        }, sliderInfo.autoPlayInterval);
      };

      const resetAutoplay = () => {
        if (autoplayTimer) clearInterval(autoplayTimer);
        startAutoplay();
      };

      // Pause on hover
      const container = getEl('container');
      if (container) {
        container.onmouseenter = () => {
          if (autoplayTimer) clearInterval(autoplayTimer);
        };
        container.onmouseleave = () => {
          startAutoplay();
        };
      }

      // Start autoplay
      startAutoplay();

      // Store cleanup function
      return () => {
        if (autoplayTimer) clearInterval(autoplayTimer);
      };
    };

    // Initialize all sliders on the page
    const cleanupFns = [];
    const sliders = new Set();
    
    // Find all unique slider baseIds
    document.querySelectorAll('[id$="_arrow_left"]').forEach(el => {
      const baseId = el.id.replace('_arrow_left', '');
      sliders.add(baseId);
    });

    sliders.forEach(baseId => {
      const cleanup = initSliders();
      if (cleanup) cleanupFns.push(cleanup);
    });

    return () => {
      cleanupFns.forEach(fn => fn());
    };
  }, [activeLayout, isPreview, activePage]);

  // Sidebar Resizing Handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingLeft) {
        setLeftSidebarWidth(Math.min(Math.max(e.clientX, 220), 500));
      } else if (isResizingRight) {
        setRightSidebarWidth(Math.min(Math.max(window.innerWidth - e.clientX, 250), 600));
      }
    };
    
    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      // Change cursor globally while dragging
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingLeft, isResizingRight]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'SWITCH_PAGE') {
        // Support matching by pageId (number) OR pageSlug (string)
        const targetPage = pages.find(p =>
          (event.data.pageId !== undefined && p.id === event.data.pageId) ||
          (event.data.pageSlug !== undefined && p.slug === event.data.pageSlug)
        );
        if (targetPage) {
          handleSwitchPage(targetPage);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [pages]);

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
        if (response.status === 401) {
          alert('Session expired. Please log in again.');
          navigate('/');
        } else {
          const errorData = await response.json();
          console.error('Save failed:', errorData);
          alert('Failed to save layout. Server returned an error.');
        }
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
    if (!isCtrlPressed) {
      setSelectedElementIds([]);
    }
  };

  const handleMouseMove = (e) => {
    if (!isLassoing || !lassoStart || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left + viewportRef.current.scrollLeft;
    const currentY = e.clientY - rect.top + viewportRef.current.scrollTop;
    setLassoEnd({ x: currentX, y: currentY });

    const elements = viewportRef.current.querySelectorAll('.builder-canvas-element');
    
    const x1 = Math.min(lassoStart.x, currentX);
    const y1 = Math.min(lassoStart.y, currentY);
    const x2 = Math.max(lassoStart.x, currentX);
    const y2 = Math.max(lassoStart.y, currentY);

    const overlappedIds = [];
    elements.forEach(elNode => {
      const elId = elNode.getAttribute('data-element-id');
      if (!elId) return;

      const elRect = elNode.getBoundingClientRect();
      const viewRect = viewportRef.current.getBoundingClientRect();
      
      const elLeft = elRect.left - viewRect.left + viewportRef.current.scrollLeft;
      const elTop = elRect.top - viewRect.top + viewportRef.current.scrollTop;
      const elRight = elLeft + elRect.width;
      const elBottom = elTop + elRect.height;

      const strictlyContained = (elLeft >= x1 && elRight <= x2 && elTop >= y1 && elBottom <= y2);
      if (strictlyContained) {
        overlappedIds.push(elId);
      }
    });

    const groupIdsToSelect = new Set();
    overlappedIds.forEach(id => {
      const found = findElementInLayout(id);
      if (found?.element?.groupId) {
        groupIdsToSelect.add(found.element.groupId);
      }
    });

    const finalSelectedIds = isCtrlPressed ? [...selectedElementIds] : [];
    activeLayout.forEach(sec => {
      (sec.elements || []).forEach(el => {
        const isOverlapped = overlappedIds.includes(el.id);
        const isInGroup = el.groupId && groupIdsToSelect.has(el.groupId);
        if (isOverlapped || isInGroup) {
          if (!finalSelectedIds.includes(el.id)) {
            finalSelectedIds.push(el.id);
          }
        }
      });
    });

    setSelectedElementIds(finalSelectedIds);
  };

  const handleMouseUp = () => {
    setIsLassoing(false);
    setLassoStart(null);
    setLassoEnd(null);
  };

  const handleElementClick = (e, elementId) => {
    if (isPreview) return;
    e.stopPropagation();
    setContextMenu(null);
    
    const clickedEl = findElementInLayout(elementId)?.element;
    const gId = clickedEl?.groupId;
    
    const elementsToToggle = [];
    if (gId) {
      activeLayout.forEach(sec => {
        (sec.elements || []).forEach(el => {
          if (el.groupId === gId) {
            elementsToToggle.push(el.id);
          }
        });
      });
    } else {
      elementsToToggle.push(elementId);
    }

    if ((e.ctrlKey && e.altKey) || e.ctrlKey || e.metaKey || isCtrlPressed) {
      setSelectedElementIds(prev => {
        const allSelected = elementsToToggle.every(id => prev.includes(id));
        if (allSelected) {
          return prev.filter(id => !elementsToToggle.includes(id));
        } else {
          return [...new Set([...prev, ...elementsToToggle])];
        }
      });
    } else {
      setSelectedElementIds(elementsToToggle);
    }
  };

  const compileToStaticHtml = (page = activePage, currentSite = site, allPages = pages, previewViewMode = 'desktop', isLivePreview = false) => {
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
      /* === Entrance Animations === */
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes fadeInDown { from { opacity: 0; transform: translateY(-40px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes fadeInRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes slideDown { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes slideLeft { from { transform: translateX(-60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      @keyframes slideRight { from { transform: translateX(60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      @keyframes zoomIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      @keyframes zoomInUp { from { transform: scale(0.5) translateY(40px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
      @keyframes zoomInDown { from { transform: scale(0.5) translateY(-40px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
      @keyframes flipInX { from { transform: perspective(400px) rotateX(90deg); opacity: 0; } to { transform: perspective(400px) rotateX(0deg); opacity: 1; } }
      @keyframes flipInY { from { transform: perspective(400px) rotateY(90deg); opacity: 0; } to { transform: perspective(400px) rotateY(0deg); opacity: 1; } }
      @keyframes rotateIn { from { transform: rotate(-200deg); opacity: 0; } to { transform: rotate(0deg); opacity: 1; } }
      @keyframes rollIn { from { transform: translateX(-100%) rotate(-120deg); opacity: 0; } to { transform: translateX(0) rotate(0deg); opacity: 1; } }
      @keyframes lightSpeedIn { from { transform: translateX(100%) skewX(-30deg); opacity: 0; } 60% { transform: skewX(20deg); opacity: 1; } 80% { transform: skewX(-5deg); } to { transform: none; opacity: 1; } }
      @keyframes jackInTheBox { from { opacity: 0; transform: scale(0.1) rotate(30deg); transform-origin: center bottom; } 50% { transform: rotate(-10deg); } 70% { transform: rotate(3deg); } to { opacity: 1; transform: scale(1); } }
      @keyframes expandIn { from { transform: scaleX(0); opacity: 0; transform-origin: left; } to { transform: scaleX(1); opacity: 1; transform-origin: left; } }
      @keyframes dropIn { from { transform: translateY(-300px); opacity: 0; } 60% { transform: translateY(15px); opacity: 1; } 80% { transform: translateY(-5px); } to { transform: translateY(0); } }
      /* === Attention / Looping Animations === */
      @keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-20px); } 60% { transform: translateY(-10px); } }
      @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); } 20%, 40%, 60%, 80% { transform: translateX(6px); } }
      @keyframes wobble { 0% { transform: translateX(0%); } 15% { transform: translateX(-15%) rotate(-5deg); } 30% { transform: translateX(10%) rotate(3deg); } 45% { transform: translateX(-10%) rotate(-3deg); } 60% { transform: translateX(5%) rotate(2deg); } 75% { transform: translateX(-3%) rotate(-1deg); } 100% { transform: translateX(0%); } }
      @keyframes rubberBand { 0% { transform: scale3d(1,1,1); } 30% { transform: scale3d(1.25,0.75,1); } 40% { transform: scale3d(0.75,1.25,1); } 50% { transform: scale3d(1.15,0.85,1); } 65% { transform: scale3d(0.95,1.05,1); } 75% { transform: scale3d(1.05,0.95,1); } 100% { transform: scale3d(1,1,1); } }
      @keyframes tada { 0% { transform: scale3d(1,1,1); } 10%, 20% { transform: scale3d(0.9,0.9,0.9) rotate(-3deg); } 30%, 50%, 70%, 90% { transform: scale3d(1.1,1.1,1.1) rotate(3deg); } 40%, 60%, 80% { transform: scale3d(1.1,1.1,1.1) rotate(-3deg); } 100% { transform: scale3d(1,1,1); } }
      @keyframes heartbeat { 0% { transform: scale(1); } 14% { transform: scale(1.15); } 28% { transform: scale(1); } 42% { transform: scale(1.15); } 70% { transform: scale(1); } 100% { transform: scale(1); } }
      @keyframes jello { 0%, 11.1%, 100% { transform: none; } 22.2% { transform: skewX(-12.5deg) skewY(-12.5deg); } 33.3% { transform: skewX(6.25deg) skewY(6.25deg); } 44.4% { transform: skewX(-3.125deg) skewY(-3.125deg); } 55.5% { transform: skewX(1.5625deg) skewY(1.5625deg); } 66.6% { transform: skewX(-0.78125deg) skewY(-0.78125deg); } 77.7% { transform: skewX(0.390625deg) skewY(0.390625deg); } 88.8% { transform: skewX(-0.1953125deg) skewY(-0.1953125deg); } }
      @keyframes flash { 0%, 50%, 100% { opacity: 1; } 25%, 75% { opacity: 0; } }
      @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
      @keyframes swing { 20% { transform: rotate(15deg); } 40% { transform: rotate(-10deg); } 60% { transform: rotate(5deg); } 80% { transform: rotate(-5deg); } 100% { transform: rotate(0deg); } }
      @keyframes glitch { 0%, 100% { transform: translate(0); } 20% { transform: translate(-3px, 3px); } 40% { transform: translate(-3px, -3px); } 60% { transform: translate(3px, 3px); } 80% { transform: translate(3px, -3px); } }
      @keyframes breathe { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.04); opacity: 0.85; } }
      /* === Exit Animations === */
      @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
      @keyframes fadeOutUp { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-40px); } }
      @keyframes fadeOutDown { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(40px); } }
      @keyframes zoomOut { from { transform: scale(1); opacity: 1; } to { transform: scale(0.5); opacity: 0; } }
      @keyframes slideOutLeft { from { transform: translateX(0); opacity: 1; } to { transform: translateX(-60px); opacity: 0; } }
      @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(60px); opacity: 0; } }
    `;

    // Generate Hover Styles CSS
    let hoverStylesCss = '';
    const targetLayout = page.layout || [];
    targetLayout.forEach(sec => {
      (sec.elements || []).forEach(el => {
        if (el.type === 'image') {
          const hoverFilter = computeImageHoverFilter(el.styles);
          const scale = el.styles?.imageHoverScale || '1';
          const rotation = el.styles?.imageHoverRotate || '0';
          if (el.styles?.hoverOverlayEnabled || hoverFilter !== computeImageFilter(el.styles) || scale !== '1' || rotation !== '0') {
            hoverStylesCss += `[data-element-id="${el.id}"]:hover .image-media { filter: ${hoverFilter} !important; transform: scale(${scale}) rotate(${rotation}deg); }`;
          }
        }
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

    const canvasWidth = previewViewMode === 'mobile' ? '375px' : previewViewMode === 'tablet' ? '768px' : '1280px';
    const maxContainerWidth = previewViewMode === 'mobile' ? '375px' : previewViewMode === 'tablet' ? '768px' : '1200px';
    const containerPadding = previewViewMode === 'mobile' ? '15px' : '20px';

    let styles = `
      ${fontImport}
      
      :root {
        --primary: ${currentSite.theme?.primaryColor || '#6366f1'};
        --bg-color: ${pageBgColor};
        --text-color: ${currentSite.theme?.textColor || '#333333'};
        --font-family: ${fontFamily};
      }

      * { box-sizing: border-box; margin: 0; padding: 0; }

      html, body {
        background-color: ${pageBgColor};
        color: var(--text-color);
        font-family: var(--font-family);
        line-height: 1.5;
        overflow-x: hidden;
        margin: 0;
        padding: 0;
        width: 100%;
        min-height: 100vh;
      }

      img {
        max-width: 100%;
        height: auto;
        display: block;
      }

      .preview-wrapper {
        width: ${canvasWidth};
        max-width: 100%;
        margin: 0 auto;
        position: relative;
        background-color: var(--bg-color);
        min-height: 100vh;
      }

      .site-section {
        position: relative;
        width: 100%;
        background-color: transparent !important;
        min-height: 200px;
      }

      .section-container {
        width: 100%;
        max-width: ${maxContainerWidth};
        margin: 0 auto;
        padding: 0 ${containerPadding};
        position: relative;
        box-sizing: border-box;
        min-height: 200px;
      }

      .element-wrapper {
        position: absolute;
        display: inline-block;
        box-sizing: border-box;
      }

      .site-builder-btn {
        border: none;
        cursor: pointer;
        display: inline-block;
        transition: opacity 0.2s;
      }
      
      .site-builder-btn:hover { opacity: 0.9; }

      .image-frame { position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: inherit; }
      .image-media { width: 100%; height: 100%; display: block; border-radius: inherit; }
      .image-frame:hover .img-hover-overlay { opacity: var(--overlay-opacity, 1) !important; }
      .search-match { outline: 3px solid var(--primary) !important; outline-offset: 3px; box-shadow: 0 0 0 6px rgba(99,102,241,.18) !important; }

      .platform-contact-form {
        width: 100%;
        padding: 20px;
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.05);
        border-radius: 8px;
      }

      .form-group { margin-bottom: 12px; }

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

      .form-submit-btn:hover { opacity: 0.9; }

      .modal-overlay {
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
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

      .modal-overlay.active { opacity: 1; pointer-events: auto; }

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
        top: 15px; right: 15px;
        background: none; border: none;
        color: inherit;
        font-size: 18px;
        cursor: pointer;
        opacity: 0.7;
      }

      .modal-close:hover { opacity: 1; }

      .search-dimmed {
        opacity: 0.1 !important;
        pointer-events: none !important;
        filter: grayscale(100%) !important;
        transition: opacity 0.3s, filter 0.3s;
      }

      ${animationKeyframes}
      ${hoverStylesCss}
      ${currentSite.custom_css || ''}
    `;



    let bodyHtml = '';
    const pageLayout = page.layout || [];
    pageLayout.forEach(sec => {
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

      // Only apply background if explicitly set (not inherited)
      const hasCustomBg = sec.settings?.backgroundColor && sec.settings.backgroundColor !== 'transparent';
      if (hasCustomBg) {
        secStyles += `background-color: ${sec.settings.backgroundColor}; `;
      }

      bodyHtml += `
        <section id="${sec.id}" class="site-section" style="${secStyles}">
          <div class="section-container" style="max-width: ${containerWidth};">
      `;

      (sec.elements || []).forEach(el => {
        let elStyles = `left: ${el.x || 0}px; top: ${el.y || 0}px; position: absolute; `;
        if (el.width) elStyles += `width: ${el.width}px; `;
        if (el.height) elStyles += `height: ${el.height}px; `;
        
        if (el.styles) {
          Object.keys(el.styles).forEach(k => {
            if (el.type === 'shape' && (k === 'backgroundColor' || k === 'boxShadow')) return;
            let val = el.styles[k];
            if (['fontSize', 'padding', 'margin', 'borderRadius', 'borderWidth', 'marginBottom', 'height', 'width'].includes(k) && !isNaN(val) && val !== '') val = `${val}px`;
            elStyles += `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${val}; `;
          });
        }

        let aosAttrs = '';
        if (el.animation && el.animation.type && el.animation.type !== 'none') {
          aosAttrs = ` data-aos-name="${el.animation.type}" data-aos-duration="${el.animation.duration || 1}s" data-aos-delay="${el.animation.delay || 0}s" data-aos-iteration="${el.animation.iteration || '1'}" `;
          if (['fadeIn','fadeInUp','fadeInDown','fadeInLeft','fadeInRight','slideUp','slideDown','slideLeft','slideRight','zoomIn','zoomInUp','zoomInDown','flipInX','flipInY','rotateIn','rollIn','lightSpeedIn','jackInTheBox','expandIn','dropIn'].includes(el.animation.type)) {
            elStyles += `opacity: 0; `;
          }
        }

        let innerMarkup = '';
        if (el.type === 'heading') {
          const Tag = el.content?.tag || 'h2';
          innerMarkup = `<${Tag} style="margin: 0; font-size: inherit; color: inherit; white-space: pre-wrap;">${el.content?.text || 'Heading'}</${Tag}>`;
        } else if (el.type === 'text') {
          innerMarkup = `<div style="font-size: inherit; color: inherit; white-space: pre-wrap;">${(el.content?.text || 'Paragraph text').replace(/\n/g, '<br>')}</div>`;
        } else if (el.type === 'button') {
          if (el.action && el.action.type === 'submit_inputs') {
            innerMarkup = `<button class="site-builder-btn" onclick="submitInputs(event, '${el.action.value || ''}')" style="border: none; background: transparent; color: inherit; font-size: inherit; font-weight: inherit; padding: 0; border-radius: inherit; white-space: pre-wrap;">${el.content?.text || 'Submit'}</button>`;
          } else {
            innerMarkup = `<button class="site-builder-btn" style="border: none; background: transparent; color: inherit; font-size: inherit; font-weight: inherit; padding: 0; border-radius: inherit; white-space: pre-wrap;">${el.content?.text || 'Button'}</button>`;
          }
        } else if (el.type === 'image') {
          const imgFilter = computeImageFilter(el.styles);
          const fit = el.styles?.objectFit || 'cover';
          const pos = el.styles?.objectPosition || 'center';
          const hasOverlay = el.styles?.hoverOverlayEnabled;
          const overlayColor = el.styles?.hoverOverlayColor || 'rgba(0,0,0,0.6)';
          const overlayTextColor = el.styles?.hoverOverlayTextColor || '#ffffff';
          const overlayCoverage = el.styles?.hoverOverlayCoverage || 'full';
          const overlayText = el.styles?.hoverOverlayText || '';
          const maskSource = el.content?.src || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80';
          const alphaMaskCss = el.styles?.hoverOverlayRespectTransparency === false ? '' : `mask-image:url(&quot;${maskSource}&quot;);-webkit-mask-image:url(&quot;${maskSource}&quot;);mask-size:${fit};-webkit-mask-size:${fit};mask-position:${pos};-webkit-mask-position:${pos};mask-repeat:no-repeat;-webkit-mask-repeat:no-repeat;`;

          let overlayStyles = `position: absolute; left: 0; top: 0; width: 100%; height: 100%; background-color: ${overlayColor}; color: ${overlayTextColor}; display: flex; align-items: center; justify-content: center; flex-direction: column; opacity: 0; transition: opacity 0.3s ease; pointer-events: none; padding: 12px; box-sizing: border-box; font-weight: 600; text-align: center; border-radius: inherit;${alphaMaskCss}`;
          if (overlayCoverage === 'top-half') overlayStyles += ` height: 50%;`;
          else if (overlayCoverage === 'bottom-half') overlayStyles += ` top: 50%; height: 50%;`;
          else if (overlayCoverage === 'left-half') overlayStyles += ` width: 50%;`;
          else if (overlayCoverage === 'right-half') overlayStyles += ` left: 50%; width: 50%;`;
          else if (overlayCoverage === 'gradient-bottom') overlayStyles += ` background: linear-gradient(to top, ${overlayColor}, transparent); top: 40%; height: 60%; align-items: flex-end; justify-content: flex-end;`;

          innerMarkup = `
            <div class="image-frame" style="--overlay-opacity: ${el.styles?.hoverOverlayOpacity ?? 1};">
              <img class="image-media" src="${el.content?.src || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80'}" alt="${el.content?.alt || 'Graphic'}" style="object-fit: ${fit}; object-position: ${pos}; filter: ${imgFilter}; transition: filter ${el.styles?.imageHoverSpeed || '0.3'}s ease, transform ${el.styles?.imageHoverSpeed || '0.3'}s ease;" />
              ${hasOverlay ? `<div class="img-hover-overlay" style="${overlayStyles}">${overlayText ? `<span>${overlayText}</span>` : ''}</div>` : ''}
            </div>
          `;
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
        } else if (el.type === 'shape') {
          const shapeType = el.content?.shapeType || 'rectangle';
          const fillType = el.content?.fillType || 'filled';
          const strokeWidth = el.content?.borderWidth || 4;
          
          const bgColor = el.styles?.backgroundColor || el.styles?.color || '#6366f1';
          const isBorder = fillType === 'border';
          const fill = isBorder ? 'transparent' : bgColor;
          const stroke = isBorder ? bgColor : 'none';
          const sw = isBorder ? strokeWidth : 0;
          const filter = el.styles?.boxShadow ? `filter: drop-shadow(${el.styles.boxShadow});` : '';

          let pathStr = '';
          if (shapeType === 'circle') pathStr = `<ellipse cx="50" cy="50" rx="50" ry="50" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" vector-effect="non-scaling-stroke" />`;
          else if (shapeType === 'triangle') pathStr = `<polygon points="50,0 100,100 0,100" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" vector-effect="non-scaling-stroke" />`;
          else if (shapeType === 'pentagon') pathStr = `<polygon points="50,0 100,38 82,100 18,100 0,38" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" vector-effect="non-scaling-stroke" />`;
          else if (shapeType === 'hexagon') pathStr = `<polygon points="25,0 75,0 100,50 75,100 25,100 0,50" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" vector-effect="non-scaling-stroke" />`;
          else if (shapeType === 'octagon') pathStr = `<polygon points="30,0 70,0 100,30 100,70 70,100 30,100 0,70 0,30" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" vector-effect="non-scaling-stroke" />`;
          else if (shapeType === 'star') pathStr = `<polygon points="50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" vector-effect="non-scaling-stroke" />`;
          else if (shapeType === 'diamond') pathStr = `<polygon points="50,0 100,50 50,100 0,50" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" vector-effect="non-scaling-stroke" />`;
          else pathStr = `<rect x="0" y="0" width="100" height="100" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" vector-effect="non-scaling-stroke" />`;



          innerMarkup = `
            <div style="width: 100%; height: 100%;">
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style="overflow: visible; ${filter}">
                ${pathStr}
              </svg>
            </div>
          `;
        } else if (el.type === 'link') {
          innerMarkup = `<a href="${el.content?.link || '#'}" style="color: inherit; text-decoration: inherit; display: inline-block; width: 100%; height: 100%;">${el.content?.text || 'Link'}</a>`;
        } else if (el.type === 'site_search') {
          innerMarkup = `
            <div style="display: flex; align-items: center; width: 100%; height: 100%; position: relative;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 10px; opacity: 0.7;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input 
                type="text" 
                placeholder="${el.content?.placeholder || 'Search this site...'}" 
                oninput="window.runSiteSearch(this.value)"
                style="padding: 10px 12px 10px 35px; width: 100%; height: 100%; border-radius: inherit; border: none; background: transparent; color: inherit; font-size: 14px; outline: none;" 
              />
            </div>
          `;
        } else if (el.type === 'image_slider') {
          const slides = el.content?.slides || [];
          const showArrows = el.content?.showArrows !== false;
          const showDots = el.content?.showDots !== false;
          const sliderHeight = el.content?.height || el.height || 400;
          const transition = el.content?.transition || 'fade';
          const transitionDuration = el.content?.transitionDuration || 0.5;
          const baseId = `slider_${el.id}`;
          
          // Stringify and safely escape configuration for HTML attribute
          const configStr = JSON.stringify({ slides, autoPlayInterval: el.content?.autoPlayInterval || 3000, transition, transitionDuration })
            .replace(/'/g, "&#39;")
            .replace(/"/g, "&quot;");
          
          innerMarkup = `
            <div id="${baseId}_container" data-slider-config="${configStr}" style="width: 100%; height: ${sliderHeight}px; position: relative; overflow: hidden; border-radius: inherit;">
              ${slides.map((slide, idx) => `
                <div id="${baseId}_slide${idx + 1}_img" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: ${idx === 0 ? 1 : 0}; transition: all ${transitionDuration}s ease-in-out; z-index: ${idx === 0 ? 2 : 1};">
                  <img src="${slide.image}" alt="${(slide.caption || `Slide ${idx + 1}`).replace(/"/g, '&quot;')}" style="width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; user-select: none;" draggable="false" />
                </div>
              `).join('')}
              
              ${slides[0]?.caption ? `
                <div id="${baseId}_slide1_text" style="position: absolute; bottom: 0; left: 0; right: 0; padding: 20px; background: linear-gradient(transparent, rgba(0,0,0,0.7)); color: #fff; font-size: 14px; z-index: 3; opacity: 1; transition: opacity ${transitionDuration}s ease-in-out;">
                  ${slides[0].caption}
                </div>
              ` : ''}
              
              ${showArrows && slides.length > 1 ? `
                <button id="${baseId}_arrow_left" type="button" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); backdrop-filter: blur(10px); color: #fff; border: 2px solid rgba(255,255,255,0.2); border-radius: 50%; width: 44px; height: 44px; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">‹</button>
                <button id="${baseId}_arrow_right" type="button" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); backdrop-filter: blur(10px); color: #fff; border: 2px solid rgba(255,255,255,0.2); border-radius: 50%; width: 44px; height: 44px; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">›</button>
              ` : ''}
              
              ${showDots && slides.length > 1 ? `
                <div style="position: absolute; bottom: ${slides[0]?.caption ? '50px' : '15px'}; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; z-index: 10; padding: 8px 12px; background: rgba(0,0,0,0.4); backdrop-filter: blur(10px); border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">
                  ${slides.map((_, idx) => `
                    <button id="${baseId}_dot${idx + 1}" type="button" style="width: 10px; height: 10px; border-radius: 50%; border: none; background: ${idx === 0 ? '#6366f1' : 'rgba(255,255,255,0.4)'}; cursor: pointer; transform: ${idx === 0 ? 'scale(1.3)' : 'scale(1)'}; transition: all 0.3s ease; padding: 0; box-shadow: ${idx === 0 ? '0 0 10px rgba(99,102,241,0.8)' : 'none'};"></button>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `;
        } else if (el.type === 'nav_arrow') {
          const dir = el.content?.direction || 'next';
          const navType = el.content?.navType || 'page';
          const arrowStyle = el.content?.arrowStyle || 'chevron';
          const arrowForm = el.content?.arrowForm || 'circle';
          const size = Math.min(parseInt(el.width || 50), parseInt(el.height || 50)) * 0.5;
          
          const color = el.styles?.color || '#ffffff';
          const bgColor = el.styles?.backgroundColor || 'rgba(0,0,0,0.5)';
          
          let formBorderRadius = '50%';
          let formBg = bgColor;
          let formBorder = 'none';
          let formBackdrop = 'none';
          let formShadow = 'none';
          
          if (arrowForm === 'square') {
            formBorderRadius = '0px';
          } else if (arrowForm === 'rounded') {
            formBorderRadius = '8px';
          } else if (arrowForm === 'glassmorphism') {
            formBorderRadius = '50%';
            formBg = 'rgba(255, 255, 255, 0.15)';
            formBackdrop = 'blur(10px)';
            formBorder = '1px solid rgba(255, 255, 255, 0.25)';
            formShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.2)';
          } else if (arrowForm === 'outline') {
            formBorderRadius = '50%';
            formBg = 'transparent';
            formBorder = `2px solid ${color}`;
          } else if (arrowForm === 'minimal') {
            formBorderRadius = '0px';
            formBg = 'transparent';
            formBorder = 'none';
          }
          
          const isNext = dir === 'next';
          let svgContent = '';
          if (arrowStyle === 'arrow') {
            svgContent = isNext 
              ? `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`
              : `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`;
          } else if (arrowStyle === 'long-arrow') {
            svgContent = isNext
              ? `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="12" x2="20" y2="12" /><polyline points="14 6 20 12 14 18" /></svg>`
              : `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="12" x2="4" y2="12" /><polyline points="10 6 4 12 10 18" /></svg>`;
          } else if (arrowStyle === 'triangle') {
            const rot = isNext ? '90deg' : '-90deg';
            svgContent = `<svg width="${size * 0.8}" height="${size * 0.8}" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(${rot}); transform-origin: center;"><path d="M3 20h18L12 4z"/></svg>`;
          } else if (arrowStyle === 'double-chevron') {
            svgContent = isNext
              ? `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" /></svg>`
              : `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" /></svg>`;
          } else { // chevron
            svgContent = isNext
              ? `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`
              : `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
          }

          let updatedStyles = elStyles;
          updatedStyles += `border-radius: ${formBorderRadius} !important; `;
          updatedStyles += `background-color: ${formBg} !important; `;
          if (formBorder !== 'none') updatedStyles += `border: ${formBorder} !important; `;
          if (formBackdrop !== 'none') updatedStyles += `backdrop-filter: ${formBackdrop} !important; -webkit-backdrop-filter: ${formBackdrop} !important; `;
          if (formShadow !== 'none') updatedStyles += `box-shadow: ${formShadow} !important; `;
          
          let clickHandler = '';
          if (navType === 'slider') {
            const targetId = el.content?.targetSliderId;
            clickHandler = `
              if (window.sliderControllers) {
                const controllers = window.sliderControllers;
                const targetId = '${targetId || ''}';
                if (targetId && controllers['slider_' + targetId]) {
                  controllers['slider_' + targetId]['${dir === 'next' ? 'next' : 'prev'}']();
                } else {
                  const firstKey = Object.keys(controllers)[0];
                  if (firstKey) controllers[firstKey]['${dir === 'next' ? 'next' : 'prev'}']();
                }
              }
            `;
          } else {
            clickHandler = `
              window.parent.postMessage({type: 'SWITCH_PAGE_DIR', direction: '${dir}'}, '*');
            `;
          }

          updatedStyles += `transition: all 0.2s ease; cursor: pointer; display: flex; align-items: center; justify-content: center; `;

          innerMarkup = `
            <div 
              style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;"
              onclick="event.stopPropagation(); ${clickHandler.replace(/\s+/g, ' ')}"
              onmouseenter="this.style.transform = 'scale(1.1)'; this.style.opacity = '0.9';"
              onmouseleave="this.style.transform = 'scale(1)'; this.style.opacity = '1';"
            >
              ${svgContent}
            </div>
          `;
          
          elStyles = updatedStyles;
        }

        let wrapStart = '';
        let wrapEnd = '';
        if (el.action && el.action.type && el.action.type !== 'none') {
          const { type, value, subject, openInNewTab } = el.action;
          if (type === 'url') {
            wrapStart = `<a href="${value || '#'}" target="${openInNewTab ? '_blank' : '_self'}" rel="noopener noreferrer" style="text-decoration: none; color: inherit; display: block; width: 100%; height: 100%;">`;
            wrapEnd = `</a>`;
          } else if (type === 'page') {
            // Use postMessage so the click is handled by the parent React component
            // (avoids breaking out of the iframe into React Router via slug.html href)
            wrapStart = `<a href="#" onclick="event.preventDefault(); window.parent.postMessage({type:'SWITCH_PAGE',pageSlug:'${value}'}, '*');" style="text-decoration: none; color: inherit; display: block; width: 100%; height: 100%; cursor: pointer;">`;
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
          } else if (type === 'drawer') {
            const encodedAction = encodeURIComponent(JSON.stringify(el.action));
            wrapStart = `<div onclick="openSiteDrawer('${encodedAction}')" style="cursor: pointer; width: 100%; height: 100%;">`;
            wrapEnd = `</div>`;
          } else if (type === 'popup_modal') {
            const encodedAction = encodeURIComponent(JSON.stringify(el.action));
            wrapStart = `<div onclick="openSiteModal('${encodedAction}')" style="cursor: pointer; width: 100%; height: 100%;">`;
            wrapEnd = `</div>`;
          } else if (type === 'toast') {
            const encodedAction = encodeURIComponent(JSON.stringify(el.action));
            wrapStart = `<div onclick="showSiteToast('${encodedAction}')" style="cursor: pointer; width: 100%; height: 100%;">`;
            wrapEnd = `</div>`;
          } else if (type === 'copy_text') {
            const encodedText = encodeURIComponent(el.action.copyText || '');
            wrapStart = `<div onclick="copySiteText('${encodedText}')" style="cursor: pointer; width: 100%; height: 100%;">`;
            wrapEnd = `</div>`;
          } else if (type === 'scroll_top') {
            wrapStart = `<div onclick="window.scrollTo({top: 0, behavior: 'smooth'})" style="cursor: pointer; width: 100%; height: 100%;">`;
            wrapEnd = `</div>`;
          } else if (type === 'toggle_theme') {
            wrapStart = `<div onclick="document.body.classList.toggle('dark-mode')" style="cursor: pointer; width: 100%; height: 100%;">`;
            wrapEnd = `</div>`;
          } else if (type === 'confetti') {
            wrapStart = `<div onclick="fireSiteConfetti()" style="cursor: pointer; width: 100%; height: 100%;">`;
            wrapEnd = `</div>`;
          } else if (type === 'toggle_element') {
            const tid = el.action.toggleTargetId || '';
            const beh = el.action.toggleBehavior || 'toggle';
            wrapStart = `<div onclick="toggleSiteElement('${tid}', '${beh}')" style="cursor: pointer; width: 100%; height: 100%;">`;
            wrapEnd = `</div>`;
          }
        }

        bodyHtml += `
          <div class="element-wrapper searchable-site-element" data-element-id="${el.id}" style="${elStyles}"${aosAttrs}>
            ${wrapStart}
            ${innerMarkup}
            ${wrapEnd}
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
      <html lang="${language}" dir="${language === 'ar' ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${page.meta_title || currentSite.name}</title>
        <meta name="description" content="${page.meta_description || ''}">
        <style>
          ${styles}
          body { display: flex; justify-content: center; }
        </style>
      </head>
      <body>
        <div class="preview-wrapper">
          ${bodyHtml}
        </div>


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

          function openSiteDrawer(cfgEncoded) {
            try {
              var cfg = JSON.parse(decodeURIComponent(cfgEncoded));
              var side = cfg.drawerSide || 'right';
              var width = cfg.drawerWidth || '380px';
              var bg = cfg.drawerBg || '#1e293b';
              var textColor = cfg.drawerTextColor || '#f1f5f9';
              var title = cfg.drawerTitle || 'Side Panel';
              var items = cfg.drawerItems || [
                { id: 1, type: 'text', content: 'Welcome to the side panel!' },
                { id: 2, type: 'divider', content: '' },
                { id: 3, type: 'link', content: 'Home | /' },
                { id: 4, type: 'link', content: 'Contact Us | /contact' }
              ];

              var existingPanel = document.getElementById('site-drawer-panel');
              if (existingPanel) existingPanel.remove();
              var existingBackdrop = document.getElementById('site-drawer-backdrop');
              if (existingBackdrop) existingBackdrop.remove();

              var backdrop = document.createElement('div');
              backdrop.id = 'site-drawer-backdrop';
              backdrop.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:99990;backdrop-filter:blur(6px);transition:opacity 0.25s;';

              var panel = document.createElement('div');
              panel.id = 'site-drawer-panel';
              var sideStyle = side === 'left' ? 'left:0;' : 'right:0;';
              var boxShadow = side === 'left' ? '10px 0 60px rgba(0,0,0,0.5)' : '-10px 0 60px rgba(0,0,0,0.5)';
              panel.style.cssText = 'position:fixed;top:0;' + sideStyle + 'width:' + width + ';max-width:100vw;height:100vh;background:' + bg + ';color:' + textColor + ';z-index:99991;display:flex;flex-direction:column;box-shadow:' + boxShadow + ';font-family:sans-serif;box-sizing:border-box;';

              backdrop.onclick = function() {
                panel.remove();
                backdrop.remove();
              };

              var headerHtml = '<div style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.1);"><h2 style="margin:0;font-size:18px;font-weight:700;">' + title + '</h2><button id="close-drawer-btn" style="background:rgba(255,255,255,0.1);border:none;color:' + textColor + ';width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;">✕</button></div>';

              var bodyHtml = '<div style="flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:12px;">';
              items.forEach(function(item) {
                var s = item.styles || {};
                function toCss(styleObj) {
                  return Object.keys(styleObj).map(function(k) {
                    var prop = k.replace(/([A-Z])/g, function(m) { return '-' + m.toLowerCase(); });
                    return prop + ':' + styleObj[k];
                  }).join(';');
                }

                if (item.type === 'spacer') {
                  var h = s.height || '24px';
                  bodyHtml += '<div style="height:' + h + ';flex-shrink:0;"></div>';
                } else if (item.type === 'divider') {
                  var divStyle = 'border:none;border-top:' + (s.borderTopWidth || '1px') + ' solid ' + (s.borderColor || 'rgba(255,255,255,0.12)') + ';margin:8px 0;';
                  bodyHtml += '<hr style="' + divStyle + '" />';
                } else if (item.type === 'image') {
                  var imgStyle = 'width:100%;object-fit:' + (s.objectFit || 'cover') + ';border-radius:' + (s.borderRadius || '8px') + ';max-height:' + (s.maxHeight || '240px') + ';display:block;';
                  bodyHtml += '<img src="' + (item.content || '') + '" style="' + imgStyle + '" />';
                } else if (item.type === 'heading') {
                  var hStyle = 'margin:0;font-size:' + (s.fontSize || '20px') + ';font-weight:' + (s.fontWeight || '700') + ';color:' + (s.color || textColor) + ';text-align:' + (s.textAlign || 'left') + ';line-height:' + (s.lineHeight || '1.3') + ';';
                  bodyHtml += '<h2 style="' + hStyle + '">' + (item.content || '') + '</h2>';
                } else if (item.type === 'link') {
                  var parts = (item.content || '').split('|');
                  var label = parts[0] ? parts[0].trim() : 'Link Item';
                  var url = parts[1] ? parts[1].trim() : '#';
                  var linkStyle = 'display:flex;align-items:center;justify-content:space-between;padding:' + (s.padding || '12px 16px') + ';border-radius:' + (s.borderRadius || '8px') + ';background:' + (s.background || 'rgba(255,255,255,0.06)') + ';color:' + (s.color || textColor) + ';text-decoration:none;font-weight:' + (s.fontWeight || '500') + ';font-size:' + (s.fontSize || '14px') + ';';
                  bodyHtml += '<a href="' + url + '" style="' + linkStyle + '"><span>' + label + '</span><span>→</span></a>';
                } else if (item.type === 'button') {
                  var btnStyle = 'width:100%;padding:' + (s.padding || '12px 16px') + ';border-radius:' + (s.borderRadius || '8px') + ';background:' + (s.background || '#6366f1') + ';color:' + (s.color || '#fff') + ';border:none;font-weight:' + (s.fontWeight || '600') + ';font-size:' + (s.fontSize || '14px') + ';cursor:pointer;';
                  var btnTag = item.href ? '<a href="' + item.href + '" style="' + btnStyle + 'text-decoration:none;display:block;text-align:center;">' + (item.content || 'Click Me') + '</a>' : '<button style="' + btnStyle + '">' + (item.content || 'Click Me') + '</button>';
                  bodyHtml += btnTag;
                } else {
                  // text
                  var pStyle = 'margin:0;font-size:' + (s.fontSize || '15px') + ';line-height:' + (s.lineHeight || '1.6') + ';color:' + (s.color || textColor) + ';font-weight:' + (s.fontWeight || '400') + ';text-align:' + (s.textAlign || 'left') + ';opacity:0.9;';
                  bodyHtml += '<p style="' + pStyle + '">' + (item.content || '') + '</p>';
                }
              });
              bodyHtml += '</div>';

              panel.innerHTML = headerHtml + bodyHtml;
              document.body.appendChild(backdrop);
              document.body.appendChild(panel);

              document.getElementById('close-drawer-btn').onclick = function() {
                panel.remove();
                backdrop.remove();
              };
            } catch(err) {
              console.error("Error opening drawer:", err);
            }
          }

          function openSiteModal(cfgEncoded) {
            try {
              var cfg = JSON.parse(decodeURIComponent(cfgEncoded));
              var existingModal = document.getElementById('site-modal-backdrop');
              if (existingModal) existingModal.remove();

              var backdrop = document.createElement('div');
              backdrop.id = 'site-modal-backdrop';
              backdrop.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.6);z-index:99992;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(8px);font-family:sans-serif;box-sizing:border-box;';
              backdrop.onclick = function(e) {
                if (e.target === backdrop) backdrop.remove();
              };

              var modal = document.createElement('div');
              modal.style.cssText = 'background:' + (cfg.modalBg || '#1e293b') + ';border-radius:16px;padding:32px;max-width:480px;width:100%;color:#f1f5f9;box-shadow:0 30px 80px rgba(0,0,0,0.6);position:relative;';

              var closeBtn = '<button id="close-modal-btn" style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.1);border:none;color:#f1f5f9;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;">✕</button>';
              var imgHtml = cfg.modalImage ? '<img src="' + cfg.modalImage + '" style="width:100%;border-radius:10px;margin-bottom:20px;max-height:200px;object-fit:cover;" />' : '';
              var titleHtml = '<h2 style="margin:0 0 12px;font-size:22px;font-weight:700;">' + (cfg.modalTitle || 'Special Announcement') + '</h2>';
              var bodyHtml = '<p style="margin:0 0 24px;font-size:15px;line-height:1.7;opacity:0.85;">' + (cfg.modalContent || 'Modal description content.') + '</p>';
              var actionBtn = '<button id="close-modal-action-btn" style="padding:11px 24px;background:#6366f1;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;">' + (cfg.modalCloseLabel || 'Close') + '</button>';

              modal.innerHTML = closeBtn + imgHtml + titleHtml + bodyHtml + actionBtn;
              backdrop.appendChild(modal);
              document.body.appendChild(backdrop);

              document.getElementById('close-modal-btn').onclick = function() { backdrop.remove(); };
              document.getElementById('close-modal-action-btn').onclick = function() { backdrop.remove(); };
            } catch(err) {}
          }

          function showSiteToast(cfgEncoded) {
            try {
              var cfg = JSON.parse(decodeURIComponent(cfgEncoded));
              var msg = cfg.toastMessage || 'Action completed successfully!';
              var pos = cfg.toastPosition || 'bottom-right';
              var style = cfg.toastStyle || 'info';
              var dur = cfg.toastDuration || 3000;
              var styleMap = {
                info: { bg: '#3b82f6', icon: 'ℹ️' },
                success: { bg: '#22c55e', icon: '✅' },
                error: { bg: '#ef4444', icon: '❌' },
                warning: { bg: '#f59e0b', icon: '⚠️' },
                dark: { bg: '#1e293b', icon: '🌑' }
              };
              var t = styleMap[style] || styleMap.info;
              var posStyle = {
                'top-left': 'top:24px;left:24px',
                'top-center': 'top:24px;left:50%;transform:translateX(-50%)',
                'top-right': 'top:24px;right:24px',
                'bottom-left': 'bottom:24px;left:24px',
                'bottom-center': 'bottom:24px;left:50%;transform:translateX(-50%)',
                'bottom-right': 'bottom:24px;right:24px'
              }[pos] || 'bottom:24px;right:24px';

              var div = document.createElement('div');
              div.style.cssText = 'position:fixed;' + posStyle + ';background:' + t.bg + ';color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:500;z-index:99999;display:flex;align-items:center;gap:10px;box-shadow:0 10px 40px rgba(0,0,0,0.4);max-width:380px;transition:all 0.3s;';
              div.innerHTML = '<span>' + t.icon + '</span><span>' + msg + '</span>';
              document.body.appendChild(div);
              setTimeout(function() {
                div.style.opacity = '0';
                setTimeout(function() { div.remove(); }, 300);
              }, dur);
            } catch(err) {}
          }

          function copySiteText(textEncoded) {
            try {
              var text = decodeURIComponent(textEncoded);
              navigator.clipboard.writeText(text).then(function() {
                var d = document.createElement('div');
                d.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#22c55e;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:99999;box-shadow:0 8px 30px rgba(0,0,0,0.3);';
                d.textContent = '✅ Copied to clipboard!';
                document.body.appendChild(d);
                setTimeout(function() { d.remove(); }, 2000);
              });
            } catch(err) {}
          }

          function fireSiteConfetti() {
            var colors = ['#6366f1','#ec4899','#f59e0b','#22c55e','#3b82f6','#a855f7','#ef4444'];
            for (var i = 0; i < 100; i++) {
              (function() {
                var p = document.createElement('div');
                var size = Math.random() * 10 + 5;
                p.style.cssText = 'position:fixed;top:-20px;left:' + (Math.random() * 100) + 'vw;width:' + size + 'px;height:' + size + 'px;background:' + colors[Math.floor(Math.random() * colors.length)] + ';border-radius:' + (Math.random() > 0.5 ? '50%' : '2px') + ';z-index:99999;pointer-events:none;animation:confetti-fall ' + (Math.random() * 2 + 1.5) + 's ease-in ' + (Math.random() * 1) + 's forwards;';
                document.body.appendChild(p);
                setTimeout(function() { p.remove(); }, 4000);
              })();
            }
            if (!document.getElementById('confetti-style-iframe')) {
              var s = document.createElement('style');
              s.id = 'confetti-style-iframe';
              s.textContent = '@keyframes confetti-fall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}';
              document.head.appendChild(s);
            }
          }

          function toggleSiteElement(targetId, behavior) {
            var target = document.querySelector('[data-element-id="' + targetId + '"]') || document.getElementById(targetId);
            if (target) {
              if (behavior === 'show') target.style.display = '';
              else if (behavior === 'hide') target.style.display = 'none';
              else target.style.display = target.style.display === 'none' ? '' : 'none';
            }
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
                headers: { 'Content-Type': 'application/json' },
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
                headers: { 'Content-Type': 'application/json' },
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
          document.addEventListener('DOMContentLoaded', () => {
            const observer = new IntersectionObserver((entries) => {
              entries.forEach(entry => {
                const el = entry.target;
                if (entry.isIntersecting) {
                  if (el.dataset.aosName && el.dataset.aosName !== 'none') {
                    el.style.animationName = el.dataset.aosName;
                    el.style.animationDuration = el.dataset.aosDuration;
                    el.style.animationDelay = el.dataset.aosDelay;
                    el.style.animationIterationCount = el.dataset.aosIteration;
                    el.style.animationFillMode = 'both';
                    if (el.style.opacity === '0') el.style.opacity = '';
                  }
                } else {
                  if (el.dataset.aosName && el.dataset.aosName !== 'none') {
                    el.style.animationName = 'none';
                    if (['fadeIn','fadeInUp','fadeInDown','fadeInLeft','fadeInRight','slideUp','slideDown','slideLeft','slideRight','zoomIn','zoomInUp','zoomInDown','flipInX','flipInY','rotateIn','rollIn','lightSpeedIn','jackInTheBox','expandIn','dropIn'].includes(el.dataset.aosName)) {
                      el.style.opacity = '0';
                    }
                  }
                }
              });
            }, { threshold: 0.1 });
            document.querySelectorAll('[data-aos-name]').forEach(el => observer.observe(el));
          });

          window.runSiteSearch = function(query) {
            const q = query.toLowerCase().trim();
            const elements = document.querySelectorAll('.searchable-site-element');
            elements.forEach(el => el.classList.remove('search-match'));
            if (!q) return;
            let firstMatch = null;

            for (let el of elements) {
              if (el.querySelector('input[oninput*="runSiteSearch"]')) {
                continue;
              }

              let isMatch = false;
              if (el.innerText && el.innerText.toLowerCase().includes(q)) isMatch = true;

              const img = el.querySelector('img');
              if (img && img.alt && img.alt.toLowerCase().includes(q)) isMatch = true;

              const input = el.querySelector('input, textarea');
              if (input) {
                const placeholder = input.getAttribute('placeholder') || '';
                const val = input.value || '';
                if (placeholder.toLowerCase().includes(q) || val.toLowerCase().includes(q)) {
                  isMatch = true;
                }
              }

              if (isMatch) {
                el.classList.add('search-match');
                if (!firstMatch) firstMatch = el;
              }
            }

            if (firstMatch) {
              firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });

              firstMatch.style.outline = '4px solid #818cf8';
              firstMatch.style.boxShadow = '0 0 20px rgba(99,102,241,0.6)';
              firstMatch.style.transition = 'outline 0.3s, box-shadow 0.3s';
              setTimeout(() => {
                firstMatch.style.outline = '';
                firstMatch.style.boxShadow = '';
              }, 1500);
            }
          };

          // Media Slider Interaction Logic (Supports Multiple Sliders & 0-indexed loop)
          (function() {
            window.sliderControllers = window.sliderControllers || {};
            
            const initSliders = () => {
              const containers = document.querySelectorAll('[id$="_container"][data-slider-config]');
              containers.forEach(container => {
                const baseId = container.id.replace('_container', '');
                
                if (window.sliderControllers[baseId] && window.sliderControllers[baseId].interval) {
                  clearInterval(window.sliderControllers[baseId].interval);
                }

                let sliderInfo;
                try {
                  const rawConfig = container.getAttribute('data-slider-config');
                  sliderInfo = JSON.parse(rawConfig);
                } catch (e) {
                  console.error("Failed to parse slider config", e);
                  return;
                }
                
                const totalSlides = sliderInfo.slides.length;
                let currentSlide = 0;
                let autoplayTimer = null;
                let isTransitioning = false;
                
                const getEl = (suffix) => document.getElementById(baseId + '_' + suffix);
                
                const updateSlides = (slideIndex, direction = 'forward') => {
                  if (isTransitioning) return;
                  isTransitioning = true;
                  
                  const transition = sliderInfo.transition || 'fade';
                  const duration = sliderInfo.transitionDuration || 0.5;
                  
                  const getExitTransform = (isForward) => {
                    switch(transition) {
                      case 'slideLeft': return isForward ? 'translateX(-100%)' : 'translateX(100%)';
                      case 'slideRight': return isForward ? 'translateX(100%)' : 'translateX(-100%)';
                      case 'zoom': return 'scale(0.8)';
                      case 'flip': return 'perspective(1000px) rotateY(90deg)';
                      default: return 'none';
                    }
                  };
                  
                  const getEntryTransform = (isForward) => {
                    switch(transition) {
                      case 'slideLeft': return isForward ? 'translateX(100%)' : 'translateX(-100%)';
                      case 'slideRight': return isForward ? 'translateX(-100%)' : 'translateX(100%)';
                      case 'zoom': return 'scale(0.8)';
                      case 'flip': return 'perspective(1000px) rotateY(-90deg)';
                      default: return 'none';
                    }
                  };
                  
                  const isForward = direction === 'forward';
                  
                  for (let i = 0; i < totalSlides; i++) {
                    const img = getEl('slide' + (i + 1) + '_img');
                    const text = getEl('slide' + (i + 1) + '_text');
                    
                    if (i === slideIndex) {
                      if (img) {
                        img.style.transition = 'none';
                        img.style.opacity = '1';
                        img.style.transform = getEntryTransform(isForward);
                        img.style.zIndex = '2';
                        img.offsetHeight;
                        img.style.transition = 'all ' + duration + 's ease-in-out';
                        img.style.transform = 'translateX(0) scale(1) rotateY(0deg)';
                      }
                      if (text) {
                        text.style.transition = 'opacity ' + duration + 's ease-in-out';
                        text.style.opacity = '1';
                      }
                    } else if (i === currentSlide) {
                      if (img) {
                        img.style.transition = 'all ' + duration + 's ease-in-out';
                        img.style.opacity = '0';
                        img.style.transform = getExitTransform(isForward);
                        img.style.zIndex = '1';
                      }
                      if (text) {
                        text.style.transition = 'opacity ' + duration + 's ease-in-out';
                        text.style.opacity = '0';
                      }
                    } else {
                      if (img) {
                        img.style.transition = 'none';
                        img.style.opacity = '0';
                        img.style.transform = 'none';
                        img.style.zIndex = '0';
                      }
                      if (text) {
                        text.style.transition = 'none';
                        text.style.opacity = '0';
                      }
                    }
                  }
                  
                  for (let i = 0; i < totalSlides; i++) {
                    const dot = getEl('dot' + (i + 1));
                    if (dot) {
                      dot.style.transition = 'all ' + duration + 's ease-in-out';
                      dot.style.backgroundColor = i === slideIndex ? '#6366f1' : 'rgba(255,255,255,0.4)';
                      dot.style.transform = i === slideIndex ? 'scale(1.3)' : 'scale(1)';
                      dot.style.boxShadow = i === slideIndex ? '0 0 10px rgba(99,102,241,0.8)' : 'none';
                    }
                  }
                  
                  currentSlide = slideIndex;
                  setTimeout(() => { isTransitioning = false; }, duration * 1000);
                };
                
                const leftArrow = getEl('arrow_left');
                const rightArrow = getEl('arrow_right');
                
                window.sliderControllers[baseId] = {
                  next: () => {
                    if (totalSlides <= 1) return;
                    const newSlide = currentSlide === totalSlides - 1 ? 0 : currentSlide + 1;
                    updateSlides(newSlide, 'forward');
                    resetAutoplay();
                  },
                  prev: () => {
                    if (totalSlides <= 1) return;
                    const newSlide = currentSlide === 0 ? totalSlides - 1 : currentSlide - 1;
                    updateSlides(newSlide, 'backward');
                    resetAutoplay();
                  }
                };
                
                if (leftArrow) {
                  leftArrow.onclick = (e) => {
                    e.stopPropagation();
                    window.sliderControllers[baseId].prev();
                  };
                }
                
                if (rightArrow) {
                  rightArrow.onclick = (e) => {
                    e.stopPropagation();
                    window.sliderControllers[baseId].next();
                  };
                }
                
                for (let i = 0; i < totalSlides; i++) {
                  const dot = getEl('dot' + (i + 1));
                  if (dot) {
                    dot.onclick = (e) => {
                      e.stopPropagation();
                      const direction = i > currentSlide ? 'forward' : 'backward';
                      updateSlides(i, direction);
                      resetAutoplay();
                    };
                  }
                }
                
                const startAutoplay = () => {
                  autoplayTimer = setInterval(() => {
                    window.sliderControllers[baseId].next();
                  }, sliderInfo.autoPlayInterval);
                  window.sliderControllers[baseId].interval = autoplayTimer;
                };
                
                const resetAutoplay = () => {
                  if (autoplayTimer) {
                    clearInterval(autoplayTimer);
                  }
                  startAutoplay();
                };
                
                const containerEl = getEl('container');
                if (containerEl) {
                  containerEl.onmouseenter = () => { if (autoplayTimer) clearInterval(autoplayTimer); };
                  containerEl.onmouseleave = () => { startAutoplay(); };
                }
                
                startAutoplay();
              });
            };
            
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', initSliders);
            } else {
              initSliders();
            }
          })();
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

  // Synchronizes global elements across all pages in the project, preserving section index & exact positions
  const syncGlobalElementsAcrossPages = (sourceLayout, sourcePageId, allPages) => {
    if (!sourceLayout || !sourcePageId || !allPages) return allPages;

    const globalMap = new Map();
    (sourceLayout || []).forEach((sec, secIdx) => {
      (sec.elements || []).forEach(el => {
        if (el.isGlobal) {
          globalMap.set(el.id, {
            element: JSON.parse(JSON.stringify(el)),
            secIdx: secIdx
          });
        }
      });
    });

    if (globalMap.size === 0) return allPages;

    let anyPageChanged = false;
    const nextPages = allPages.map(page => {
      if (page.id === sourcePageId) return page;

      let pageLayout = JSON.parse(JSON.stringify(page.layout || []));
      let pageModified = false;

      const existingGids = new Set();
      pageLayout.forEach(sec => {
        (sec.elements || []).forEach(el => {
          if (el.isGlobal) existingGids.add(el.id);
        });
      });

      // Update existing global elements on target page so position, size & properties match 100%
      pageLayout = pageLayout.map(sec => ({
        ...sec,
        elements: (sec.elements || []).map(el => {
          if (el.isGlobal && globalMap.has(el.id)) {
            pageModified = true;
            const sourceInfo = globalMap.get(el.id);
            return {
              ...sourceInfo.element
            };
          }
          return el;
        })
      }));

      // Insert any missing global elements into matching section index with exact coordinates
      globalMap.forEach((info, gid) => {
        if (!existingGids.has(gid)) {
          pageModified = true;
          if (pageLayout.length === 0) {
            pageLayout.push({
              id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
              settings: { backgroundColor: 'transparent', containerWidth: '1200px' },
              elements: []
            });
          }

          const targetSecIdx = Math.min(info.secIdx, pageLayout.length - 1);
          const targetSec = pageLayout[targetSecIdx] || pageLayout[0];
          targetSec.elements = targetSec.elements || [];
          targetSec.elements.push({ ...info.element });
        }
      });

      if (pageModified) {
        anyPageChanged = true;
        savePageLayout(pageLayout, page);
        return { ...page, layout: pageLayout };
      }
      return page;
    });

    return nextPages;
  };

  // ── Remove specific global elements from ALL other pages ────────────────────
  // Called when a global element is deleted or un-globalised on the current page.
  // This ensures the element is gone everywhere, not just the active page.
  const removeGlobalElementsFromOtherPages = (elementIdsToRemove) => {
    if (!elementIdsToRemove || elementIdsToRemove.length === 0) return;
    const idsSet = new Set(elementIdsToRemove);

    setPages(prevPages => {
      return prevPages.map(page => {
        if (page.id === activePage?.id) return page; // current page handled by caller

        let modified = false;
        const newLayout = (page.layout || []).map(sec => {
          const origLen = (sec.elements || []).length;
          const filtered = (sec.elements || []).filter(el => !idsSet.has(el.id));
          if (filtered.length !== origLen) modified = true;
          return { ...sec, elements: filtered };
        });

        if (modified) {
          savePageLayout(newLayout, page);
          return { ...page, layout: newLayout };
        }
        return page;
      });
    });
  };

  const updateLayout = (newLayout, pushToHistory = true) => {
    setActiveLayout(newLayout);
    if (pushToHistory) {
      const newHistory = history.slice(0, historyPointer + 1);
      newHistory.push(JSON.stringify(newLayout));
      setHistory(newHistory);
      setHistoryPointer(newHistory.length - 1);
    }
    
    // Sync local cache & active page
    setActivePage(prev => prev ? { ...prev, layout: newLayout } : prev);
    savePageLayout(newLayout, activePage);

    // Synchronize all global elements across all pages in the project
    if (activePage) {
      setPages(prevPages => {
        const updatedPages = prevPages.map(p => 
          p.id === activePage.id ? { ...p, layout: newLayout } : p
        );
        return syncGlobalElementsAcrossPages(newLayout, activePage.id, updatedPages);
      });
    }
  };

  const saveTimeout = useRef({});
  const savePageLayout = (layoutData, pageToSave = activePage) => {
    if (!pageToSave) return;
    setIsSaving(true);
    
    if (saveTimeout.current[pageToSave.id]) clearTimeout(saveTimeout.current[pageToSave.id]);
    
    saveTimeout.current[pageToSave.id] = setTimeout(async () => {
      try {
        const token = localStorage.getItem('access_token');
        const headers = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        await apiFetch(`http://127.0.0.1:8000/api/pages/${pageToSave.id}/`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({ 
            layout: layoutData,
            meta_description: pageToSave.meta_description || ''
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

  const findElementInLayout = (elementId) => {
    for (let sec of activeLayout) {
      const searchElements = (elements) => {
        for (let el of elements) {
          if (el.id === elementId) return { section: sec, element: el };
          if (el.type === 'group' && el.elements) {
            const found = searchElements(el.elements);
            if (found) return found;
          }
        }
        return null;
      };
      const found = searchElements(sec.elements || []);
      if (found) return found;
    }
    return null;
  };

  const getSelectedElement = () => {
    if (!selectedElementId) return null;
    const found = findElementInLayout(selectedElementId);
    return found ? found.element : null;
  };

  const selectedElement = getSelectedElement();

  const updateSelectedElement = (updates) => {
    // When un-globalising (isGlobal toggled OFF), remove the element from every
    // other page first so it becomes a purely local element on this page only.
    if (updates.isGlobal === false) {
      const idsToUnglobalize = [];
      selectedElementIds.forEach(id => {
        const found = findElementInLayout(id);
        if (found?.element?.isGlobal) {
          idsToUnglobalize.push(id);
        }
      });
      if (idsToUnglobalize.length > 0) {
        removeGlobalElementsFromOtherPages(idsToUnglobalize);
      }
    }

    const nextLayout = activeLayout.map(sec => ({
      ...sec,
      elements: (sec.elements || []).map(el => {
        if (selectedElementIds.includes(el.id)) {
          return {
            ...el,
            isGlobal: updates.isGlobal !== undefined ? updates.isGlobal : el.isGlobal,
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

  const renderLabelWithReset = (label, groupName, keyName) => {
    const hasValue = selectedElement && selectedElement[groupName] && selectedElement[groupName][keyName] !== undefined && selectedElement[groupName][keyName] !== '';
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <label style={{ margin: 0 }}>{label}</label>
        {hasValue && (
          <button 
            onClick={() => updateSelectedElement({ [groupName]: { [keyName]: undefined } })}
            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '2px' }}
            title={`Reset ${label}`}
          >
            <X size={10} /> Reset
          </button>
        )}
      </div>
    );
  };

  const updateSelectedPage = (updates) => {
    if (!activePage) return;
    setPages(prevPages => prevPages.map(p => 
      p.id === activePage.id ? { ...p, ...updates } : p
    ));
    setActivePage(prev => ({ ...prev, ...updates }));
  };

  const handleMoveElement = (elementId, direction) => {
    const found = findElementInLayout(elementId);
    if (!found) return;
    
    const { section, element } = found;
    const els = section.elements || [];
    const idx = els.findIndex(e => e.id === elementId);
    if (idx === -1) return;

    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= els.length) return;

    const newEls = [...els];
    [newEls[idx], newEls[newIdx]] = [newEls[newIdx], newEls[idx]];

    const nextLayout = activeLayout.map(sec => 
      sec.id === section.id ? { ...sec, elements: newEls } : sec
    );
    updateLayout(nextLayout);
  };

  const handleDuplicateElement = (elementId) => {
    const found = findElementInLayout(elementId);
    if (!found) return;
    
    const { section, element } = found;
    const clone = JSON.parse(JSON.stringify(element));
    clone.id = `el_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    clone.x = (clone.x || 0) + 20;
    clone.y = (clone.y || 0) + 20;

    const nextLayout = activeLayout.map(sec => {
      if (sec.id === section.id) {
        const idx = sec.elements.findIndex(e => e.id === elementId);
        const newEls = [...sec.elements];
        newEls.splice(idx + 1, 0, clone);
        return { ...sec, elements: newEls };
      }
      return sec;
    });
    updateLayout(nextLayout);
    setSelectedElementId(clone.id);
  };

  const handleDeleteElement = (elementId) => {
    // If the element is global, also remove it from every other page
    const found = findElementInLayout(elementId);
    if (found?.element?.isGlobal) {
      removeGlobalElementsFromOtherPages([elementId]);
    }

    const nextLayout = activeLayout.map(sec => ({
      ...sec,
      elements: (sec.elements || []).filter(el => el.id !== elementId)
    }));
    if (selectedElementId === elementId) setSelectedElementId(null);
    updateLayout(nextLayout);
  };

  const handleDeleteSelected = () => {
    if (selectedElementIds.length === 0) return;

    // Collect any global elements being deleted and remove from all other pages
    const globalIdsToDelete = [];
    selectedElementIds.forEach(id => {
      const found = findElementInLayout(id);
      if (found?.element?.isGlobal) {
        globalIdsToDelete.push(id);
      }
    });
    if (globalIdsToDelete.length > 0) {
      removeGlobalElementsFromOtherPages(globalIdsToDelete);
    }

    const nextLayout = activeLayout.map(sec => ({
      ...sec,
      elements: (sec.elements || []).filter(el => !selectedElementIds.includes(el.id))
    }));
    setSelectedElementIds([]);
    updateLayout(nextLayout);
  };

  const handleCopy = () => {
    if (selectedElementIds.length === 0) return;
    const elements = [];
    selectedElementIds.forEach(id => {
      const found = findElementInLayout(id);
      if (found) elements.push(found.element);
    });
    setClipboard(JSON.stringify(elements));
  };

  const handlePaste = () => {
    if (!clipboard) return;
    const elements = JSON.parse(clipboard);
    const newElements = elements.map(el => ({
      ...el,
      id: `el_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      x: (el.x || 0) + 20,
      y: (el.y || 0) + 20
    }));

    const nextLayout = activeLayout.map(sec => ({
      ...sec,
      elements: [...(sec.elements || []), ...newElements]
    }));
    updateLayout(nextLayout);
    setSelectedElementIds(newElements.map(el => el.id));
  };

  const handleSelectAll = () => {
    const allIds = [];
    activeLayout.forEach(sec => {
      (sec.elements || []).forEach(el => {
        allIds.push(el.id);
      });
    });
    setSelectedElementIds(allIds);
  };

  const handleGroupElements = () => {
    if (selectedElementIds.length < 2) return;
    const groupId = `group_${Date.now()}`;
    const nextLayout = activeLayout.map(sec => ({
      ...sec,
      elements: (sec.elements || []).map(el => {
        if (selectedElementIds.includes(el.id)) {
          return { ...el, groupId };
        }
        return el;
      })
    }));
    updateLayout(nextLayout);
  };

  const handleUngroupElements = () => {
    if (selectedElementIds.length === 0) return;
    const groupIdsToUngroup = new Set();
    selectedElementIds.forEach(id => {
      const el = findElementInLayout(id)?.element;
      if (el?.groupId) {
        groupIdsToUngroup.add(el.groupId);
      }
    });

    if (groupIdsToUngroup.size === 0) return;

    const nextLayout = activeLayout.map(sec => ({
      ...sec,
      elements: (sec.elements || []).map(el => {
        if (el.groupId && groupIdsToUngroup.has(el.groupId)) {
          const { groupId, ...rest } = el;
          return rest;
        }
        return el;
      })
    }));
    updateLayout(nextLayout);
  };

  const alignElements = (alignment) => {
    if (selectedElementIds.length === 0) return;
    
    const selectedElements = selectedElementIds.map(id => findElementInLayout(id)).filter(Boolean);
    if (selectedElements.length === 0) return;

    const nextLayout = [...activeLayout];
    
    selectedElements.forEach(({ section, element }) => {
      const secIdx = nextLayout.findIndex(s => s.id === section.id);
      if (secIdx === -1) return;
      
      const elIdx = nextLayout[secIdx].elements.findIndex(e => e.id === element.id);
      if (elIdx === -1) return;

      const updated = { ...nextLayout[secIdx].elements[elIdx] };
      
      switch(alignment) {
        case 'left':
          updated.x = 0;
          break;
        case 'center':
          updated.x = Math.max(0, (1200 - (updated.width || 100)) / 2);
          break;
        case 'right':
          updated.x = Math.max(0, 1200 - (updated.width || 100));
          break;
        case 'top':
          updated.y = 0;
          break;
        case 'middle':
          updated.y = Math.max(0, (800 - (updated.height || 50)) / 2);
          break;
        case 'bottom':
          updated.y = Math.max(0, 800 - (updated.height || 50));
          break;
      }
      
      nextLayout[secIdx] = {
        ...nextLayout[secIdx],
        elements: [...nextLayout[secIdx].elements.slice(0, elIdx), updated, ...nextLayout[secIdx].elements.slice(elIdx + 1)]
      };
    });
    
    updateLayout(nextLayout);
  };

  const handleAddElement = (type) => {
    let actualType = type;
    let shapeType = null;
    if (type.startsWith('shape-')) {
      actualType = 'shape';
      shapeType = type.replace('shape-', '');
    }

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
        content: { src: '', alt: 'Click to add image' },
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
      },
      shape: {
        type: 'shape',
        content: { shapeType: shapeType || 'rectangle' },
        width: 150,
        height: 150,
        styles: { backgroundColor: '#6366f1' }
      },
      link: {
        type: 'link',
        content: { text: 'Clickable Text Link', link: '#' },
        width: 150,
        height: 40,
        styles: { color: '#6366f1', textDecoration: 'underline', fontSize: '16' }
      },
      site_search: {
        type: 'site_search',
        content: { placeholder: 'Search...' },
        width: 300,
        height: 45,
        styles: { padding: '10 15', backgroundColor: '#1e293b', color: '#ffffff', borderRadius: '6', border: '1px solid #334155' }
      },
      image_slider: {
        type: 'image_slider',
        content: {
          slides: [
            { id: 'slide1', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80', caption: 'Slide 1 - Beautiful Landscape' },
            { id: 'slide2', image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80', caption: 'Slide 2 - Nature View' },
            { id: 'slide3', image: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80', caption: 'Slide 3 - Forest Path' }
          ],
          autoPlay: true,
          autoPlayInterval: 3000,
          showArrows: true,
          showDots: true,
          height: 400,
          transition: 'fade', // fade, slideLeft, slideRight, zoom, flip
          transitionDuration: 0.5
        },
        width: 800,
        height: 400,
        styles: { borderRadius: '8', marginBottom: '15' }
      }
    };

    const newEl = {
      id: `el_${Date.now()}`,
      ...defaultElements[actualType]
    };

    let nextLayout = [...activeLayout];
    if (nextLayout.length === 0) {
      nextLayout.push({
        id: `sec_${Date.now()}`,
        type: 'section',
        settings: { paddingTop: '120', paddingBottom: '120', containerWidth: '1200px', minHeight: '600px' },
        elements: []
      });
    }

    // Add to the last section, or first section
    const targetSec = nextLayout[nextLayout.length - 1];
    nextLayout = nextLayout.map(sec => {
      if (sec.id === targetSec.id) {
        return {
          ...sec,
          elements: [...(sec.elements || []), newEl]
        };
      }
      return sec;
    });

    updateLayout(nextLayout);
    setSelectedElementId(newEl.id);
  };

  const handleAddSmartComponent = (componentType) => {
    const smartComponent = getSmartComponent(componentType);
    if (!smartComponent) return;

    const generatedElements = smartComponent.generateElements(activeLayout[0]?.id, pages);
    
    let nextLayout = [...activeLayout];
    if (nextLayout.length === 0) {
      nextLayout.push({
        id: `sec_${Date.now()}`,
        type: 'section',
        settings: { ...smartComponent.defaultStyles, containerWidth: '1200px' },
        elements: []
      });
    }

    // Apply default section styles if provided
    if (smartComponent.defaultStyles && Object.keys(smartComponent.defaultStyles).length > 0) {
      const targetSec = nextLayout[nextLayout.length - 1];
      nextLayout = nextLayout.map(sec => {
        if (sec.id === targetSec.id) {
          return {
            ...sec,
            settings: { ...sec.settings, ...smartComponent.defaultStyles }
          };
        }
        return sec;
      });
    }

    // Add generated elements to the last section
    const targetSec = nextLayout[nextLayout.length - 1];
    nextLayout = nextLayout.map(sec => {
      if (sec.id === targetSec.id) {
        return {
          ...sec,
          elements: [...(sec.elements || []), ...generatedElements]
        };
      }
      return sec;
    });

    updateLayout(nextLayout);
    // Select the first element of the smart component
    if (generatedElements.length > 0) {
      setSelectedElementId(generatedElements[0].id);
    }
  };

  const handleDropElement = (e, sectionId) => {
    const type = e.dataTransfer.getData("elementType");
    if (!type) return;

    // Find the inner dropzone to get the correct coordinate origin (the 1200px container)
    const dropzone = e.currentTarget.querySelector('.builder-canvas-section-dropzone');
    const rect = dropzone ? dropzone.getBoundingClientRect() : e.currentTarget.getBoundingClientRect();
    
    // Calculate unscaled coordinates so items drop perfectly under the mouse even when zoomed
    const x = (e.clientX - rect.left) / canvasZoom;
    const y = (e.clientY - rect.top) / canvasZoom;

    // Handle Smart Components
    if (type.startsWith('smart-')) {
      const componentType = type.replace('smart-', '');
      const smartComponent = getSmartComponent(componentType);
      if (!smartComponent) return;

      let maxZ = 10;
      activeLayout.forEach(s => (s.elements||[]).forEach(e => {
        if (parseInt(e.styles?.zIndex||10) > maxZ) maxZ = parseInt(e.styles?.zIndex||10);
      }));
      const generatedElements = smartComponent.generateElements(sectionId, pages).map((el, i) => ({
        ...el,
        styles: { ...(el.styles || {}), zIndex: maxZ + 1 + i }
      }));
      
      // Apply section styles from smart component
      const nextLayout = activeLayout.map(sec => {
        if (sec.id === sectionId && smartComponent.defaultStyles) {
          return {
            ...sec,
            settings: { ...sec.settings, ...smartComponent.defaultStyles },
            elements: [...(sec.elements || []), ...generatedElements]
          };
        }
        if (sec.id === sectionId) {
          return {
            ...sec,
            elements: [...(sec.elements || []), ...generatedElements]
          };
        }
        return sec;
      });

      updateLayout(nextLayout);
      if (generatedElements.length > 0) {
        setSelectedElementId(generatedElements[0].id);
      }
      return;
    }

    // Handle regular elements
    let elementType = type;
    let shapeType = null;
    if (type.startsWith('shape-')) {
      elementType = 'shape';
      shapeType = type.replace('shape-', '');
    }

    const defaultElements = {
      heading: {
        type: 'heading',
        content: { tag: 'h2', text: 'New Heading Segment' },
        width: 400,
        styles: { fontSize: '32', color: '#ffffff', marginBottom: '15' }
      },
      text: {
        type: 'text',
        content: { text: 'Write your rich paragraph details here. Click style settings to configure background, padding, and size.' },
        width: 500,
        styles: { fontSize: '15', color: '#cbd5e1', marginBottom: '15', lineHeight: '1.6' }
      },
      button: {
        type: 'button',
        content: { text: 'Click Action', link: '#' },
        width: 150,
        styles: { backgroundColor: '#6366f1', color: '#ffffff', padding: '10 20', borderRadius: '6', fontWeight: 'bold' }
      },
      image: {
        type: 'image',
        content: { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80', alt: 'Visual Graphic' },
        width: 600,
        height: 400,
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
      },
      shape: {
        type: 'shape',
        content: { shapeType: shapeType || 'rectangle' },
        width: 150,
        height: 150,
        styles: { backgroundColor: '#6366f1' }
      },
      link: {
        type: 'link',
        content: { text: 'Clickable Text Link', link: '#' },
        width: 150,
        height: 40,
        styles: { color: '#6366f1', textDecoration: 'underline', fontSize: '16' }
      },
      site_search: {
        type: 'site_search',
        content: { placeholder: 'Search this site...' },
        width: 300,
        height: 45,
        styles: { padding: '10', borderRadius: '8', backgroundColor: 'rgba(0,0,0,0.05)', color: '#ffffff', borderStyle: 'solid', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.2)' }
      }
    };

    let maxZ = 10;
    activeLayout.forEach(s => (s.elements||[]).forEach(e => {
      if (parseInt(e.styles?.zIndex||10) > maxZ) maxZ = parseInt(e.styles?.zIndex||10);
    }));

    const elWidth = elementType === 'shape' ? 150 : elementType === 'link' ? 150 : defaultElements[elementType]?.width || 250;
    const elHeight = elementType === 'shape' ? 150 : elementType === 'link' ? 40 : defaultElements[elementType]?.height || 50;

    const newEl = {
      id: `el_${Date.now()}`,
      x: Math.max(0, x - (elWidth / 2)),
      y: Math.max(0, y - (elHeight / 2)),
      width: elWidth,
      height: elHeight,
      ...defaultElements[elementType],
      styles: {
        ...(defaultElements[elementType].styles || {}),
        zIndex: maxZ + 1
      }
    };

    const nextLayout = activeLayout.map(sec => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          elements: [...(sec.elements || []), newEl]
        };
      }
      return sec;
    });

    updateLayout(nextLayout);
    setSelectedElementId(newEl.id);
  };

  const handleAddSection = () => {
    const secId = `sec_${Date.now()}`;
    const newSection = {
      id: secId,
      type: 'section',
      settings: {
        paddingTop: '120',
        paddingBottom: '120',
        containerWidth: '1200px',
        useGlobalBackground: true,
        minHeight: '600px'
      },
      elements: []
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
      await apiFetch(`http://127.0.0.1:8000/api/sites/${siteId}/`, {
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
    
    // Collect all global elements from existing pages
    const globalElements = [];
    const globalElementIds = new Set();

    pages.forEach(page => {
      if (page.layout) {
        page.layout.forEach(sec => {
          if (sec.elements) {
            sec.elements.forEach(el => {
              if (el.isGlobal && !globalElementIds.has(el.id)) {
                globalElements.push({ ...el });
                globalElementIds.add(el.id);
              }
            });
          }
        });
      }
    });

    const defaultElement = {
      id: `el_init_${Date.now()}`,
      type: 'heading',
      content: { tag: 'h2', text: `Welcome to ${newPageTitle}` },
      styles: { fontSize: '32', color: site?.theme?.textColor || '#333333', marginBottom: '15' }
    };

    const initialElements = [defaultElement, ...globalElements];

    try {
      const token = localStorage.getItem('access_token'); 
      const res = await fetch('http://127.0.0.1:8000/api/pages/', {
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
              settings: { 
                paddingTop: '120', 
                paddingBottom: '120', 
                containerWidth: '1200px',
                useGlobalBackground: true,
                minHeight: '600px'
              },
              elements: initialElements
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
    // Before switching, forcefully trigger an immediate save for the current page if it has unsaved changes
    if (activePage && activeLayout && saveTimeout.current[activePage.id]) {
      clearTimeout(saveTimeout.current[activePage.id]);
      
      const token = localStorage.getItem('access_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      apiFetch(`http://127.0.0.1:8000/api/pages/${activePage.id}/`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ 
          layout: activeLayout,
          meta_description: activePage.meta_description || ''
        })
      }).catch(err => console.error('Immediate save failed:', err));
    }

    setActivePage(page);
    const migratedLayout = migrateLayout(page.layout || []);
    setActiveLayout(migratedLayout);
    setSelectedElementId(null);
    setSelectedElementIds([]);
    setHistory([JSON.stringify(migratedLayout)]);
    setHistoryPointer(0);
  };

  const handlePublishToggle = async (shouldPublish) => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await apiFetch(`http://127.0.0.1:8000/api/sites/${siteId}/`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ is_published: shouldPublish })
      });
      
      if (res.ok) {
        const updated = await res.json();
        setSite(updated);
        if (shouldPublish) {
          setShowPublishModal(true);
        }
      } else {
        if (res.status === 401) {
          alert('Session expired. Please log in again.');
          navigate('/');
        } else {
          alert('Failed to publish. Please try again.');
        }
      }
    } catch (err) {
      console.error('Failed to change publish status:', err);
      alert('An error occurred while publishing.');
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
    let css = '.builder-canvas-element.search-match { outline: 3px solid var(--primary) !important; outline-offset: 3px; box-shadow: 0 0 0 6px rgba(99,102,241,.18) !important; }';
    activeLayout.forEach(sec => {
      (sec.elements || []).forEach(el => {
        if (el.type === 'image') {
          const speed = el.styles?.imageHoverSpeed || '0.3';
          const scale = el.styles?.imageHoverScale || '1';
          const rotation = el.styles?.imageHoverRotate || '0';
          const hoverFilter = computeImageHoverFilter(el.styles);
          if (el.styles?.hoverOverlayEnabled || scale !== '1' || rotation !== '0' || hoverFilter !== computeImageFilter(el.styles)) {
            css += `
              [data-element-id="${el.id}"] .image-media { transition: filter ${speed}s ease, transform ${speed}s ease; }
              [data-element-id="${el.id}"]:hover .image-media { filter: ${hoverFilter}; transform: scale(${scale}) rotate(${rotation}deg); }
              [data-element-id="${el.id}"]:hover .img-hover-overlay { opacity: ${el.styles?.hoverOverlayOpacity ?? 1}; }
            `;
          }
        }
        if (el.hoverStyles && Object.keys(el.hoverStyles).some(k => el.hoverStyles[k] && el.hoverStyles[k] !== 'none')) {
          const speed = el.hoverStyles.transitionSpeed || '0.3';
          let hoverRules = '';
          if (el.hoverStyles.backgroundColor) hoverRules += `background-color: ${el.hoverStyles.backgroundColor} !important; `;
          if (el.hoverStyles.color) hoverRules += `color: ${el.hoverStyles.color} !important; `;
          if (el.hoverStyles.opacity && el.hoverStyles.opacity !== '') hoverRules += `opacity: ${el.hoverStyles.opacity} !important; `;
          if (el.hoverStyles.transform && el.hoverStyles.transform !== 'none') hoverRules += `transform: ${el.hoverStyles.transform} !important; `;
          if (el.hoverStyles.boxShadow) hoverRules += `box-shadow: ${el.hoverStyles.boxShadow} !important; `;
          if (el.hoverStyles.borderColor) hoverRules += `border-color: ${el.hoverStyles.borderColor} !important; `;
          
          if (hoverRules) {
            css += `
              [data-element-id="${el.id}"] .aos-element {
                transition: background-color ${speed}s ease-in-out, color ${speed}s ease-in-out, opacity ${speed}s ease-in-out, transform ${speed}s ease-in-out, box-shadow ${speed}s ease-in-out, border-color ${speed}s ease-in-out !important;
              }
              [data-element-id="${el.id}"] {
                cursor: pointer;
              }
              [data-element-id="${el.id}"]:hover .aos-element {
                ${hoverRules}
              }
              [data-element-id="${el.id}"]:hover .aos-element * {
                ${el.hoverStyles.color ? `color: ${el.hoverStyles.color} !important;` : ''}
              }
            `;
          }
        }
      });
    });
    return css;
  };

  const renderCanvasElement = (el, disableRnd = false) => {
    const isSelected = selectedElementIds.includes(el.id);
    const isFocused = focusedElementId === el.id && !isSelected;
    // Search dimming — canvas-level filter, no individual element code touched
    const isSearchDimmed = isSearchActive && !matchedElementIds.has(el.id);
    
    // Live frontend search filter
    // Site search is navigational: retain the full page and scroll/highlight matches.
    // Hiding everything but a match made it impossible to navigate back through a page.

    const styles = renderInlineStyles(el.styles);
    if (['heading', 'text', 'button'].includes(el.type)) {
      styles.whiteSpace = 'pre-wrap';
    }
    const isInlineEditing = inlineEditingId === el.id;

    const overlayControls = !isPreview && (
      <div className="element-overlay-controls">
        <button onClick={(e) => { e.stopPropagation(); handleMoveElement(el.id, 'up'); }} title="Move Up"><ArrowUp size={12} /></button>
        <button onClick={(e) => { e.stopPropagation(); handleMoveElement(el.id, 'down'); }} title="Move Down"><ArrowDown size={12} /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDuplicateElement(el.id); }} title="Duplicate"><Copy size={12} /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDeleteElement(el.id); }} style={{ color: '#ff4d4d' }} title="Delete"><Trash2 size={12} /></button>
      </div>
    );

    const executeElementAction = (targetEl) => {
      if (!targetEl || !targetEl.action || !targetEl.action.type || targetEl.action.type === 'none') return;
      const { type, value, subject, openInNewTab } = targetEl.action;

      if (type === 'drawer') {
        setActiveDrawerEl(targetEl);
      } else if (type === 'popup_modal') {
        setActiveModalEl(targetEl);
      } else if (type === 'form') {
        setActiveFormEl(targetEl);
      } else if (type === 'url') {
        if (value) {
          if (openInNewTab) window.open(value, '_blank');
          else window.location.href = value;
        }
      } else if (type === 'page') {
        const targetPage = pages.find(p => p.slug === value);
        if (targetPage) handleSwitchPage(targetPage);
      } else if (type === 'anchor') {
        const sectionEl = document.getElementById(value);
        if (sectionEl) sectionEl.scrollIntoView({ behavior: 'smooth' });
      } else if (type === 'email') {
        window.location.href = `mailto:${value || ''}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
      } else if (type === 'toast') {
        const msg = targetEl.action.toastMessage || 'Action completed successfully!';
        const pos = targetEl.action.toastPosition || 'bottom-right';
        const style = targetEl.action.toastStyle || 'info';
        const dur = targetEl.action.toastDuration || 3000;
        const styleMap = {
          info: { bg: '#3b82f6', icon: 'ℹ️' },
          success: { bg: '#22c55e', icon: '✅' },
          error: { bg: '#ef4444', icon: '❌' },
          warning: { bg: '#f59e0b', icon: '⚠️' },
          dark: { bg: '#1e293b', icon: '🌑' }
        };
        const t = styleMap[style] || styleMap.info;
        const posStyle = {
          'top-left': 'top:24px;left:24px',
          'top-center': 'top:24px;left:50%;transform:translateX(-50%)',
          'top-right': 'top:24px;right:24px',
          'bottom-left': 'bottom:24px;left:24px',
          'bottom-center': 'bottom:24px;left:50%;transform:translateX(-50%)',
          'bottom-right': 'bottom:24px;right:24px'
        }[pos] || 'bottom:24px;right:24px';
        const div = document.createElement('div');
        div.style.cssText = `position:fixed;${posStyle};background:${t.bg};color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:500;z-index:99999;display:flex;align-items:center;gap:10px;box-shadow:0 10px 40px rgba(0,0,0,0.4);max-width:380px;transition:all 0.3s;pointer-events:auto;`;
        div.innerHTML = `<span>${t.icon}</span><span>${msg}</span>`;
        document.body.appendChild(div);
        setTimeout(() => { div.style.opacity = '0'; setTimeout(() => div.remove(), 300); }, dur);
      } else if (type === 'copy_text') {
        navigator.clipboard.writeText(targetEl.action.copyText || '').then(() => {
          const d = document.createElement('div');
          d.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#22c55e;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:99999;box-shadow:0 8px 30px rgba(0,0,0,0.3);';
          d.textContent = '✅ Copied to clipboard!';
          document.body.appendChild(d);
          setTimeout(() => d.remove(), 2000);
        });
      } else if (type === 'scroll_top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (type === 'toggle_theme') {
        document.documentElement.classList.toggle('dark-mode');
      } else if (type === 'confetti') {
        const colors = ['#6366f1','#ec4899','#f59e0b','#22c55e','#3b82f6','#a855f7','#ef4444'];
        for (let i = 0; i < 100; i++) {
          const p = document.createElement('div');
          const size = Math.random() * 10 + 5;
          p.style.cssText = `position:fixed;top:-20px;left:${Math.random()*100}vw;width:${size}px;height:${size}px;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:${Math.random()>0.5?'50%':'2px'};z-index:99999;pointer-events:none;`;
          p.style.animation = `confetti-fall ${Math.random()*2+1.5}s ease-in ${Math.random()*1}s forwards`;
          document.body.appendChild(p);
          setTimeout(() => p.remove(), 4000);
        }
      } else if (type === 'toggle_element') {
        const target = document.querySelector(`[data-element-id="${targetEl.action.toggleTargetId}"]`) || document.getElementById(targetEl.action.toggleTargetId);
        if (target) {
          const beh = targetEl.action.toggleBehavior || 'toggle';
          if (beh === 'show') target.style.display = '';
          else if (beh === 'hide') target.style.display = 'none';
          else target.style.display = target.style.display === 'none' ? '' : 'none';
        }
      }
    };

    const handleElClick = (e) => {
      if (isPreview) {
        if (el.action && el.action.type && el.action.type !== 'none') {
          e.stopPropagation();
          executeElementAction(el);
          return;
        }
      }
      handleElementClick(e, el.id);
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



    const getWrappedContent = (content) => {
      if (!isPreview || !el.action || el.action.type === 'none') {
        return content;
      }
      return (
        <div
          onClick={(e) => {
            e.stopPropagation();
            executeElementAction(el);
          }}
          style={{ cursor: 'pointer', width: '100%', height: '100%' }}
        >
          {content}
        </div>
      );
    };

    const wrapWithRnd = (elementInnerContent, inlineStyles = {}) => {
      // Merge search-dim opacity at the canvas level (no individual element touched)
      const searchDimStyle = isSearchDimmed
        ? { opacity: 0.2, filter: 'grayscale(60%)', transition: 'opacity 0.2s, filter 0.2s', pointerEvents: 'none' }
        : isSearchActive
          ? { transition: 'opacity 0.2s, filter 0.2s' }
          : {};
      inlineStyles = { ...inlineStyles, ...searchDimStyle };
      const handleStyle = isSelected && !isPreview ? { width: '10px', height: '10px', background: '#fff', border: '1px solid #6366f1', borderRadius: '2px', zIndex: 100 } : { display: 'none' };
      
      if (disableRnd) {
        return (
          <div 
            key={`${el.id}_${isPreview}`} 
            style={{ 
              position: 'absolute', 
              top: el.y, 
              left: el.x, 
              width: el.width || '100%', 
              height: el.height || 'auto', 
              zIndex: el.styles?.zIndex || 10,
              ...inlineStyles
            }}
          >
            {elementInnerContent}
          </div>
        );
      }

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
          scale={canvasZoom}
          dragGrid={snapToGrid > 0 ? [snapToGrid, snapToGrid] : [1,1]}
          resizeGrid={snapToGrid > 0 ? [snapToGrid, snapToGrid] : [1,1]}
          cancel=".element-overlay-controls"
          resizeHandleStyles={{
            bottomRight: { ...handleStyle, right: '-5px', bottom: '-5px', cursor: 'nwse-resize' },
            bottomLeft: { ...handleStyle, left: '-5px', bottom: '-5px', cursor: 'nesw-resize' },
            topRight: { ...handleStyle, right: '-5px', top: '-5px', cursor: 'nesw-resize' },
            topLeft: { ...handleStyle, left: '-5px', top: '-5px', cursor: 'nwse-resize' },
            left: { ...handleStyle, left: '-5px', top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' },
            right: { ...handleStyle, right: '-5px', top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' },
            top: { ...handleStyle, top: '-5px', left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
            bottom: { ...handleStyle, bottom: '-5px', left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
          }}
          onDragStart={(e, d) => {
            if (selectedElementIds.includes(el.id)) {
              const positions = {};
              selectedElementIds.forEach(id => {
                const found = findElementInLayout(id);
                if (found) {
                  positions[id] = { x: found.element.x || 0, y: found.element.y || 0 };
                }
              });
              dragStartPositions.current = positions;
            } else {
              dragStartPositions.current = { [el.id]: { x: el.x || 0, y: el.y || 0 } };
            }
          }}
          onDrag={(e, d) => {
            const startPos = dragStartPositions.current[el.id];
            if (!startPos) return;
            
            let finalDeltaX = d.x - startPos.x;
            let finalDeltaY = d.y - startPos.y;

            if (selectedElementIds.length <= 1 && !e.altKey) {
              const snapResult = calculateSmartAlignment(el.id, startPos.x + finalDeltaX, startPos.y + finalDeltaY, el.width || 100, el.height || 50);
              if (snapResult.guides.length > 0) {
                finalDeltaX = snapResult.x - startPos.x;
                finalDeltaY = snapResult.y - startPos.y;
              }
              setAlignmentGuides(snapResult.guides);
            } else {
              setAlignmentGuides([]);
            }

            setActiveLayout(prevLayout => prevLayout.map(sec => ({
              ...sec,
              elements: (sec.elements || []).map(element => {
                const elStart = dragStartPositions.current[element.id];
                if (elStart) {
                  return {
                    ...element,
                    x: elStart.x + finalDeltaX,
                    y: elStart.y + finalDeltaY
                  };
                }
                return element;
              })
            })));
          }}
          onDragStop={(e, d) => {
            setAlignmentGuides([]);
            const startPos = dragStartPositions.current[el.id];
            if (!startPos) return;
            let deltaX = d.x - startPos.x;
            let deltaY = d.y - startPos.y;

            if (selectedElementIds.length <= 1 && !e.altKey) {
              const snapResult = calculateSmartAlignment(el.id, startPos.x + deltaX, startPos.y + deltaY, el.width || 100, el.height || 50);
              if (snapResult.guides.length > 0) {
                deltaX = snapResult.x - startPos.x;
                deltaY = snapResult.y - startPos.y;
              }
            }

            if (snapToGrid > 0) {
              deltaX = Math.round(deltaX / snapToGrid) * snapToGrid;
              deltaY = Math.round(deltaY / snapToGrid) * snapToGrid;
            }

            setActiveLayout(prevLayout => {
              const nextLayout = prevLayout.map(sec => ({
                ...sec,
                elements: (sec.elements || []).map(element => {
                  const elStart = dragStartPositions.current[element.id];
                  if (elStart) {
                    return {
                      ...element,
                      x: elStart.x + deltaX,
                      y: elStart.y + deltaY
                    };
                  }
                  return element;
                })
              }));
              setTimeout(() => updateLayout(nextLayout), 0);
              return nextLayout;
            });
            dragStartPositions.current = {};
          }}
          onResizeStop={(e, direction, ref, delta, position) => {
            let nw = parseInt(ref.style.width), nh = parseInt(ref.style.height);
            let nx = position.x, ny = position.y;
            if (snapToGrid > 0) {
              nw = Math.round(nw / snapToGrid) * snapToGrid;
              nh = Math.round(nh / snapToGrid) * snapToGrid;
              nx = Math.round(nx / snapToGrid) * snapToGrid;
              ny = Math.round(ny / snapToGrid) * snapToGrid;
            }
            setActiveLayout(prevLayout => {
              const nextLayout = prevLayout.map(sec => ({
                ...sec,
                elements: (sec.elements || []).map(element => {
                  if (element.id === el.id) {
                    return { ...element, width: nw, height: nh, x: nx, y: ny };
                  }
                  return element;
                })
              }));
              setTimeout(() => updateLayout(nextLayout), 0);
              return nextLayout;
            });
          }}
          onClick={handleElClick}
          onDoubleClick={handleElDoubleClick}
          onContextMenu={(e) => {
            if (isPreview) return;
            e.preventDefault();
            e.stopPropagation();
            setSelectedElementId(el.id);
            setContextMenu({ x: e.clientX, y: e.clientY, elementId: el.id });
          }}
          className={`builder-canvas-element ${isSelected && !isPreview ? 'selected' : ''} ${isFocused && !isPreview ? 'focused' : ''}`}
          data-element-id={el.id}
          style={{
            position: 'absolute',
            display: 'inline-block',
            zIndex: el.styles?.zIndex || 10,
            outline: isSelected && !isPreview ? '2px dashed rgba(99, 102, 241, 0.5)' : isFocused && !isPreview ? '2px solid rgba(99, 102, 241, 0.8)' : 'none',
            outlineOffset: '2px',
            ...inlineStyles
          }}
        >
          {overlayControls}
          <div
            key={el.animation?.type + '_' + el.animation?.duration + '_' + el.animation?.delay}
            className="aos-element"
            data-aos-name={el.animation?.type && el.animation.type !== 'none' ? el.animation.type : ''}
            data-aos-duration={el.animation ? `${el.animation.duration || 1}s` : ''}
            data-aos-delay={el.animation ? `${el.animation.delay || 0}s` : ''}
            data-aos-iteration={el.animation ? el.animation.iteration || '1' : ''}
            style={{ 
              width: '100%', 
              height: '100%',
              opacity: el.animation && ['fadeIn','fadeInUp','fadeInDown','fadeInLeft','fadeInRight','slideUp','slideDown','slideLeft','slideRight','zoomIn','zoomInUp','zoomInDown','flipInX','flipInY','rotateIn','rollIn','lightSpeedIn','jackInTheBox','expandIn','dropIn'].includes(el.animation.type) ? 0 : 1
            }}
          >
            {getWrappedContent(elementInnerContent)}
          </div>
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
      const imgFilter = computeImageFilter(el.styles);
      const fit = el.styles?.objectFit || 'cover';
      const pos = el.styles?.objectPosition || 'center';
      const hasOverlay = el.styles?.hoverOverlayEnabled;
      const overlayColor = el.styles?.hoverOverlayColor || 'rgba(0,0,0,0.6)';
      const overlayTextColor = el.styles?.hoverOverlayTextColor || '#ffffff';
      const overlayCoverage = el.styles?.hoverOverlayCoverage || 'full';
      const overlayText = el.styles?.hoverOverlayText || '';
      const overlayIcon = el.styles?.hoverOverlayIcon || 'none';
      const alphaMask = getImageAlphaMask(el.content?.src, el.styles);

      let overlayStyle = {
        position: 'absolute',
        left: 0, top: 0, width: '100%', height: '100%',
        backgroundColor: overlayColor,
        color: overlayTextColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '6px',
        opacity: 0,
        transition: 'opacity 0.3s ease-in-out',
        pointerEvents: 'none',
        boxSizing: 'border-box',
        padding: '12px',
        textAlign: 'center',
        fontSize: '13px',
        fontWeight: '600',
        zIndex: 2,
        borderRadius: 'inherit',
        ...alphaMask
      };

      if (overlayCoverage === 'top-half') { overlayStyle.height = '50%'; }
      else if (overlayCoverage === 'bottom-half') { overlayStyle.top = '50%'; overlayStyle.height = '50%'; }
      else if (overlayCoverage === 'left-half') { overlayStyle.width = '50%'; }
      else if (overlayCoverage === 'right-half') { overlayStyle.left = '50%'; overlayStyle.width = '50%'; }
      else if (overlayCoverage === 'gradient-bottom') {
        overlayStyle.backgroundColor = 'transparent';
        overlayStyle.background = `linear-gradient(to top, ${overlayColor}, transparent)`;
        overlayStyle.top = '40%'; overlayStyle.height = '60%';
        overlayStyle.alignItems = 'flex-end';
        overlayStyle.justifyContent = 'flex-end';
        overlayStyle.paddingBottom = '15px';
      }

      return wrapWithRnd(
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: styles.borderRadius || 'inherit' }}>
          <img
            className="image-media"
            src={el.content?.src || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80'}
            alt={el.content?.alt || 'Graphic'}
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              objectFit: fit,
              objectPosition: pos,
              filter: imgFilter,
              transition: 'filter 0.3s ease, transform 0.3s ease',
              ...styles
            }}
          />
          {hasOverlay && (
            <div className="img-hover-overlay" style={overlayStyle}>
              {overlayIcon === 'zoom-in' && <Maximize2 size={18} />}
              {overlayIcon === 'link' && <Link2 size={18} />}
              {overlayIcon === 'eye' && <Eye size={18} />}
              {overlayIcon === 'heart' && <Heart size={18} />}
              {overlayIcon === 'info' && <Info size={18} />}
              {overlayText && <span>{overlayText}</span>}
            </div>
          )}
        </div>
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

    if (el.type === 'site_search') {
      return wrapWithRnd(
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%', position: 'relative', ...styles }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', color: 'inherit', opacity: 0.7 }} />
          <input 
            type="text" 
            placeholder={el.content?.placeholder || 'Search this site...'} 
            disabled={!isPreview}
            value={isPreview ? liveSearchQuery : undefined}
            onChange={(e) => {
              const query = e.target.value;
              if (isPreview) {
                setLiveSearchQuery(query);
                const q = query.toLowerCase().trim();
                const nodes = [...document.querySelectorAll('.builder-canvas-element')];
                let firstMatch = null;
                nodes.forEach(node => {
                  node.classList.remove('search-match');
                  if (!q || node.querySelector('input[type="text"]')) return;
                  const imageAlt = node.querySelector('img')?.alt || '';
                  const searchableText = `${node.innerText || ''} ${imageAlt} ${node.dataset.elementId || ''}`.toLowerCase();
                  if (searchableText.includes(q)) {
                    node.classList.add('search-match');
                    if (!firstMatch) firstMatch = node;
                  }
                });
                if (firstMatch) firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
              }
            }}
            style={{ 
              padding: '10px 12px 10px 35px', 
              width: '100%',
              height: '100%',
              borderRadius: 'inherit', 
              border: 'none', 
              background: 'transparent', 
              color: 'inherit',
              fontSize: '14px',
              outline: 'none',
              pointerEvents: isPreview ? 'auto' : 'none'
            }} 
          />
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
              fontSize: '14px',
              outline: 'none',
              pointerEvents: isPreview ? 'auto' : 'none'
            }} 
          />
        </div>
      );
    }

    if (el.type === 'shape') {
      const shapeType = el.content?.shapeType || 'rectangle';
      const fillType = el.content?.fillType || 'filled';
      const strokeWidth = el.content?.borderWidth || 4;
      
      const bgColor = styles.backgroundColor || styles.color || el.styles?.backgroundColor || el.styles?.color || '#6366f1';
      const isBorder = fillType === 'border';
      const fill = isBorder ? 'transparent' : bgColor;
      const stroke = isBorder ? bgColor : 'none';
      
      const svgProps = {
        width: '100%', height: '100%',
        viewBox: '0 0 100 100',
        preserveAspectRatio: 'none',
        style: { overflow: 'visible', filter: styles.boxShadow ? `drop-shadow(${styles.boxShadow})` : 'none' }
      };

      const pathProps = {
        fill,
        stroke,
        strokeWidth: isBorder ? strokeWidth : 0,
        vectorEffect: 'non-scaling-stroke'
      };

      let shapeElement;
      switch (shapeType) {
        case 'circle':
          shapeElement = <ellipse cx="50" cy="50" rx="50" ry="50" {...pathProps} />;
          break;
        case 'triangle':
          shapeElement = <polygon points="50,0 100,100 0,100" {...pathProps} />;
          break;
        case 'pentagon':
          shapeElement = <polygon points="50,0 100,38 82,100 18,100 0,38" {...pathProps} />;
          break;
        case 'hexagon':
          shapeElement = <polygon points="25,0 75,0 100,50 75,100 25,100 0,50" {...pathProps} />;
          break;
        case 'octagon':
          shapeElement = <polygon points="30,0 70,0 100,30 100,70 70,100 30,100 0,70 0,30" {...pathProps} />;
          break;
        case 'star':
          shapeElement = <polygon points="50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35" {...pathProps} />;
          break;
        case 'diamond':
          shapeElement = <polygon points="50,0 100,50 50,100 0,50" {...pathProps} />;
          break;
        case 'rectangle':
        default:
          shapeElement = <rect x="0" y="0" width="100" height="100" {...pathProps} />;
          break;
      }

      // Remove properties from styles that are handled by SVG
      const cleanStyles = { ...styles };
      delete cleanStyles.backgroundColor;
      delete cleanStyles.boxShadow;
      delete cleanStyles.borderRadius;

      return wrapWithRnd(
        <div style={{ width: '100%', height: '100%', ...cleanStyles }}>
          <svg {...svgProps}>
            {shapeElement}
          </svg>
        </div>
      );
    }

    if (el.type === 'link') {
      return wrapWithRnd(
        <a 
          href={el.content?.link || '#'} 
          onClick={(e) => { e.preventDefault(); }} 
          style={{ 
            display: 'inline-block', 
            width: '100%', 
            height: '100%', 
            color: 'inherit', 
            textDecoration: 'inherit',
            ...styles 
          }}
        >
          {el.content?.text || 'Link'}
        </a>
      );
    }

    if (el.type === 'image_slider') {
      const slides = el.content?.slides || [];
      const showArrows = el.content?.showArrows !== false;
      const showDots = el.content?.showDots !== false;
      const sliderHeight = el.content?.height || el.height || 400;
      const transition = el.content?.transition || 'fade';
      const transitionDuration = el.content?.transitionDuration || 0.5;
      const baseId = `slider_${el.id}`;
      
      // Store slider data globally for the interaction script
      if (!window.sliderData) window.sliderData = {};
      window.sliderData[baseId] = {
        slides,
        autoPlayInterval: el.content?.autoPlayInterval || 3000,
        totalSlides: slides.length,
        transition,
        transitionDuration
      };

      // Get transition CSS based on type
      const getTransitionStyle = (index, isActive) => {
        const duration = `${transitionDuration}s`;
        const baseTransition = `all ${duration} ease-in-out`;
        
        if (!isActive) {
          // Hidden slides
          switch(transition) {
            case 'fade':
              return { opacity: 0, transition: baseTransition };
            case 'slideLeft':
              return { opacity: 0, transform: 'translateX(100%)', transition: baseTransition };
            case 'slideRight':
              return { opacity: 0, transform: 'translateX(-100%)', transition: baseTransition };
            case 'zoom':
              return { opacity: 0, transform: 'scale(0.8)', transition: baseTransition };
            case 'flip':
              return { opacity: 0, transform: 'perspective(1000px) rotateY(90deg)', transition: baseTransition };
            default:
              return { opacity: 0, transition: baseTransition };
          }
        } else {
          // Active slide
          switch(transition) {
            case 'fade':
              return { opacity: 1, transition: baseTransition };
            case 'slideLeft':
              return { opacity: 1, transform: 'translateX(0)', transition: baseTransition };
            case 'slideRight':
              return { opacity: 1, transform: 'translateX(0)', transition: baseTransition };
            case 'zoom':
              return { opacity: 1, transform: 'scale(1)', transition: baseTransition };
            case 'flip':
              return { opacity: 1, transform: 'perspective(1000px) rotateY(0deg)', transition: baseTransition };
            default:
              return { opacity: 1, transition: baseTransition };
          }
        }
      };

      return wrapWithRnd(
        <div 
          id={`${baseId}_container`}
          style={{ 
            width: '100%', 
            height: `${sliderHeight}px`, 
            position: 'relative', 
            overflow: 'hidden', 
            borderRadius: 'inherit',
            ...styles 
          }}
        >
          {/* Slides */}
          {slides.map((slide, idx) => (
            <div
              key={slide.id || idx}
              id={`${baseId}_slide${idx + 1}_img`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                ...getTransitionStyle(idx, idx === 0),
                zIndex: 1,
              }}
            >
              <img 
                src={slide.image} 
                alt={slide.caption || `Slide ${idx + 1}`}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  display: 'block',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
                draggable={false}
              />
            </div>
          ))}

          {/* Caption overlay */}
          {slides[0]?.caption && (
            <div
              id={`${baseId}_slide1_text`}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '20px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                color: '#fff',
                fontSize: '14px',
                zIndex: 2,
                opacity: 1,
                transition: `opacity ${transitionDuration}s ease-in-out`,
              }}
            >
              {slides[0].caption}
            </div>
          )}

          {/* Navigation Arrows - Enhanced with better visibility */}
          {showArrows && slides.length > 1 && (
            <>
              <button
                id={`${baseId}_arrow_left`}
                type="button"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(10px)',
                  color: '#fff',
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  width: '44px',
                  height: '44px',
                  cursor: 'pointer',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99,102,241,0.9)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                }}
              >
                ‹
              </button>
              <button
                id={`${baseId}_arrow_right`}
                type="button"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(10px)',
                  color: '#fff',
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  width: '44px',
                  height: '44px',
                  cursor: 'pointer',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99,102,241,0.9)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                }}
              >
                ›
              </button>
            </>
          )}

          {/* Dots - Enhanced with better styling */}
          {showDots && slides.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: slides[0]?.caption ? '50px' : '15px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '10px',
                zIndex: 10,
                padding: '8px 12px',
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  id={`${baseId}_dot${idx + 1}`}
                  type="button"
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    border: 'none',
                    background: idx === 0 ? '#6366f1' : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    transform: idx === 0 ? 'scale(1.3)' : 'scale(1)',
                    transition: 'all 0.3s ease',
                    padding: 0,
                    boxShadow: idx === 0 ? '0 0 10px rgba(99,102,241,0.8)' : 'none',
                  }}
                />
              ))}
            </div>
          )}
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
    return '1280px';
  };

  const getPreviewWidth = () => {
    if (viewMode === 'mobile') return '375px';
    if (viewMode === 'tablet') return '768px';
    return '1280px';
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
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '3px', borderRadius: 'var(--radius-sm)', gap: '2px' }}>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
          {!isPreview && (
            <>
              {/* Page Navigation Switcher */}
              <div style={{ display: 'flex', gap: '2px', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '4px' }}>
                <button 
                  onClick={() => {
                    const currentIdx = pages.findIndex(p => p.id === activePage?.id);
                    if (currentIdx > 0) {
                      handleSwitchPage(pages[currentIdx - 1]);
                    }
                  }}
                  disabled={pages.length <= 1 || pages.findIndex(p => p.id === activePage?.id) === 0}
                  className="btn-secondary"
                  style={{ 
                    padding: '6px 10px', 
                    opacity: pages.length <= 1 || pages.findIndex(p => p.id === activePage?.id) === 0 ? 0.4 : 1 
                  }}
                  title="Previous Page"
                >
                  <ChevronLeft size={14} />
                </button>
                <button 
                  onClick={() => {
                    const currentIdx = pages.findIndex(p => p.id === activePage?.id);
                    if (currentIdx < pages.length - 1) {
                      handleSwitchPage(pages[currentIdx + 1]);
                    }
                  }}
                  disabled={pages.length <= 1 || pages.findIndex(p => p.id === activePage?.id) === pages.length - 1}
                  className="btn-secondary"
                  style={{ 
                    padding: '6px 10px', 
                    opacity: pages.length <= 1 || pages.findIndex(p => p.id === activePage?.id) === pages.length - 1 ? 0.4 : 1 
                  }}
                  title="Next Page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Page Dropdown Switcher */}
              {pages.length > 2 && (
                <select
                  value={activePage?.id || ''}
                  onChange={(e) => {
                    const page = pages.find(p => p.id === parseInt(e.target.value));
                    if (page) handleSwitchPage(page);
                  }}
                  style={{
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    outline: 'none',
                    maxWidth: '150px'
                  }}
                  title="Quick Page Switch"
                >
                  {pages.map(p => (
                    <option key={p.id} value={p.id} style={{ background: '#1e293b' }}>
                      {p.title} (/{p.slug})
                    </option>
                  ))}
                </select>
              )}

              {/* History Controls */}
              <div style={{ display: 'flex', gap: '2px', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '4px' }}>
                <button onClick={handleUndo} disabled={historyPointer <= 0} className="btn-secondary" style={{ padding: '6px 10px', opacity: historyPointer <= 0 ? 0.4 : 1 }} title="Undo">
                  <RefreshCw size={14} style={{ transform: 'scaleX(-1)' }} />
                </button>
                <button onClick={handleRedo} disabled={historyPointer >= history.length - 1} className="btn-secondary" style={{ padding: '6px 10px', opacity: historyPointer >= history.length - 1 ? 0.4 : 1 }} title="Redo">
                  <RefreshCw size={14} />
                </button>
              </div>

              {/* Zoom Controls */}
              <div style={{ display: 'flex', gap: '2px', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '4px' }}>
                <button 
                  onClick={() => setCanvasZoom(z => Math.max(z - 0.1, 0.2))} 
                  className="btn-secondary" style={{ padding: '6px 10px', fontSize: '14px', lineHeight: 1 }} title="Zoom Out"
                >-</button>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '11px', fontWeight: 'bold', width: '45px', justifyContent: 'center', color: '#fff' }}>
                  {Math.round(canvasZoom * 100)}%
                </div>
                <button 
                  onClick={() => setCanvasZoom(z => Math.min(z + 0.1, 3))} 
                  className="btn-secondary" style={{ padding: '6px 10px', fontSize: '14px', lineHeight: 1 }} title="Zoom In"
                >+</button>
              </div>

              {/* Grid & Snap Controls */}
              <div style={{ display: 'flex', gap: '2px', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 6px' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', whiteSpace: 'nowrap' }}>⊞ Snap:</span>
                  <select
                    value={snapToGrid}
                    onChange={(e) => setSnapToGrid(parseInt(e.target.value))}
                    style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '10px', cursor: 'pointer', outline: 'none', padding: '2px' }}
                  >
                    <option value={0} style={{ background: '#1e293b' }}>Off</option>
                    <option value={5} style={{ background: '#1e293b' }}>5px</option>
                    <option value={10} style={{ background: '#1e293b' }}>10px</option>
                    <option value={20} style={{ background: '#1e293b' }}>20px</option>
                  </select>
                </div>
                <button 
                  onClick={() => setShowGridGuides(!showGridGuides)} 
                  className="btn-secondary" 
                  style={{ 
                    padding: '6px 8px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '3px',
                    background: showGridGuides ? 'var(--primary)' : 'transparent',
                    fontSize: '10px'
                  }} 
                  title="Toggle Grid Alignment Guides"
                >
                  🌐
                </button>
              </div>

              {/* Selection Tools */}
              {selectedElementIds.length > 0 && (
                <div style={{ display: 'flex', gap: '2px', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '4px' }}>
                  {selectedElementIds.length > 1 && (
                    <button onClick={handleGroupElements} className="btn-secondary" style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: '3px' }} title="Group Selected">
                      <Group size={13} />
                    </button>
                  )}
                  {(() => {
                    const hasGrouped = selectedElementIds.some(id => findElementInLayout(id)?.element?.groupId);
                    return hasGrouped ? (
                      <button onClick={handleUngroupElements} className="btn-secondary" style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: '3px' }} title="Ungroup Selected">
                        <Ungroup size={13} />
                      </button>
                    ) : null;
                  })()}
                  <button onClick={handleCopy} className="btn-secondary" style={{ padding: '6px 8px' }} title="Copy">
                    <ClipboardCopy size={13} />
                  </button>
                  <button onClick={handlePaste} className="btn-secondary" style={{ padding: '6px 8px', opacity: clipboard ? 1 : 0.4 }} disabled={!clipboard} title="Paste">
                    <ClipboardPaste size={13} />
                  </button>
                  <button onClick={handleDeleteSelected} className="btn-secondary" style={{ padding: '6px 8px', color: '#ff4d4d' }} title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              )}

              {/* Alignment Tools */}
              {selectedElementIds.length > 0 && (
                <div style={{ display: 'flex', gap: '1px', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '4px' }}>
                  <button onClick={() => alignElements('left')} className="btn-secondary" style={{ padding: '5px 7px' }} title="Align Left"><AlignLeft size={12} /></button>
                  <button onClick={() => alignElements('center')} className="btn-secondary" style={{ padding: '5px 7px' }} title="Align Center"><AlignCenter size={12} /></button>
                  <button onClick={() => alignElements('right')} className="btn-secondary" style={{ padding: '5px 7px' }} title="Align Right"><AlignRight size={12} /></button>
                  <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '2px 2px' }}></div>
                  <button onClick={() => alignElements('top')} className="btn-secondary" style={{ padding: '5px 7px' }} title="Align Top"><AlignVerticalJustifyStart size={12} /></button>
                  <button onClick={() => alignElements('middle')} className="btn-secondary" style={{ padding: '5px 7px' }} title="Align Middle"><AlignVerticalJustifyCenter size={12} /></button>
                  <button onClick={() => alignElements('bottom')} className="btn-secondary" style={{ padding: '5px 7px' }} title="Align Bottom"><AlignVerticalJustifyEnd size={12} /></button>
                </div>
              )}
            </>
          )}
          
          {/* Separator */}
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }}></div>

          {/* Main Actions */}
          <button 
            onClick={saveLayout} 
            disabled={isSaving}
            className="btn-primary" 
            style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px', opacity: isSaving ? 0.7 : 1, fontSize: '12px' }}
          >
            {isSaving ? '⏳ Saving...' : <><Save size={14} /> Save</>}
          </button>

          <button 
            onClick={exportProjectToDevice}
            className="btn-secondary" 
            style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
            title="Download project as ZIP archive"
          >
            <Download size={14} /> Export
          </button>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Globe size={14} style={{ position: 'absolute', left: '8px', color: '#94a3b8', pointerEvents: 'none' }} />
            <select
              value={language}
              disabled={isTranslating}
              onChange={(e) => handleTranslateAll(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#e2e8f0',
                padding: '6px 10px 6px 26px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: isTranslating ? 'wait' : 'pointer',
                outline: 'none'
              }}
              title="Select Site & UI Language"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code} style={{ background: '#1e293b', color: '#fff' }}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
            {isTranslating && (
              <span style={{ fontSize: '10px', color: '#818cf8', marginLeft: '6px', whiteSpace: 'nowrap' }}>
                ⏳ Translating...
              </span>
            )}
          </div>

          <button 
            onClick={() => setIsPreview(!isPreview)}
            className="btn-secondary" 
            style={{ 
              padding: '6px 10px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px', 
              fontSize: '12px',
              background: isPreview ? 'var(--primary)' : 'transparent'
            }}
          >
            {isPreview ? <><EyeOff size={14} /> Exit Preview</> : <><Eye size={14} /> Preview</>}
          </button>
          
          {/* Separator */}
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }}></div>

          {/* Publish Controls */}
          {site.is_published ? (
            <div style={{ display: 'flex', gap: '2px', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '4px' }}>
              <button onClick={() => handlePublishToggle(false)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--danger)' }}>
                Unpublish
              </button>
              <button onClick={() => setShowPublishModal(true)} className="btn-primary" style={{ padding: '6px 10px', fontSize: '12px', background: 'var(--accent)' }}>
                <Globe size={14} /> View
              </button>
            </div>
          ) : (
            <button onClick={() => handlePublishToggle(true)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Globe size={14} /> Publish
            </button>
          )}
        </div>
      </header>

      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden', position: 'relative' }}>
        
        {!isPreview && (
          <>
            <aside className="glass" style={{ width: `${leftSidebarWidth}px`, display: 'flex', borderRight: '1px solid var(--border)', flexShrink: 0, transition: isResizingLeft ? 'none' : 'width 0.2s', userSelect: isResizingLeft ? 'none' : 'auto' }}>
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

                  {/* When Layers tab search is active, show a shortcut to switch there */}
                  {isSearchActive && (
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(99,102,241,0.1)',
                      border: '1px solid rgba(99,102,241,0.3)',
                      fontSize: '11px',
                      color: '#818cf8',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <Search size={12} />
                      Searching: <strong>"{searchQuery}"</strong> — {matchedElementIds?.size ?? 0} match{matchedElementIds?.size !== 1 ? 'es' : ''} on canvas
                      <button
                        onClick={() => setSearchQuery('')}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '10px', padding: 0 }}
                      >
                        Clear ✕
                      </button>
                    </div>
                  )}

                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>💡 Drag and drop blocks directly into any section, or click to auto-add.</p>
                  
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
                    <button 
                      draggable 
                      onDragStart={(e) => e.dataTransfer.setData("elementType", "shape")}
                      onClick={() => handleAddElement('shape')} 
                      className="btn-secondary" 
                      style={{ flexDirection: 'column', height: '70px', padding: '10px', fontSize: '12px', cursor: 'grab' }}
                    >
                      <Square size={18} /> Shape
                    </button>
                    <button 
                      draggable 
                      onDragStart={(e) => e.dataTransfer.setData("elementType", "link")}
                      onClick={() => handleAddElement('link')} 
                      className="btn-secondary" 
                      style={{ flexDirection: 'column', height: '70px', padding: '10px', fontSize: '12px', cursor: 'grab' }}
                    >
                      <Link2 size={18} /> Link
                    </button>
                    <button 
                      draggable 
                      onDragStart={(e) => e.dataTransfer.setData("elementType", "site_search")}
                      onClick={() => handleAddElement('site_search')} 
                      className="btn-secondary" 
                      style={{ flexDirection: 'column', height: '70px', padding: '10px', fontSize: '12px', cursor: 'grab', gridColumn: 'span 2' }}
                    >
                      <Search size={18} style={{ color: 'var(--primary)' }} /> Site Search Bar
                    </button>
                    <button 
                      draggable 
                      onDragStart={(e) => e.dataTransfer.setData("elementType", "image_slider")}
                      onClick={() => handleAddElement('image_slider')} 
                      className="btn-secondary" 
                      style={{ flexDirection: 'column', height: '70px', padding: '10px', fontSize: '12px', cursor: 'grab', gridColumn: 'span 2' }}
                    >
                      <ImageIcon size={18} style={{ color: 'var(--accent)' }} /> Image Slider (Carousel)
                    </button>
                  </div>

                  {/* Smart Components Section */}
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '10px', borderTop: '1px solid var(--border)', paddingTop: '15px', color: 'var(--primary)' }}>
                    🧩 Smart Components
                  </h3>
                  <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    Pre-built layout blocks. Drag to add to canvas.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '25px' }}>
                    {getSmartComponentTypes().map(comp => (
                      <button
                        key={comp.type}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("elementType", `smart-${comp.type}`)}
                        onClick={() => handleAddSmartComponent(comp.type)}
                        className="btn-secondary"
                        style={{ flexDirection: 'column', height: '80px', padding: '10px', fontSize: '11px', cursor: 'grab', border: '1px solid var(--primary-glow)' }}
                      >
                        <span style={{ fontSize: '20px', marginBottom: '4px' }}>{comp.icon}</span>
                        <span style={{ fontWeight: '600' }}>{comp.label}</span>
                      </button>
                    ))}
                  </div>

                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '10px', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>Add Section</h3>
                  <button onClick={handleAddSection} className="btn-secondary" style={{ fontSize: '12px', justifyContent: 'flex-start', width: '100%' }}>
                    <Plus size={16} /> + Add New Section
                  </button>
                  
                 
                </div>
              )}


              {activeLeftTab === 'layers' && (
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px' }}>Layers</h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    All elements on this page. Click to select.
                  </p>

                  {/* THE SEARCH INPUT — only updates searchQuery, zero filter logic */}
                  <SearchInput
                    value={searchQuery}
                    onQueryChange={setSearchQuery}
                    matchCount={searchResults.length}
                    currentMatchIndex={currentMatchIndex}
                    onNextMatch={handleNextMatch}
                    onPrevMatch={handlePrevMatch}
                    placeholder="Search by type, text, alt…"
                  />

                  {/* Search result count badge */}
                  {isSearchActive && (
                    <div style={{
                      fontSize: '11px',
                      color: matchedElementIds.size > 0 ? '#818cf8' : '#f87171',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      <Search size={11} />
                      {matchedElementIds.size === 0
                        ? 'No elements match'
                        : `${matchedElementIds.size} element${matchedElementIds.size !== 1 ? 's' : ''} found`}
                    </div>
                  )}

                  {/* Element list — auto-populates as elements are added to canvas */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {activeLayout.flatMap((sec, si) =>
                      (sec.elements || []).map((el, ei) => {
                        const isMatch = !isSearchActive || matchedElementIds.has(el.id);
                        const isSelected = selectedElementIds.includes(el.id);
                        const label = el.content?.text || el.content?.label || el.content?.alt || el.type;
                        return (
                          <button
                            key={el.id}
                            onClick={() => {
                              setSelectedElementIds([el.id]);
                              // Auto-switch to inspect tab
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: isSelected
                                ? '1px solid rgba(99,102,241,0.6)'
                                : '1px solid transparent',
                              background: isSelected
                                ? 'rgba(99,102,241,0.12)'
                                : 'rgba(255,255,255,0.03)',
                              cursor: 'pointer',
                              textAlign: 'left',
                              color: isMatch ? '#e2e8f0' : '#374151',
                              opacity: isMatch ? 1 : 0.35,
                              transition: 'all 0.15s',
                              fontSize: '12px',
                            }}
                          >
                            {/* Type badge */}
                            <span style={{
                              fontSize: '9px',
                              fontWeight: '700',
                              padding: '2px 5px',
                              borderRadius: '4px',
                              background: isMatch ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                              color: isMatch ? '#818cf8' : '#64748b',
                              textTransform: 'uppercase',
                              letterSpacing: '0.4px',
                              flexShrink: 0,
                            }}>
                              {el.type}
                            </span>
                            {/* Label (truncated) */}
                            <span style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flexGrow: 1,
                            }}>
                              {String(label || '').slice(0, 40) || '—'}
                            </span>
                            {/* Section indicator */}
                            <span style={{ fontSize: '10px', color: '#475569', flexShrink: 0 }}>
                              §{si + 1}
                            </span>
                          </button>
                        );
                      })
                    )}
                    {activeLayout.every(s => (s.elements || []).length === 0) && (
                      <p style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', padding: '20px 0' }}>
                        No elements on canvas yet.
                      </p>
                    )}
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
                      <option value="Montserrat, sans-serif">Montserrat (Strong)</option>
                      <option value="Raleway, sans-serif">Raleway (Light & Elegant)</option>
                      <option value="Poppins, sans-serif">Poppins (Rounded Modern)</option>
                      <option value="Nunito, sans-serif">Nunito (Friendly Round)</option>
                      <option value="DM Sans, sans-serif">DM Sans (Clean Pro)</option>
                      <option value="Space Grotesk, sans-serif">Space Grotesk (Tech)</option>
                      <option value="Merriweather, serif">Merriweather (Classic Serif)</option>
                      <option value="Lora, serif">Lora (Editorial Serif)</option>
                      <option value="Fira Code, monospace">Fira Code (Developer/Mono)</option>
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
                            savePageLayout(activeLayout, updated);
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
                            savePageLayout(activeLayout, updated);
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
                            savePageLayout(activeLayout, updated);
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
                            savePageLayout(activeLayout, updated);
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
          <div 
            onMouseDown={() => setIsResizingLeft(true)}
            style={{ 
              width: '10px', 
              cursor: 'col-resize', 
              background: isResizingLeft ? 'var(--primary)' : 'transparent', 
              zIndex: 10, 
              marginLeft: '-5px', 
              marginRight: '-5px', 
              transition: 'background 0.2s',
              opacity: isResizingLeft ? 1 : 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => { if (!isResizingLeft) e.currentTarget.style.opacity = '0'; }}
          />
        </>
        )}

        {isPreview ? (
          /* ===== TRUE FULL-SCREEN IFRAME PREVIEW ===== */
          /* Renders the exact compiled HTML that gets deployed — pixel-perfect, real fonts, hover effects, animations */
          <div style={{ 
            flexGrow: 1, 
            overflow: 'auto', 
            position: 'relative', 
            background: getPageBgColor()
          }}>
            <div style={{
              width: getPreviewWidth(),
              margin: '0 auto',
              height: '100%',
              minHeight: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <iframe
                key={`preview-${activePage?.id}-${JSON.stringify(activeLayout).length}-${viewMode}`}
                srcDoc={compileToStaticHtml({ ...activePage, layout: activeLayout }, site, pages, viewMode, true)}
                style={{
                  flex: 1,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: getPageBgColor(),
                }}
                title="Live Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          </div>
        ) : (
          /* ===== EDITOR CANVAS ===== */
          <div
            ref={viewportRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              flexGrow: 1,
              padding: '40px',
              overflow: 'auto',
              background: '#090d16',
              boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8)',
              position: 'relative'
            }}
          >
            <div
              style={{
                width: getCanvasWidth(),
                margin: '0 auto',
                minHeight: '100%',
                backgroundColor: getPageBgColor(),
                color: site.theme?.textColor || '#333333',
                fontFamily: site.theme?.fontFamily || 'Inter, sans-serif',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--border)',
                transition: 'width 0.3s ease-in-out, border-radius 0.3s',
                overflow: 'visible',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                transform: `scale(${canvasZoom})`,
                transformOrigin: 'top center'
              }}
            >
              <style dangerouslySetInnerHTML={{ __html: site.custom_css }} />
              <style dangerouslySetInnerHTML={{ __html: getHoverStylesCss() }} />
              <style dangerouslySetInnerHTML={{ __html: `
                /* Entrance */
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeInDown { from { opacity: 0; transform: translateY(-40px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes fadeInRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes slideDown { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes slideLeft { from { transform: translateX(-60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes slideRight { from { transform: translateX(60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes zoomIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes zoomInUp { from { transform: scale(0.5) translateY(40px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
                @keyframes zoomInDown { from { transform: scale(0.5) translateY(-40px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
                @keyframes flipInX { from { transform: perspective(400px) rotateX(90deg); opacity: 0; } to { transform: perspective(400px) rotateX(0deg); opacity: 1; } }
                @keyframes flipInY { from { transform: perspective(400px) rotateY(90deg); opacity: 0; } to { transform: perspective(400px) rotateY(0deg); opacity: 1; } }
                @keyframes rotateIn { from { transform: rotate(-200deg); opacity: 0; } to { transform: rotate(0deg); opacity: 1; } }
                @keyframes rollIn { from { transform: translateX(-100%) rotate(-120deg); opacity: 0; } to { transform: translateX(0) rotate(0deg); opacity: 1; } }
                @keyframes lightSpeedIn { from { transform: translateX(100%) skewX(-30deg); opacity: 0; } 60% { transform: skewX(20deg); opacity: 1; } 80% { transform: skewX(-5deg); } to { transform: none; opacity: 1; } }
                @keyframes jackInTheBox { from { opacity: 0; transform: scale(0.1) rotate(30deg); transform-origin: center bottom; } 50% { transform: rotate(-10deg); } 70% { transform: rotate(3deg); } to { opacity: 1; transform: scale(1); } }
                @keyframes expandIn { from { transform: scaleX(0); opacity: 0; transform-origin: left; } to { transform: scaleX(1); opacity: 1; transform-origin: left; } }
                @keyframes dropIn { from { transform: translateY(-300px); opacity: 0; } 60% { transform: translateY(15px); opacity: 1; } 80% { transform: translateY(-5px); } to { transform: translateY(0); } }
                /* Attention / Looping */
                @keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-20px); } 60% { transform: translateY(-10px); } }
                @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); } 20%, 40%, 60%, 80% { transform: translateX(6px); } }
                @keyframes wobble { 0% { transform: translateX(0%); } 15% { transform: translateX(-15%) rotate(-5deg); } 30% { transform: translateX(10%) rotate(3deg); } 45% { transform: translateX(-10%) rotate(-3deg); } 60% { transform: translateX(5%) rotate(2deg); } 75% { transform: translateX(-3%) rotate(-1deg); } 100% { transform: translateX(0%); } }
                @keyframes rubberBand { 0% { transform: scale3d(1,1,1); } 30% { transform: scale3d(1.25,0.75,1); } 40% { transform: scale3d(0.75,1.25,1); } 50% { transform: scale3d(1.15,0.85,1); } 65% { transform: scale3d(0.95,1.05,1); } 75% { transform: scale3d(1.05,0.95,1); } 100% { transform: scale3d(1,1,1); } }
                @keyframes tada { 0% { transform: scale3d(1,1,1); } 10%, 20% { transform: scale3d(0.9,0.9,0.9) rotate(-3deg); } 30%, 50%, 70%, 90% { transform: scale3d(1.1,1.1,1.1) rotate(3deg); } 40%, 60%, 80% { transform: scale3d(1.1,1.1,1.1) rotate(-3deg); } 100% { transform: scale3d(1,1,1); } }
                @keyframes heartbeat { 0% { transform: scale(1); } 14% { transform: scale(1.15); } 28% { transform: scale(1); } 42% { transform: scale(1.15); } 70% { transform: scale(1); } 100% { transform: scale(1); } }
                @keyframes jello { 0%, 11.1%, 100% { transform: none; } 22.2% { transform: skewX(-12.5deg) skewY(-12.5deg); } 33.3% { transform: skewX(6.25deg) skewY(6.25deg); } 44.4% { transform: skewX(-3.125deg) skewY(-3.125deg); } 55.5% { transform: skewX(1.5625deg) skewY(1.5625deg); } 66.6% { transform: skewX(-0.78125deg) skewY(-0.78125deg); } 77.7% { transform: skewX(0.390625deg) skewY(0.390625deg); } 88.8% { transform: skewX(-0.1953125deg) skewY(-0.1953125deg); } }
                @keyframes flash { 0%, 50%, 100% { opacity: 1; } 25%, 75% { opacity: 0; } }
                @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
                @keyframes swing { 20% { transform: rotate(15deg); } 40% { transform: rotate(-10deg); } 60% { transform: rotate(5deg); } 80% { transform: rotate(-5deg); } 100% { transform: rotate(0deg); } }
                @keyframes glitch { 0%, 100% { transform: translate(0); } 20% { transform: translate(-3px, 3px); } 40% { transform: translate(-3px, -3px); } 60% { transform: translate(3px, 3px); } 80% { transform: translate(3px, -3px); } }
                @keyframes breathe { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.04); opacity: 0.85; } }
                /* Exit */
                @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
                @keyframes fadeOutUp { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-40px); } }
                @keyframes fadeOutDown { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(40px); } }
                @keyframes zoomOut { from { transform: scale(1); opacity: 1; } to { transform: scale(0.5); opacity: 0; } }
                @keyframes slideOutLeft { from { transform: translateX(0); opacity: 1; } to { transform: translateX(-60px); opacity: 0; } }
                @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(60px); opacity: 0; } }
              ` }} />



              <div className="builder-canvas-wrapper" style={{ flex: 1, overflowY: 'auto', width: '100%', minHeight: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {activePage && activeLayout ? (
                  activeLayout.length === 0 ? (
                    <div style={{ padding: '80px 20px', textAlign: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
                      <Sparkles size={48} style={{ marginBottom: '16px', color: 'var(--primary)' }} />
                      <h4 style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '20px' }}>Empty Canvas</h4>
                      <p style={{ fontSize: '14px', maxWidth: '300px', margin: '0 auto 24px' }}>
                        Your site has no sections. Click below to add a section to begin!
                      </p>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleAddSection} className="btn-primary" style={{ padding: '10px 20px', cursor: 'pointer' }}>+ Add Section</button>
                      </div>
                    </div>
                  ) : (
                    activeLayout.map((sec, secIdx) => {
                      const rawSecSettings = { ...sec.settings };
                      const { containerWidth: _cw, backgroundColor: secBgColor, useGlobalBackground, ...otherSettings } = rawSecSettings || {};
                      const containerWidth = _cw || '1200px';
                      const secStyles = renderInlineStyles(otherSettings);
                      const sectionBg = (useGlobalBackground === false && secBgColor && secBgColor !== 'transparent' && secBgColor !== '') ? secBgColor : 'transparent';

                      return (
                        <section 
                          key={sec.id} 
                          style={{ position: 'relative', width: '100%', backgroundColor: sectionBg, ...secStyles, overflow: 'visible', display: 'flex', flexDirection: 'column', flexGrow: 1 }} 
                          className="builder-canvas-section"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => { e.preventDefault(); handleDropElement(e, sec.id); }}
                        >
                          {!isPreview && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Are you sure you want to delete this section?')) {
                                  handleDeleteSection(sec.id);
                                }
                              }}
                              style={{
                                position: 'absolute',
                                top: '10px',
                                right: '20px',
                                background: '#ef4444',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                zIndex: 100,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                opacity: 0.7,
                                transition: 'opacity 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                              title="Delete Section"
                            >
                              <Trash2 size={14} /> Delete Section
                            </button>
                          )}
                          <div
                            className="builder-canvas-section-dropzone"
                            style={{
                              maxWidth: containerWidth,
                              margin: '0 auto',
                              padding: '0 20px',
                              boxSizing: 'border-box',
                              position: 'relative',
                              overflow: 'visible',
                              flexGrow: 1,
                              width: '100%',
                              minHeight: '200px',
                              ...(showGridGuides ? {
                                backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
                                backgroundSize: snapToGrid > 0 ? `${snapToGrid}px ${snapToGrid}px` : '20px 20px'
                              } : {})
                            }}
                          >
                            {(sec.elements || []).map(el => renderCanvasElement(el))}
                            
                            {!isPreview && alignmentGuides.map((guide, idx) => {
                              if (guide.type === 'vertical') {
                                return (
                                  <div
                                    key={`guide-${idx}`}
                                    style={{
                                      position: 'absolute',
                                      left: guide.position,
                                      top: guide.startY,
                                      height: guide.endY - guide.startY,
                                      width: '1px',
                                      borderLeft: `1px dashed ${GUIDE_COLOR}`,
                                      zIndex: 1000,
                                      pointerEvents: 'none'
                                    }}
                                  />
                                );
                              } else if (guide.type === 'horizontal') {
                                return (
                                  <div
                                    key={`guide-${idx}`}
                                    style={{
                                      position: 'absolute',
                                      top: guide.position,
                                      left: guide.startX,
                                      width: guide.endX - guide.startX,
                                      height: '1px',
                                      borderTop: `1px dashed ${GUIDE_COLOR}`,
                                      zIndex: 1000,
                                      pointerEvents: 'none'
                                    }}
                                  />
                                );
                              } else if (guide.type === 'spacing' && guide.orientation === 'horizontal') {
                                // Equal-spacing indicator: horizontal bracket + label
                                const spanW = guide.x2 - guide.x1;
                                if (spanW < 4) return null;
                                const SPACING_COLOR = guide.unequal ? '#f59e0b' : '#ec4899'; // amber if unequal, pink if equal
                                return (
                                  <div key={`guide-${idx}`} style={{ position: 'absolute', left: guide.x1, top: guide.y, width: spanW, height: 16, pointerEvents: 'none', zIndex: 1001 }}>
                                    {/* Left cap */}
                                    <div style={{ position: 'absolute', left: 0, top: 4, width: 1, height: 8, background: SPACING_COLOR }} />
                                    {/* Right cap */}
                                    <div style={{ position: 'absolute', right: 0, top: 4, width: 1, height: 8, background: SPACING_COLOR }} />
                                    {/* Line */}
                                    <div style={{ position: 'absolute', left: 1, right: 1, top: 7, height: 1, background: SPACING_COLOR }} />
                                    {/* Label */}
                                    <div style={{
                                      position: 'absolute',
                                      left: '50%', top: -1,
                                      transform: 'translateX(-50%)',
                                      background: SPACING_COLOR,
                                      color: '#fff',
                                      fontSize: '9px',
                                      fontWeight: '700',
                                      padding: '1px 4px',
                                      borderRadius: '3px',
                                      whiteSpace: 'nowrap',
                                      letterSpacing: '0.3px',
                                    }}>{guide.label}</div>
                                  </div>
                                );
                              } else if (guide.type === 'spacing' && guide.orientation === 'vertical') {
                                // Vertical bracket + label
                                const spanH = guide.y2 - guide.y1;
                                if (spanH < 4) return null;
                                const SPACING_COLOR = guide.unequal ? '#f59e0b' : '#ec4899';
                                return (
                                  <div key={`guide-${idx}`} style={{ position: 'absolute', top: guide.y1, left: guide.x, width: 16, height: spanH, pointerEvents: 'none', zIndex: 1001 }}>
                                    {/* Top cap */}
                                    <div style={{ position: 'absolute', top: 0, left: 4, height: 1, width: 8, background: SPACING_COLOR }} />
                                    {/* Bottom cap */}
                                    <div style={{ position: 'absolute', bottom: 0, left: 4, height: 1, width: 8, background: SPACING_COLOR }} />
                                    {/* Line */}
                                    <div style={{ position: 'absolute', top: 1, bottom: 1, left: 7, width: 1, background: SPACING_COLOR }} />
                                    {/* Label */}
                                    <div style={{
                                      position: 'absolute',
                                      top: '50%', left: -2,
                                      transform: 'translateY(-50%)',
                                      background: SPACING_COLOR,
                                      color: '#fff',
                                      fontSize: '9px',
                                      fontWeight: '700',
                                      padding: '1px 4px',
                                      borderRadius: '3px',
                                      whiteSpace: 'nowrap',
                                      letterSpacing: '0.3px',
                                      writingMode: 'vertical-rl',
                                    }}>{guide.label}</div>
                                  </div>
                                );
                              }
                              return null;
                            })}


                            {(sec.elements || []).length === 0 && (
                              <div style={{
                                padding: '40px 15px',
                                textAlign: 'center',
                                color: '#64748b',
                                fontSize: '12px',
                                position: 'absolute',
                                top: '50%', left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '80%'
                              }}>
                                Drop elements here or use the panel to add content
                              </div>
                            )}
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
        )}


        {!isPreview && (
          <>
            <div 
              onMouseDown={() => setIsResizingRight(true)}
              style={{ 
                width: '10px', 
                cursor: 'col-resize', 
                background: isResizingRight ? 'var(--primary)' : 'transparent', 
                zIndex: 10, 
                marginLeft: '-5px', 
                marginRight: '-5px', 
                transition: 'background 0.2s',
                opacity: isResizingRight ? 1 : 0,
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => { if (!isResizingRight) e.currentTarget.style.opacity = '0'; }}
            />
            <aside className="glass" style={{ width: `${rightSidebarWidth}px`, borderLeft: '1px solid var(--border)', padding: '20px', overflowY: 'auto', flexShrink: 0, transition: isResizingRight ? 'none' : 'width 0.2s', userSelect: isResizingRight ? 'none' : 'auto' }}>
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

                {/* Movement Widget */}
                <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Move size={12} /> Position Control
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    {/* Up Arrow */}
                    <button
                      onClick={() => {
                        const nextLayout = activeLayout.map(sec => ({
                          ...sec,
                          elements: (sec.elements || []).map(el => {
                            if (selectedElementIds.includes(el.id)) {
                              return { ...el, y: Math.max(0, (el.y || 0) - 1) };
                            }
                            return el;
                          })
                        }));
                        updateLayout(nextLayout);
                      }}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '11px', width: '100%', maxWidth: '120px' }}
                      title="Move Up 1px"
                    >
                      <ArrowUpIcon size={14} /> Up
                    </button>
                    
                    {/* Left, Down, Right Row */}
                    <div style={{ display: 'flex', gap: '4px', width: '100%', maxWidth: '120px' }}>
                      <button
                        onClick={() => {
                          const nextLayout = activeLayout.map(sec => ({
                            ...sec,
                            elements: (sec.elements || []).map(el => {
                              if (selectedElementIds.includes(el.id)) {
                                return { ...el, x: Math.max(0, (el.x || 0) - 1) };
                              }
                              return el;
                            })
                          }));
                          updateLayout(nextLayout);
                        }}
                        className="btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '11px', flex: 1 }}
                        title="Move Left 1px"
                      >
                        <ArrowLeftIcon size={14} />
                      </button>
                      <button
                        onClick={() => {
                          const nextLayout = activeLayout.map(sec => ({
                            ...sec,
                            elements: (sec.elements || []).map(el => {
                              if (selectedElementIds.includes(el.id)) {
                                return { ...el, y: (el.y || 0) + 1 };
                              }
                              return el;
                            })
                          }));
                          updateLayout(nextLayout);
                        }}
                        className="btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '11px', flex: 1 }}
                        title="Move Down 1px"
                      >
                        <ArrowDownIcon size={14} />
                      </button>
                      <button
                        onClick={() => {
                          const nextLayout = activeLayout.map(sec => ({
                            ...sec,
                            elements: (sec.elements || []).map(el => {
                              if (selectedElementIds.includes(el.id)) {
                                return { ...el, x: (el.x || 0) + 1 };
                              }
                              return el;
                            })
                          }));
                          updateLayout(nextLayout);
                        }}
                        className="btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '11px', flex: 1 }}
                        title="Move Right 1px"
                      >
                        <ArrowRightIcon size={14} />
                      </button>
                    </div>
                    
                    {/* Shift + Move Buttons (10px) */}
                    <div style={{ display: 'flex', gap: '4px', width: '100%', maxWidth: '120px', marginTop: '2px' }}>
                      <button
                        onClick={() => {
                          const nextLayout = activeLayout.map(sec => ({
                            ...sec,
                            elements: (sec.elements || []).map(el => {
                              if (selectedElementIds.includes(el.id)) {
                                return { ...el, x: Math.max(0, (el.x || 0) - 10) };
                              }
                              return el;
                            })
                          }));
                          updateLayout(nextLayout);
                        }}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '10px', flex: 1, opacity: 0.7 }}
                        title="Move Left 10px (Shift+Left)"
                      >
                        ←10
                      </button>
                      <button
                        onClick={() => {
                          const nextLayout = activeLayout.map(sec => ({
                            ...sec,
                            elements: (sec.elements || []).map(el => {
                              if (selectedElementIds.includes(el.id)) {
                                return { ...el, x: (el.x || 0) + 10 };
                              }
                              return el;
                            })
                          }));
                          updateLayout(nextLayout);
                        }}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '10px', flex: 1, opacity: 0.7 }}
                        title="Move Right 10px (Shift+Right)"
                      >
                        10→
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', width: '100%', maxWidth: '120px' }}>
                      <button
                        onClick={() => {
                          const nextLayout = activeLayout.map(sec => ({
                            ...sec,
                            elements: (sec.elements || []).map(el => {
                              if (selectedElementIds.includes(el.id)) {
                                return { ...el, y: Math.max(0, (el.y || 0) - 10) };
                              }
                              return el;
                            })
                          }));
                          updateLayout(nextLayout);
                        }}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '10px', flex: 1, opacity: 0.7 }}
                        title="Move Up 10px (Shift+Up)"
                      >
                        ↑10
                      </button>
                      <button
                        onClick={() => {
                          const nextLayout = activeLayout.map(sec => ({
                            ...sec,
                            elements: (sec.elements || []).map(el => {
                              if (selectedElementIds.includes(el.id)) {
                                return { ...el, y: (el.y || 0) + 10 };
                              }
                              return el;
                            })
                          }));
                          updateLayout(nextLayout);
                        }}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '10px', flex: 1, opacity: 0.7 }}
                        title="Move Down 10px (Shift+Down)"
                      >
                        10↓
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'center', fontStyle: 'italic' }}>
                    Use arrow keys for 1px • Hold Shift for 10px
                  </p>
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

                  <div style={{ marginBottom: '16px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ margin: 0, fontWeight: 'bold' }}>Global Sync</label>
                      <input 
                        type="checkbox"
                        checked={!!selectedElement.isGlobal}
                        onChange={(e) => updateSelectedElement({ isGlobal: e.target.checked })}
                      />
                    </div>
                    <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: 0 }}>
                      If checked, changes to this element will automatically sync to all pages where it exists.
                    </p>
                  </div>

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

                  {selectedElement.type === 'image' && (
                    <div style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        🖼️ Image Display & Object Fit
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ fontSize: '10px' }}>Object Fit</label>
                          <select
                            value={selectedElement.styles?.objectFit || 'cover'}
                            onChange={(e) => updateSelectedElement({ styles: { objectFit: e.target.value } })}
                            style={{ fontSize: '11px', padding: '4px' }}
                          >
                            <option value="cover">Cover (Fill)</option>
                            <option value="contain">Contain (Fit)</option>
                            <option value="fill">Stretch</option>
                            <option value="none">Original</option>
                            <option value="scale-down">Scale Down</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '10px' }}>Position</label>
                          <select
                            value={selectedElement.styles?.objectPosition || 'center'}
                            onChange={(e) => updateSelectedElement({ styles: { objectPosition: e.target.value } })}
                            style={{ fontSize: '11px', padding: '4px' }}
                          >
                            <option value="center">Center</option>
                            <option value="top">Top</option>
                            <option value="bottom">Bottom</option>
                            <option value="left">Left</option>
                            <option value="right">Right</option>
                          </select>
                        </div>
                      </div>

                      {/* Image CSS Filters */}
                      <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '10px', marginTop: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        🎨 CSS Image Filters
                      </h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                            <span>Blur</span>
                            <span>{selectedElement.styles?.filterBlur || 0}px</span>
                          </div>
                          <input type="range" min="0" max="20" value={selectedElement.styles?.filterBlur || 0} onChange={(e) => updateSelectedElement({ styles: { filterBlur: e.target.value } })} style={{ padding: 0 }} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                            <span>Brightness</span>
                            <span>{selectedElement.styles?.filterBrightness || 100}%</span>
                          </div>
                          <input type="range" min="0" max="200" value={selectedElement.styles?.filterBrightness || 100} onChange={(e) => updateSelectedElement({ styles: { filterBrightness: e.target.value } })} style={{ padding: 0 }} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                            <span>Contrast</span>
                            <span>{selectedElement.styles?.filterContrast || 100}%</span>
                          </div>
                          <input type="range" min="0" max="200" value={selectedElement.styles?.filterContrast || 100} onChange={(e) => updateSelectedElement({ styles: { filterContrast: e.target.value } })} style={{ padding: 0 }} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                            <span>Saturation</span>
                            <span>{selectedElement.styles?.filterSaturate || 100}%</span>
                          </div>
                          <input type="range" min="0" max="200" value={selectedElement.styles?.filterSaturate || 100} onChange={(e) => updateSelectedElement({ styles: { filterSaturate: e.target.value } })} style={{ padding: 0 }} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                            <span>Grayscale</span>
                            <span>{selectedElement.styles?.filterGrayscale || 0}%</span>
                          </div>
                          <input type="range" min="0" max="100" value={selectedElement.styles?.filterGrayscale || 0} onChange={(e) => updateSelectedElement({ styles: { filterGrayscale: e.target.value } })} style={{ padding: 0 }} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                            <span>Sepia</span>
                            <span>{selectedElement.styles?.filterSepia || 0}%</span>
                          </div>
                          <input type="range" min="0" max="100" value={selectedElement.styles?.filterSepia || 0} onChange={(e) => updateSelectedElement({ styles: { filterSepia: e.target.value } })} style={{ padding: 0 }} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                            <span>Hue Rotate</span>
                            <span>{selectedElement.styles?.filterHueRotate || 0}°</span>
                          </div>
                          <input type="range" min="0" max="360" value={selectedElement.styles?.filterHueRotate || 0} onChange={(e) => updateSelectedElement({ styles: { filterHueRotate: e.target.value } })} style={{ padding: 0 }} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                            <span>Invert</span>
                            <span>{selectedElement.styles?.filterInvert || 0}%</span>
                          </div>
                          <input type="range" min="0" max="100" value={selectedElement.styles?.filterInvert || 0} onChange={(e) => updateSelectedElement({ styles: { filterInvert: e.target.value } })} style={{ padding: 0 }} />
                        </div>
                      </div>

                      <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Image Hover Effects
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '15px' }}>
                        <div><label style={{ fontSize: '10px' }}>Zoom ({selectedElement.styles?.imageHoverScale || 1}×)</label><input type="range" min="1" max="1.5" step="0.05" value={selectedElement.styles?.imageHoverScale || 1} onChange={(e) => updateSelectedElement({ styles: { imageHoverScale: e.target.value } })} style={{ padding: 0 }} /></div>
                        <div><label style={{ fontSize: '10px' }}>Rotate ({selectedElement.styles?.imageHoverRotate || 0}°)</label><input type="range" min="-15" max="15" value={selectedElement.styles?.imageHoverRotate || 0} onChange={(e) => updateSelectedElement({ styles: { imageHoverRotate: e.target.value } })} style={{ padding: 0 }} /></div>
                        <div><label style={{ fontSize: '10px' }}>Hover brightness</label><input type="range" min="50" max="150" value={selectedElement.styles?.hoverFilterBrightness || 100} onChange={(e) => updateSelectedElement({ styles: { hoverFilterBrightness: e.target.value } })} style={{ padding: 0 }} /></div>
                        <div><label style={{ fontSize: '10px' }}>Hover saturation</label><input type="range" min="0" max="200" value={selectedElement.styles?.hoverFilterSaturate || 100} onChange={(e) => updateSelectedElement({ styles: { hoverFilterSaturate: e.target.value } })} style={{ padding: 0 }} /></div>
                        <div><label style={{ fontSize: '10px' }}>Hover blur</label><input type="range" min="0" max="12" value={selectedElement.styles?.hoverFilterBlur || 0} onChange={(e) => updateSelectedElement({ styles: { hoverFilterBlur: e.target.value } })} style={{ padding: 0 }} /></div>
                        <div><label style={{ fontSize: '10px' }}>Speed ({selectedElement.styles?.imageHoverSpeed || 0.3}s)</label><input type="range" min="0.1" max="1.5" step="0.1" value={selectedElement.styles?.imageHoverSpeed || 0.3} onChange={(e) => updateSelectedElement({ styles: { imageHoverSpeed: e.target.value } })} style={{ padding: 0 }} /></div>
                      </div>

                      {/* Hover Overlay Controls */}
                      <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '10px', marginTop: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        ✨ Image Hover Overlay
                      </h4>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer', marginBottom: '10px' }}>
                        <input
                          type="checkbox"
                          checked={!!selectedElement.styles?.hoverOverlayEnabled}
                          onChange={(e) => updateSelectedElement({ styles: { hoverOverlayEnabled: e.target.checked } })}
                        />
                        Enable Hover Overlay
                      </label>

                      {selectedElement.styles?.hoverOverlayEnabled && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '10px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={selectedElement.styles?.hoverOverlayRespectTransparency !== false} onChange={(e) => updateSelectedElement({ styles: { hoverOverlayRespectTransparency: e.target.checked } })} />
                            Respect transparent image pixels
                          </label>
                          <div>
                            <label style={{ fontSize: '10px' }}>Coverage Area</label>
                            <select
                              value={selectedElement.styles?.hoverOverlayCoverage || 'full'}
                              onChange={(e) => updateSelectedElement({ styles: { hoverOverlayCoverage: e.target.value } })}
                              style={{ fontSize: '11px', padding: '4px' }}
                            >
                              <option value="full">Full Coverage</option>
                              <option value="top-half">Top Half</option>
                              <option value="bottom-half">Bottom Half</option>
                              <option value="left-half">Left Half</option>
                              <option value="right-half">Right Half</option>
                              <option value="gradient-bottom">Gradient Bottom</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '10px' }}>Overlay Text</label>
                            <input
                              type="text"
                              value={selectedElement.styles?.hoverOverlayText || ''}
                              onChange={(e) => updateSelectedElement({ styles: { hoverOverlayText: e.target.value } })}
                              placeholder="Text on hover..."
                              style={{ fontSize: '11px' }}
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                              <label style={{ fontSize: '10px' }}>Overlay Color</label>
                              <input
                                type="color"
                                value={selectedElement.styles?.hoverOverlayColor || '#000000'}
                                onChange={(e) => updateSelectedElement({ styles: { hoverOverlayColor: e.target.value } })}
                                style={{ height: '30px', padding: 0, border: 'none', cursor: 'pointer' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '10px' }}>Text Color</label>
                              <input
                                type="color"
                                value={selectedElement.styles?.hoverOverlayTextColor || '#ffffff'}
                                onChange={(e) => updateSelectedElement({ styles: { hoverOverlayTextColor: e.target.value } })}
                                style={{ height: '30px', padding: 0, border: 'none', cursor: 'pointer' }}
                              />
                            </div>
                          </div>
                          <div>
                            <label style={{ fontSize: '10px' }}>Overlay opacity ({Math.round((selectedElement.styles?.hoverOverlayOpacity ?? 1) * 100)}%)</label>
                            <input type="range" min="0" max="1" step="0.05" value={selectedElement.styles?.hoverOverlayOpacity ?? 1} onChange={(e) => updateSelectedElement({ styles: { hoverOverlayOpacity: e.target.value } })} style={{ padding: 0 }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '10px' }}>Overlay Icon</label>
                            <select
                              value={selectedElement.styles?.hoverOverlayIcon || 'none'}
                              onChange={(e) => updateSelectedElement({ styles: { hoverOverlayIcon: e.target.value } })}
                              style={{ fontSize: '11px', padding: '4px' }}
                            >
                              <option value="none">None</option>
                              <option value="zoom-in">Zoom Icon</option>
                              <option value="link">Link Icon</option>
                              <option value="eye">Eye Icon</option>
                              <option value="heart">Heart Icon</option>
                              <option value="info">Info Icon</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedElement.type === 'image_slider' && (
                    <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Slide Images
                      </h4>
                      {(selectedElement.content?.slides || []).map((slide, idx) => (
                        <div key={slide.id || idx} style={{ marginBottom: '10px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                          <label style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>
                            Slide {idx + 1}
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const updatedSlides = [...(selectedElement.content?.slides || [])];
                                updatedSlides[idx] = { ...updatedSlides[idx], image: ev.target.result };
                                updateSelectedElement({ content: { slides: updatedSlides } });
                              };
                              reader.readAsDataURL(file);
                            }}
                            style={{ fontSize: '10px', padding: '4px 0', marginBottom: '4px' }}
                          />
                          {slide.image && (
                            <div style={{ fontSize: '9px', color: '#22c55e', marginTop: '2px' }}>
                              ✓ Image uploaded
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* Transition Controls */}
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Transition Effect
                        </h4>
                        
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>
                            Animation Type
                          </label>
                          <select
                            value={selectedElement.content?.transition || 'fade'}
                            onChange={(e) => updateSelectedElement({ content: { transition: e.target.value } })}
                            style={{ width: '100%', fontSize: '11px', padding: '4px', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}
                          >
                            <option value="fade">Fade</option>
                            <option value="fadeUp">Fade Up</option>
                            <option value="fadeDown">Fade Down</option>
                            <option value="fadeLeft">Fade Left</option>
                            <option value="fadeRight">Fade Right</option>
                            <option value="slideLeft">Slide Left</option>
                            <option value="slideRight">Slide Right</option>
                            <option value="slideUp">Slide Up</option>
                            <option value="slideDown">Slide Down</option>
                            <option value="zoomIn">Zoom In</option>
                            <option value="zoomOut">Zoom Out</option>
                            <option value="flip">Flip</option>
                            <option value="flipUp">Flip Up</option>
                            <option value="flipDown">Flip Down</option>
                            <option value="flipLeft">Flip Left</option>
                            <option value="flipRight">Flip Right</option>
                            <option value="rotate">Rotate</option>
                            <option value="rotateClockwise">Rotate Clockwise</option>
                            <option value="rotateCounter">Rotate Counter</option>
                            <option value="bounce">Bounce</option>
                            <option value="pulse">Pulse</option>
                            <option value="swing">Swing</option>
                            <option value="rubberBand">Rubber Band</option>
                            <option value="hinge">Hinge</option>
                            <option value="lightSpeedIn">Light Speed In</option>
                            <option value="lightSpeedOut">Light Speed Out</option>
                            <option value="jackInTheBox">Jack In The Box</option>
                            <option value="rollIn">Roll In</option>
                            <option value="rollOut">Roll Out</option>
                          </select>
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <label style={{ fontSize: '10px', color: '#94a3b8' }}>Duration</label>
                            <span style={{ fontSize: '10px', color: 'var(--primary)' }}>{selectedElement.content?.transitionDuration || 0.5}s</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="2"
                            step="0.1"
                            value={selectedElement.content?.transitionDuration || 0.5}
                            onChange={(e) => updateSelectedElement({ content: { transitionDuration: parseFloat(e.target.value) } })}
                            style={{ width: '100%', padding: 0 }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                          <div>
                            <label style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>
                              Autoplay
                            </label>
                            <select
                              value={selectedElement.content?.autoPlay ? 'true' : 'false'}
                              onChange={(e) => updateSelectedElement({ content: { autoPlay: e.target.value === 'true' } })}
                              style={{ width: '100%', fontSize: '10px', padding: '4px', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}
                            >
                              <option value="true">Enabled</option>
                              <option value="false">Disabled</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>
                              Interval (ms)
                            </label>
                            <input
                              type="number"
                              min="1000"
                              max="10000"
                              step="500"
                              value={selectedElement.content?.autoPlayInterval || 3000}
                              onChange={(e) => updateSelectedElement({ content: { autoPlayInterval: parseInt(e.target.value) } })}
                              style={{ width: '100%', fontSize: '10px', padding: '4px', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#94a3b8', cursor: 'pointer', flex: 1 }}>
                            <input
                              type="checkbox"
                              checked={selectedElement.content?.showArrows !== false}
                              onChange={(e) => updateSelectedElement({ content: { showArrows: e.target.checked } })}
                              style={{ width: 'auto', cursor: 'pointer' }}
                            />
                            Arrows
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#94a3b8', cursor: 'pointer', flex: 1 }}>
                            <input
                              type="checkbox"
                              checked={selectedElement.content?.showDots !== false}
                              onChange={(e) => updateSelectedElement({ content: { showDots: e.target.checked } })}
                              style={{ width: 'auto', cursor: 'pointer' }}
                            />
                            Dots
                          </label>
                        </div>
                      </div>
                      
                      <p style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '6px', fontStyle: 'italic' }}>
                        Upload images from your device for each slide
                      </p>
                    </div>
                  )}

                  {selectedElement.type === 'site_search' && (
                    <>
                      <div style={{ marginBottom: '12px' }}>
                        <label>Placeholder Text</label>
                        <input
                          type="text"
                          value={selectedElement.content?.placeholder || ''}
                          onChange={(e) => updateSelectedElement({ content: { placeholder: e.target.value } })}
                        />
                      </div>
                    </>
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

                  {selectedElement.type === 'shape' && (
                    <>
                      <div style={{ marginBottom: '12px' }}>
                        <label>Shape Type</label>
                        <select
                          value={selectedElement.content?.shapeType || 'rectangle'}
                          onChange={(e) => updateSelectedElement({ content: { shapeType: e.target.value } })}
                        >
                          <option value="rectangle">Rectangle</option>
                          <option value="circle">Circle</option>
                          <option value="triangle">Triangle</option>
                          <option value="pentagon">Pentagon</option>
                          <option value="hexagon">Hexagon</option>
                          <option value="octagon">Octagon</option>
                          <option value="star">Star</option>
                          <option value="diamond">Diamond</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <label>Fill Type</label>
                        <select
                          value={selectedElement.content?.fillType || 'filled'}
                          onChange={(e) => updateSelectedElement({ content: { fillType: e.target.value } })}
                        >
                          <option value="filled">Filled</option>
                          <option value="border">Border Only</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        {renderLabelWithReset('Shape Color', 'styles', 'backgroundColor')}
                        <input
                          type="color"
                          value={selectedElement.styles?.backgroundColor || selectedElement.styles?.color || '#6366f1'}
                          onChange={(e) => {
                            const v = e.target.value;
                            debouncedColorUpdate('color_shape', () => updateSelectedElement({ styles: { backgroundColor: v, color: v } }));
                          }}
                          style={{ height: '35px', width: '100%', padding: '0', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                        />
                      </div>
                      {(selectedElement.content?.fillType === 'border') && (
                        <div style={{ marginBottom: '12px' }}>
                          <label>Border Width</label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={selectedElement.content?.borderWidth || 4}
                            onChange={(e) => updateSelectedElement({ content: { borderWidth: parseInt(e.target.value) || 4 } })}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {selectedElement.type === 'link' && (
                    <>
                      <div style={{ marginBottom: '12px' }}>
                        <label>Link Text</label>
                        <input
                          type="text"
                          value={selectedElement.content?.text || ''}
                          onChange={(e) => updateSelectedElement({ content: { text: e.target.value } })}
                          placeholder="e.g. Learn More"
                        />
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <label>Link Destination URL</label>
                        <input
                          type="text"
                          value={selectedElement.content?.link || ''}
                          onChange={(e) => updateSelectedElement({ content: { link: e.target.value } })}
                          placeholder="e.g. https://google.com"
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <input
                          type="checkbox"
                          checked={selectedElement.content?.openInNewTab || false}
                          onChange={(e) => updateSelectedElement({ content: { openInNewTab: e.target.checked } })}
                          id="linkNewTab"
                          style={{ width: 'auto', cursor: 'pointer' }}
                        />
                        <label htmlFor="linkNewTab" style={{ margin: 0, cursor: 'pointer' }}>Open in New Tab</label>
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

                  {/* Opacity */}
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <label>Opacity</label>
                      <span style={{ fontSize: '12px', color: 'var(--primary)' }}>{Math.round((parseFloat(selectedElement.styles?.opacity ?? 1)) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={selectedElement.styles?.opacity ?? 1}
                      onChange={(e) => updateSelectedElement({ styles: { opacity: parseFloat(e.target.value) } })}
                      style={{ padding: 0 }}
                    />
                  </div>

                  {['heading', 'text', 'button', 'input'].includes(selectedElement.type) && (
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        {renderLabelWithReset('Font Size', 'styles', 'fontSize')}
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
                    <div style={{ marginBottom: '12px' }}>
                      {renderLabelWithReset('Font Weight', 'styles', 'fontWeight')}
                      <select
                        value={selectedElement.styles?.fontWeight || '400'}
                        onChange={(e) => updateSelectedElement({ styles: { fontWeight: e.target.value } })}
                      >
                        <option value="300">300 - Light</option>
                        <option value="400">400 - Normal</option>
                        <option value="500">500 - Medium</option>
                        <option value="600">600 - Semi Bold</option>
                        <option value="700">700 - Bold</option>
                        <option value="800">800 - Extra Bold</option>
                        <option value="900">900 - Black</option>
                      </select>
                    </div>
                  )}

                  {['heading', 'text', 'button', 'input'].includes(selectedElement.type) && (
                    <div style={{ marginBottom: '12px' }}>
                      <label>Font Family</label>
                      <select
                        value={selectedElement.styles?.fontFamily || 'inherit'}
                        onChange={(e) => updateSelectedElement({ styles: { fontFamily: e.target.value } })}
                        style={{ fontSize: '11px' }}
                      >
                        <option value="inherit">Inherit (Default)</option>
                        <optgroup label="English Fonts">
                          <option value="'Outfit', sans-serif">Outfit</option>
                          <option value="'Inter', sans-serif">Inter</option>
                          <option value="'Roboto', sans-serif">Roboto</option>
                          <option value="'Open Sans', sans-serif">Open Sans</option>
                          <option value="'Lato', sans-serif">Lato</option>
                          <option value="'Montserrat', sans-serif">Montserrat</option>
                          <option value="'Poppins', sans-serif">Poppins</option>
                          <option value="'Raleway', sans-serif">Raleway</option>
                          <option value="'Noto Sans', sans-serif">Noto Sans</option>
                          <option value="'Tinos', serif">Tinos</option>
                          <option value="'Cormorant Garamond', serif">Cormorant Garamond</option>
                          <option value="'Playfair Display', serif">Playfair Display</option>
                          <option value="'Merriweather', serif">Merriweather</option>
                          <option value="'Source Sans Pro', sans-serif">Source Sans Pro</option>
                          <option value="'Nunito', sans-serif">Nunito</option>
                          <option value="'Work Sans', sans-serif">Work Sans</option>
                          <option value="'IBM Plex Sans', sans-serif">IBM Plex Sans</option>
                          <option value="'Fira Sans', sans-serif">Fira Sans</option>
                          <option value="'Ubuntu', sans-serif">Ubuntu</option>
                          <option value="'Barlow', sans-serif">Barlow</option>
                          <option value="'DM Sans', sans-serif">DM Sans</option>
                          <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
                          <option value="Arial, sans-serif">Arial</option>
                          <option value="'Helvetica', sans-serif">Helvetica</option>
                          <option value="Georgia, serif">Georgia</option>
                          <option value="'Times New Roman', serif">Times New Roman</option>
                          <option value="Verdana, sans-serif">Verdana</option>
                          <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                          <option value="Impact, sans-serif">Impact</option>
                          <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                          <option value="'Courier New', monospace">Courier New</option>
                          <option value="'Lucida Console', monospace">Lucida Console</option>
                          <option value="Tahoma, sans-serif">Tahoma</option>
                          <option value="'Segoe UI', sans-serif">Segoe UI</option>
                        </optgroup>
                        <optgroup label="Arabic Fonts">
                          <option value="'Noto Sans Arabic', sans-serif">Noto Sans Arabic</option>
                          <option value="'Noto Naskh Arabic', serif">Noto Naskh Arabic</option>
                          <option value="'Amiri', serif">Amiri</option>
                          <option value="'Scheherazade New', serif">Scheherazade New</option>
                          <option value="Lateef, serif">Lateef</option>
                          <option value="'Markazi Text', serif">Markazi Text</option>
                          <option value="'Reem Kufi', sans-serif">Reem Kufi</option>
                          <option value="Jomhuria, serif">Jomhuria</option>
                          <option value="Lalezar, serif">Lalezar</option>
                          <option value="Rakkas, serif">Rakkas</option>
                          <option value="'Changa One', sans-serif">Changa One</option>
                          <option value="Cairo, sans-serif">Cairo</option>
                          <option value="Tajawal, sans-serif">Tajawal</option>
                          <option value="Almarai, sans-serif">Almarai</option>
                          <option value="Changa, sans-serif">Changa</option>
                        </optgroup>
                      </select>
                    </div>
                  )}

                  {['heading', 'text'].includes(selectedElement.type) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                      <div>
                        <label>Letter Spacing</label>
                        <input
                          type="number"
                          step="0.5"
                          value={selectedElement.styles?.letterSpacing?.replace('px','') || '0'}
                          onChange={(e) => updateSelectedElement({ styles: { letterSpacing: e.target.value + 'px' } })}
                        />
                      </div>
                      <div>
                        <label>Line Height</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.8"
                          max="4"
                          value={selectedElement.styles?.lineHeight || '1.5'}
                          onChange={(e) => updateSelectedElement({ styles: { lineHeight: e.target.value } })}
                        />
                      </div>
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
                        {renderLabelWithReset('Text Color', 'styles', 'color')}
                        <input
                          type="color"
                          value={selectedElement.styles?.color || '#333333'}
                          onChange={(e) => { const v = e.target.value; debouncedColorUpdate('color_1', () => updateSelectedElement({ styles: { color: v } })); }}
                          style={{ height: '35px', padding: '0', border: 'none', cursor: 'pointer' }}
                        />
                      </div>
                    )}
                    {['button', 'form', 'text', 'shape'].includes(selectedElement.type) && (
                      <div>
                        {renderLabelWithReset('Background Color', 'styles', 'backgroundColor')}
                        <input
                          type="color"
                          value={selectedElement.styles?.backgroundColor || '#ffffff'}
                          onChange={(e) => { const v = e.target.value; debouncedColorUpdate('color_2', () => updateSelectedElement({ styles: { backgroundColor: v, color: v } })); }}
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
                          onChange={(e) => { const v = e.target.value; debouncedColorUpdate('color_3', () => updateSelectedElement({ styles: { buttonBgColor: v } })); }}
                          style={{ height: '35px', padding: '0', border: 'none', cursor: 'pointer' }}
                        />
                      </div>
                      <div>
                        <label>Btn Text Color</label>
                        <input
                          type="color"
                          value={selectedElement.styles?.buttonTextColor || '#ffffff'}
                          onChange={(e) => { const v = e.target.value; debouncedColorUpdate('color_4', () => updateSelectedElement({ styles: { buttonTextColor: v } })); }}
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
                        max="60"
                        value={selectedElement.styles?.borderRadius || '4'}
                        onChange={(e) => updateSelectedElement({ styles: { borderRadius: e.target.value } })}
                        style={{ padding: 0 }}
                      />
                    </div>
                  )}

                  {/* Border controls */}
                  <div style={{ marginBottom: '15px' }}>
                    <label>Border</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                      <select
                        value={selectedElement.styles?.borderStyle || 'none'}
                        onChange={(e) => updateSelectedElement({ styles: { borderStyle: e.target.value } })}
                        style={{ fontSize: '11px' }}
                      >
                        <option value="none">None</option>
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                        <option value="double">Double</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={selectedElement.styles?.borderWidth?.replace('px','') || '1'}
                        onChange={(e) => updateSelectedElement({ styles: { borderWidth: e.target.value + 'px' } })}
                        style={{ fontSize: '11px' }}
                        placeholder="px"
                      />
                      <input
                        type="color"
                        value={selectedElement.styles?.borderColor || '#6366f1'}
                        onChange={(e) => { const v = e.target.value; debouncedColorUpdate('color_5', () => updateSelectedElement({ styles: { borderColor: v } })); }}
                        style={{ height: '32px', padding: '0', border: 'none', cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  {/* Box Shadow */}
                  <div style={{ marginBottom: '15px' }}>
                    <label>Box Shadow</label>
                    <select
                      value={selectedElement.styles?.boxShadow || 'none'}
                      onChange={(e) => updateSelectedElement({ styles: { boxShadow: e.target.value } })}
                    >
                      <option value="none">None</option>
                      <option value="0 2px 8px rgba(0,0,0,0.15)">Small Shadow</option>
                      <option value="0 4px 20px rgba(0,0,0,0.25)">Medium Shadow</option>
                      <option value="0 10px 40px rgba(0,0,0,0.4)">Large Shadow</option>
                      <option value="0 20px 60px rgba(0,0,0,0.6)">Deep Shadow</option>
                      <option value="0 0 20px rgba(99,102,241,0.5)">Glow (Primary)</option>
                      <option value="inset 0 2px 8px rgba(0,0,0,0.2)">Inner Shadow</option>
                    </select>
                  </div>
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


                {/* ── ADVANCED STYLING ──────────────────────────────── */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px', marginTop: '15px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Advanced Styling</h4>

                  {/* Opacity */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <label>Opacity</label>
                      <span style={{ fontSize: '12px', color: 'var(--primary)' }}>{Math.round((parseFloat(selectedElement.styles?.opacity ?? 1)) * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.01"
                      value={selectedElement.styles?.opacity ?? 1}
                      onChange={(e) => updateSelectedElement({ styles: { opacity: e.target.value } })}
                      style={{ padding: 0 }}
                    />
                  </div>

                  {/* Per-side Padding */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', marginBottom: '6px' }}>Padding (px)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      {[['paddingTop','Top'],['paddingRight','Right'],['paddingBottom','Bottom'],['paddingLeft','Left']].map(([prop, lbl]) => (
                        <div key={prop}>
                          <label style={{ fontSize: '10px', color: '#64748b' }}>{lbl}</label>
                          <input type="number" min="0" max="200"
                            value={String(selectedElement.styles?.[prop] || '0').replace('px','')}
                            onChange={(e) => updateSelectedElement({ styles: { [prop]: e.target.value + 'px' } })}
                            style={{ fontSize: '11px' }} placeholder="0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Per-side Margin */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', marginBottom: '6px' }}>Margin (px)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      {[['marginTop','Top'],['marginRight','Right'],['marginBottom','Bottom'],['marginLeft','Left']].map(([prop, lbl]) => (
                        <div key={prop}>
                          <label style={{ fontSize: '10px', color: '#64748b' }}>{lbl}</label>
                          <input type="number" min="-200" max="200"
                            value={String(selectedElement.styles?.[prop] || '0').replace('px','')}
                            onChange={(e) => updateSelectedElement({ styles: { [prop]: e.target.value + 'px' } })}
                            style={{ fontSize: '11px' }} placeholder="0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Text Shadow */}
                  {['heading','text','button','link'].includes(selectedElement.type) && (
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', marginBottom: '6px' }}>Text Shadow</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px', marginBottom: '6px' }}>
                        {[['X','0'],['Y','1'],['Blur','2']].map(([axis, idx]) => (
                          <div key={axis}>
                            <label style={{ fontSize: '10px', color: '#64748b' }}>{axis} (px)</label>
                            <input type="number" min="-30" max="30"
                              value={parseInt((selectedElement.styles?.textShadow || '0px 0px 0px #000').split(' ')[idx]) || 0}
                              onChange={(e) => {
                                const parts = (selectedElement.styles?.textShadow || '0px 0px 0px #000000').split(' ');
                                while (parts.length < 4) parts.push(parts.length === 3 ? '#000000' : '0px');
                                parts[idx] = e.target.value + 'px';
                                updateSelectedElement({ styles: { textShadow: parts.join(' ') } });
                              }}
                              style={{ fontSize: '11px' }} placeholder="0"
                            />
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '10px', color: '#64748b', flexShrink: 0 }}>Color</label>
                        <input type="color"
                          value={(() => { const ts = selectedElement.styles?.textShadow || ''; const m = ts.match(/#[0-9a-fA-F]{3,6}/); return m ? m[0] : '#000000'; })()}
                          onChange={(e) => {
                            const v = e.target.value;
                            debouncedColorUpdate('ts_color', () => {
                              const parts = (selectedElement.styles?.textShadow || '0px 0px 4px #000000').split(' ');
                              while (parts.length < 4) parts.push('#000000');
                              parts[3] = v;
                              updateSelectedElement({ styles: { textShadow: parts.join(' ') } });
                            });
                          }}
                          style={{ height: '28px', padding: 0, border: 'none', cursor: 'pointer', width: '40px' }}
                        />
                        <button onClick={() => updateSelectedElement({ styles: { textShadow: 'none' } })}
                          style={{ fontSize: '10px', padding: '3px 8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#64748b', cursor: 'pointer' }}>
                          Clear
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Gradient Background */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label>Gradient Background</label>
                      <button onClick={() => updateSelectedElement({ styles: { backgroundImage: 'none' } })}
                        style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#64748b', cursor: 'pointer' }}>
                        Clear
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                      <div>
                        <label style={{ fontSize: '10px', color: '#64748b' }}>From</label>
                        <input type="color"
                          value={(() => { const bg = selectedElement.styles?.backgroundImage || ''; const m = bg.match(/#[0-9a-fA-F]{6}/g); return m ? m[0] : '#6366f1'; })()}
                          onChange={(e) => {
                            const v = e.target.value;
                            debouncedColorUpdate('grad_from', () => {
                              const curr = selectedElement.styles?.backgroundImage || '';
                              const m = curr.match(/#[0-9a-fA-F]{6}/g);
                              const to = m && m[1] ? m[1] : '#ec4899';
                              const dir = (curr.match(/to [\w ]+(?=,)/) || ['to right'])[0];
                              updateSelectedElement({ styles: { backgroundImage: `linear-gradient(${dir}, ${v}, ${to})` } });
                            });
                          }}
                          style={{ height: '32px', padding: 0, border: 'none', cursor: 'pointer', width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', color: '#64748b' }}>To</label>
                        <input type="color"
                          value={(() => { const bg = selectedElement.styles?.backgroundImage || ''; const m = bg.match(/#[0-9a-fA-F]{6}/g); return m && m[1] ? m[1] : '#ec4899'; })()}
                          onChange={(e) => {
                            const v = e.target.value;
                            debouncedColorUpdate('grad_to', () => {
                              const curr = selectedElement.styles?.backgroundImage || '';
                              const m = curr.match(/#[0-9a-fA-F]{6}/g);
                              const from = m ? m[0] : '#6366f1';
                              const dir = (curr.match(/to [\w ]+(?=,)/) || ['to right'])[0];
                              updateSelectedElement({ styles: { backgroundImage: `linear-gradient(${dir}, ${from}, ${v})` } });
                            });
                          }}
                          style={{ height: '32px', padding: 0, border: 'none', cursor: 'pointer', width: '100%' }}
                        />
                      </div>
                    </div>
                    <select
                      value={(() => { const bg = selectedElement.styles?.backgroundImage || ''; const m = bg.match(/to [\w ]+(?=,)/); return m ? m[0] : 'to right'; })()}
                      onChange={(e) => {
                        const curr = selectedElement.styles?.backgroundImage || '';
                        const m = curr.match(/#[0-9a-fA-F]{6}/g);
                        const from = m ? m[0] : '#6366f1';
                        const to = m && m[1] ? m[1] : '#ec4899';
                        updateSelectedElement({ styles: { backgroundImage: `linear-gradient(${e.target.value}, ${from}, ${to})` } });
                      }}
                      style={{ fontSize: '11px', width: '100%' }}
                    >
                      <option value="to right">→ Left to Right</option>
                      <option value="to left">← Right to Left</option>
                      <option value="to bottom">↓ Top to Bottom</option>
                      <option value="to top">↑ Bottom to Top</option>
                      <option value="to bottom right">↘ Diagonal</option>
                      <option value="to bottom left">↙ Diagonal</option>
                    </select>
                  </div>

                  {/* Background Image URL */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Background Image URL</label>
                    <input type="text"
                      value={(() => { const v = selectedElement.styles?.backgroundImage || ''; const m = v.match(/url\(['"]?([^'")\s]+)['"]?\)/); return m ? m[1] : ''; })()}
                      onChange={(e) => {
                        const url = e.target.value.trim();
                        updateSelectedElement({ styles: { backgroundImage: url ? `url('${url}')` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } });
                      }}
                      placeholder="https://…/image.jpg"
                      style={{ fontSize: '11px' }}
                    />
                  </div>

                  {/* Transform */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', marginBottom: '6px' }}>Transform</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <div>
                        <label style={{ fontSize: '10px', color: '#64748b' }}>Rotate (°)</label>
                        <input type="number" min="-360" max="360"
                          value={(() => { const t = selectedElement.styles?.transform || ''; const m = t.match(/rotate\((-?\d+)/); return m ? m[1] : 0; })()}
                          onChange={(e) => {
                            const rot = e.target.value;
                            const curr = (selectedElement.styles?.transform || '').replace(/rotate\([^)]+\)\s*/g, '').trim();
                            updateSelectedElement({ styles: { transform: `${curr} rotate(${rot}deg)`.trim() } });
                          }}
                          style={{ fontSize: '11px' }} placeholder="0"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', color: '#64748b' }}>Scale</label>
                        <input type="number" min="0.1" max="5" step="0.05"
                          value={(() => { const t = selectedElement.styles?.transform || ''; const m = t.match(/scale\(([\d.]+)/); return m ? m[1] : 1; })()}
                          onChange={(e) => {
                            const sc = e.target.value;
                            const curr = (selectedElement.styles?.transform || '').replace(/scale\([^)]+\)\s*/g, '').trim();
                            updateSelectedElement({ styles: { transform: `${curr} scale(${sc})`.trim() } });
                          }}
                          style={{ fontSize: '11px' }} placeholder="1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mix Blend Mode */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Mix Blend Mode</label>
                    <select value={selectedElement.styles?.mixBlendMode || 'normal'}
                      onChange={(e) => updateSelectedElement({ styles: { mixBlendMode: e.target.value } })}
                      style={{ fontSize: '11px' }}>
                      {['normal','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Cursor */}
                  <div style={{ marginBottom: '6px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Cursor Style</label>
                    <select value={selectedElement.styles?.cursor || 'default'}
                      onChange={(e) => updateSelectedElement({ styles: { cursor: e.target.value } })}
                      style={{ fontSize: '11px' }}>
                      {['default','pointer','text','move','grab','not-allowed','crosshair','zoom-in','help','wait'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* ── END ADVANCED STYLING ──────────────────────────── */}


                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px', marginTop: '15px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hover Styling</h4>
                  <p style={{ fontSize: '10px', color: '#64748b', marginBottom: '10px' }}>💡 Hover effects are active in Live Preview mode and on the published site.</p>
                   
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label>Hover Bg Color</label>
                      <input
                        type="color"
                        value={selectedElement.hoverStyles?.backgroundColor || '#6366f1'}
                        onChange={(e) => { const v = e.target.value; debouncedColorUpdate('color_6', () => updateSelectedElement({ hoverStyles: { backgroundColor: v } })); }}
                        style={{ height: '35px', padding: '0', border: 'none', cursor: 'pointer' }}
                      />
                    </div>
                    <div>
                      <label>Hover Text Color</label>
                      <input
                        type="color"
                        value={selectedElement.hoverStyles?.color || '#ffffff'}
                        onChange={(e) => { const v = e.target.value; debouncedColorUpdate('color_7', () => updateSelectedElement({ hoverStyles: { color: v } })); }}
                        style={{ height: '35px', padding: '0', border: 'none', cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label>Hover Scale / Transform</label>
                    <select
                      value={selectedElement.hoverStyles?.transform || 'none'}
                      onChange={(e) => updateSelectedElement({ hoverStyles: { transform: e.target.value } })}
                    >
                      <option value="none">None</option>
                      <option value="scale(1.03)">Zoom In (1.03x) — Subtle</option>
                      <option value="scale(1.05)">Zoom In (1.05x)</option>
                      <option value="scale(1.1)">Zoom In (1.1x) — Strong</option>
                      <option value="scale(0.97)">Zoom Out (0.97x)</option>
                      <option value="scale(0.95)">Zoom Out (0.95x)</option>
                      <option value="translateY(-4px)">Lift Up (4px)</option>
                      <option value="translateY(-8px)">Lift Up (8px)</option>
                      <option value="rotate(3deg)">Tilt Right</option>
                      <option value="rotate(-3deg)">Tilt Left</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label>Hover Box Shadow</label>
                    <select
                      value={selectedElement.hoverStyles?.boxShadow || 'none'}
                      onChange={(e) => updateSelectedElement({ hoverStyles: { boxShadow: e.target.value } })}
                    >
                      <option value="none">None</option>
                      <option value="0 4px 20px rgba(0,0,0,0.2)">Medium Shadow</option>
                      <option value="0 10px 40px rgba(0,0,0,0.35)">Large Shadow</option>
                      <option value="0 0 20px rgba(99,102,241,0.6)">Glow (Primary)</option>
                      <option value="0 0 30px rgba(99,102,241,0.8)">Strong Glow</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label>Hover Opacity</label>
                      <span style={{ fontSize: '12px', color: 'var(--primary)' }}>{Math.round(parseFloat(selectedElement.hoverStyles?.opacity ?? 1) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={selectedElement.hoverStyles?.opacity ?? 1}
                      onChange={(e) => updateSelectedElement({ hoverStyles: { opacity: parseFloat(e.target.value) } })}
                      style={{ padding: 0 }}
                    />
                  </div>

                  <div>
                    <label>Transition Speed (s)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={selectedElement.hoverStyles?.transitionSpeed || '0.3'}
                      onChange={(e) => updateSelectedElement({ hoverStyles: { transitionSpeed: parseFloat(e.target.value) } })}
                    />
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
                      <optgroup label="── Entrance ──">
                        <option value="fadeIn">Fade In</option>
                        <option value="fadeInUp">Fade In Up</option>
                        <option value="fadeInDown">Fade In Down</option>
                        <option value="fadeInLeft">Fade In Left</option>
                        <option value="fadeInRight">Fade In Right</option>
                        <option value="slideUp">Slide Up</option>
                        <option value="slideDown">Slide Down</option>
                        <option value="slideLeft">Slide Left</option>
                        <option value="slideRight">Slide Right</option>
                        <option value="zoomIn">Zoom In</option>
                        <option value="zoomInUp">Zoom In Up</option>
                        <option value="zoomInDown">Zoom In Down</option>
                        <option value="flipInX">Flip In X</option>
                        <option value="flipInY">Flip In Y</option>
                        <option value="rotateIn">Rotate In</option>
                        <option value="rollIn">Roll In</option>
                        <option value="lightSpeedIn">Light Speed In</option>
                        <option value="jackInTheBox">Jack In The Box</option>
                        <option value="expandIn">Expand In</option>
                        <option value="dropIn">Drop In</option>
                      </optgroup>
                      <optgroup label="── Attention ──">
                        <option value="bounce">Bounce</option>
                        <option value="pulse">Pulse</option>
                        <option value="spin">Spin Loop</option>
                        <option value="shake">Shake</option>
                        <option value="wobble">Wobble</option>
                        <option value="rubberBand">Rubber Band</option>
                        <option value="tada">Tada</option>
                        <option value="heartbeat">Heartbeat</option>
                        <option value="jello">Jello</option>
                        <option value="flash">Flash</option>
                        <option value="float">Float</option>
                        <option value="swing">Swing</option>
                        <option value="glitch">Glitch</option>
                        <option value="breathe">Breathe</option>
                      </optgroup>
                      <optgroup label="── Exit ──">
                        <option value="fadeOut">Fade Out</option>
                        <option value="fadeOutUp">Fade Out Up</option>
                        <option value="fadeOutDown">Fade Out Down</option>
                        <option value="zoomOut">Zoom Out</option>
                        <option value="slideOutLeft">Slide Out Left</option>
                        <option value="slideOutRight">Slide Out Right</option>
                      </optgroup>
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
                      <optgroup label="── Navigation ──">
                        <option value="url">🔗 External URL</option>
                        <option value="page">📄 Internal Page</option>
                        <option value="anchor">⚓ Scroll to Anchor (#id)</option>
                        <option value="email">✉️ Email (mailto:)</option>
                      </optgroup>
                      <optgroup label="── Overlays & Drawers ──">
                        <option value="drawer">🗂️ Open Side Drawer</option>
                        <option value="popup_modal">🪟 Open Custom Modal</option>
                        <option value="form">📬 Open Contact Form Modal</option>
                      </optgroup>
                      <optgroup label="── Dynamic Interactions ──">
                        <option value="toast">🔔 Show Toast Notification</option>
                        <option value="copy_text">📋 Copy Text to Clipboard</option>
                        <option value="toggle_element">👁️ Show / Hide an Element</option>
                        <option value="scroll_top">⬆️ Scroll to Top</option>
                        <option value="toggle_theme">🌗 Toggle Dark / Light Theme</option>
                        <option value="confetti">🎉 Confetti Celebration</option>
                      </optgroup>
                      <optgroup label="── Forms ──">
                        <option value="submit_inputs">📤 Submit Inputs to Backend</option>
                      </optgroup>
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

                  {/* ── DRAWER CONFIG ── */}
                  {selectedElement.action?.type === 'drawer' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label>Drawer Alignment / Side</label>
                        <select
                          value={selectedElement.action?.drawerSide || 'right'}
                          onChange={(e) => updateSelectedElement({ action: { drawerSide: e.target.value } })}
                        >
                          <option value="right">Right Side Drawer →</option>
                          <option value="left">← Left Side Drawer</option>
                        </select>
                      </div>

                      <div>
                        <label>Drawer Width</label>
                        <select
                          value={selectedElement.action?.drawerWidth || '380px'}
                          onChange={(e) => updateSelectedElement({ action: { drawerWidth: e.target.value } })}
                        >
                          <option value="320px">Compact (320px)</option>
                          <option value="380px">Standard (380px)</option>
                          <option value="480px">Wide (480px)</option>
                          <option value="600px">Extra Wide (600px)</option>
                          <option value="100vw">Full Screen Overlay (100%)</option>
                        </select>
                      </div>

                      <div>
                        <label>Background Color</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="color"
                            value={selectedElement.action?.drawerBg || '#1e293b'}
                            onChange={(e) => updateSelectedElement({ action: { drawerBg: e.target.value } })}
                            style={{ width: '44px', height: '36px', padding: '2px', borderRadius: '6px', cursor: 'pointer', background: 'none', border: '1px solid var(--border)' }}
                          />
                          <input
                            type="text"
                            value={selectedElement.action?.drawerBg || '#1e293b'}
                            onChange={(e) => updateSelectedElement({ action: { drawerBg: e.target.value } })}
                          />
                        </div>
                      </div>

                      <div>
                        <label>Text Color</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="color"
                            value={selectedElement.action?.drawerTextColor || '#f1f5f9'}
                            onChange={(e) => updateSelectedElement({ action: { drawerTextColor: e.target.value } })}
                            style={{ width: '44px', height: '36px', padding: '2px', borderRadius: '6px', cursor: 'pointer', background: 'none', border: '1px solid var(--border)' }}
                          />
                          <input
                            type="text"
                            value={selectedElement.action?.drawerTextColor || '#f1f5f9'}
                            onChange={(e) => updateSelectedElement({ action: { drawerTextColor: e.target.value } })}
                          />
                        </div>
                      </div>

                      <div>
                        <label>Drawer Title</label>
                        <input
                          type="text"
                          value={selectedElement.action?.drawerTitle ?? 'Side Panel'}
                          onChange={(e) => updateSelectedElement({ action: { drawerTitle: e.target.value } })}
                          placeholder="Side Panel Title"
                        />
                      </div>

                      <div>
                        <label style={{ marginBottom: '6px', display: 'block', fontWeight: 'bold' }}>Drawer Content Elements</label>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>
                          Add text, images, links, buttons, or dividers. Fully customize each element's look.
                        </span>

                        {(selectedElement.action?.drawerItems || [
                          { id: 1, type: 'text', content: 'Welcome to the side panel!', styles: {} },
                          { id: 2, type: 'divider', content: '' },
                          { id: 3, type: 'link', content: 'Home | /', styles: {} },
                          { id: 4, type: 'link', content: 'Contact Us | /contact', styles: {} }
                        ]).map((item, idx) => {
                          const getItems = () => selectedElement.action?.drawerItems || [
                            { id: 1, type: 'text', content: 'Welcome to the side panel!', styles: {} },
                            { id: 2, type: 'divider', content: '' },
                            { id: 3, type: 'link', content: 'Home | /', styles: {} },
                            { id: 4, type: 'link', content: 'Contact Us | /contact', styles: {} }
                          ];
                          const updateItem = (patch) => {
                            const updated = [...getItems()];
                            updated[idx] = { ...updated[idx], ...patch };
                            updateSelectedElement({ action: { drawerItems: updated } });
                          };
                          const updateItemStyle = (stylePatch) => {
                            const updated = [...getItems()];
                            updated[idx] = { ...updated[idx], styles: { ...(updated[idx].styles || {}), ...stylePatch } };
                            updateSelectedElement({ action: { drawerItems: updated } });
                          };
                          const s = item.styles || {};

                          return (
                            <div key={item.id || idx} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px', marginBottom: '10px', border: '1px solid var(--border)' }}>
                              {/* Row 1: Type selector + Delete */}
                              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', alignItems: 'center' }}>
                                <select
                                  value={item.type}
                                  onChange={(e) => updateItem({ type: e.target.value, content: '' })}
                                  style={{ flex: 1, fontSize: '11px' }}
                                >
                                  <option value="text">📝 Text / Paragraph</option>
                                  <option value="heading">🔤 Heading</option>
                                  <option value="image">🖼️ Image</option>
                                  <option value="link">🔗 Navigation Link</option>
                                  <option value="button">🔘 Button</option>
                                  <option value="divider">➖ Divider</option>
                                  <option value="spacer">⬜ Spacer</option>
                                </select>
                                <button
                                  onClick={() => {
                                    const updated = getItems().filter((_, i) => i !== idx);
                                    updateSelectedElement({ action: { drawerItems: updated } });
                                  }}
                                  style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', flexShrink: 0 }}
                                  title="Remove item"
                                >✕</button>
                              </div>

                              {/* IMAGE */}
                              {item.type === 'image' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {item.content && (
                                    <img src={item.content} alt="" style={{ width: '100%', maxHeight: '100px', objectFit: 'cover', borderRadius: '6px', marginBottom: '4px' }} />
                                  )}
                                  <label style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>📁 Upload from Device</label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    style={{ fontSize: '11px' }}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      const reader = new FileReader();
                                      reader.onload = (ev) => updateItem({ content: ev.target.result });
                                      reader.readAsDataURL(file);
                                    }}
                                  />
                                  <label style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>🔗 Or Paste Image URL</label>
                                  <input
                                    type="text"
                                    value={item.content?.startsWith('data:') ? '' : (item.content || '')}
                                    onChange={(e) => updateItem({ content: e.target.value })}
                                    placeholder="https://example.com/photo.jpg"
                                    style={{ fontSize: '11px' }}
                                  />
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px' }}>
                                    <div>
                                      <label style={{ fontSize: '10px' }}>Border Radius</label>
                                      <select value={s.borderRadius || '8px'} onChange={(e) => updateItemStyle({ borderRadius: e.target.value })} style={{ fontSize: '10px' }}>
                                        <option value="0px">None</option>
                                        <option value="4px">Small</option>
                                        <option value="8px">Medium</option>
                                        <option value="16px">Large</option>
                                        <option value="50%">Circle</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '10px' }}>Object Fit</label>
                                      <select value={s.objectFit || 'cover'} onChange={(e) => updateItemStyle({ objectFit: e.target.value })} style={{ fontSize: '10px' }}>
                                        <option value="cover">Cover</option>
                                        <option value="contain">Contain</option>
                                        <option value="fill">Fill</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div>
                                    <label style={{ fontSize: '10px' }}>Max Height (px)</label>
                                    <input type="number" value={parseInt(s.maxHeight) || 240} onChange={(e) => updateItemStyle({ maxHeight: e.target.value + 'px' })} style={{ fontSize: '11px' }} />
                                  </div>
                                </div>
                              )}

                              {/* TEXT or HEADING */}
                              {(item.type === 'text' || item.type === 'heading') && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <textarea
                                    value={item.content || ''}
                                    onChange={(e) => updateItem({ content: e.target.value })}
                                    rows={3}
                                    placeholder={item.type === 'heading' ? 'Heading text...' : 'Paragraph text...'}
                                    style={{ fontSize: '11px', resize: 'vertical', padding: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text)' }}
                                  />
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                    <div>
                                      <label style={{ fontSize: '10px' }}>Font Size</label>
                                      <input type="text" value={s.fontSize || (item.type === 'heading' ? '20px' : '14px')} onChange={(e) => updateItemStyle({ fontSize: e.target.value })} placeholder="14px" style={{ fontSize: '11px' }} />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '10px' }}>Font Weight</label>
                                      <select value={s.fontWeight || (item.type === 'heading' ? '700' : '400')} onChange={(e) => updateItemStyle({ fontWeight: e.target.value })} style={{ fontSize: '10px' }}>
                                        <option value="300">Light</option>
                                        <option value="400">Regular</option>
                                        <option value="500">Medium</option>
                                        <option value="600">Semi Bold</option>
                                        <option value="700">Bold</option>
                                        <option value="800">Extra Bold</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <label style={{ fontSize: '10px', flexShrink: 0 }}>Color</label>
                                    <input type="color" value={s.color || '#f1f5f9'} onChange={(e) => updateItemStyle({ color: e.target.value })} style={{ width: '36px', height: '28px', padding: '1px', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', background: 'none' }} />
                                    <input type="text" value={s.color || '#f1f5f9'} onChange={(e) => updateItemStyle({ color: e.target.value })} style={{ fontSize: '11px', flex: 1 }} />
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                    <div>
                                      <label style={{ fontSize: '10px' }}>Text Align</label>
                                      <select value={s.textAlign || 'left'} onChange={(e) => updateItemStyle({ textAlign: e.target.value })} style={{ fontSize: '10px' }}>
                                        <option value="left">Left</option>
                                        <option value="center">Center</option>
                                        <option value="right">Right</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '10px' }}>Line Height</label>
                                      <input type="text" value={s.lineHeight || '1.6'} onChange={(e) => updateItemStyle({ lineHeight: e.target.value })} style={{ fontSize: '11px' }} />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* LINK */}
                              {item.type === 'link' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <label style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Label and URL (format: Label | URL)</label>
                                  <input type="text" value={item.content || ''} onChange={(e) => updateItem({ content: e.target.value })} placeholder="About Us | /about" style={{ fontSize: '11px' }} />
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                    <div>
                                      <label style={{ fontSize: '10px' }}>Font Size</label>
                                      <input type="text" value={s.fontSize || '14px'} onChange={(e) => updateItemStyle({ fontSize: e.target.value })} style={{ fontSize: '11px' }} />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '10px' }}>Font Weight</label>
                                      <select value={s.fontWeight || '500'} onChange={(e) => updateItemStyle({ fontWeight: e.target.value })} style={{ fontSize: '10px' }}>
                                        <option value="400">Regular</option>
                                        <option value="500">Medium</option>
                                        <option value="600">Semi Bold</option>
                                        <option value="700">Bold</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <label style={{ fontSize: '10px', flexShrink: 0 }}>Text Color</label>
                                    <input type="color" value={s.color || '#f1f5f9'} onChange={(e) => updateItemStyle({ color: e.target.value })} style={{ width: '36px', height: '28px', padding: '1px', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', background: 'none' }} />
                                    <input type="text" value={s.color || '#f1f5f9'} onChange={(e) => updateItemStyle({ color: e.target.value })} style={{ fontSize: '11px', flex: 1 }} />
                                  </div>
                                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <label style={{ fontSize: '10px', flexShrink: 0 }}>Bg Color</label>
                                    <input type="color" value={s.background || 'rgba(255,255,255,0.06)'} onChange={(e) => updateItemStyle({ background: e.target.value })} style={{ width: '36px', height: '28px', padding: '1px', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', background: 'none' }} />
                                    <input type="text" value={s.background || 'rgba(255,255,255,0.06)'} onChange={(e) => updateItemStyle({ background: e.target.value })} style={{ fontSize: '11px', flex: 1 }} />
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                    <div>
                                      <label style={{ fontSize: '10px' }}>Border Radius</label>
                                      <input type="text" value={s.borderRadius || '8px'} onChange={(e) => updateItemStyle({ borderRadius: e.target.value })} style={{ fontSize: '11px' }} />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '10px' }}>Padding</label>
                                      <input type="text" value={s.padding || '12px 16px'} onChange={(e) => updateItemStyle({ padding: e.target.value })} style={{ fontSize: '11px' }} />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* BUTTON */}
                              {item.type === 'button' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <label style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Button Label</label>
                                  <input type="text" value={item.content || ''} onChange={(e) => updateItem({ content: e.target.value })} placeholder="Click Me" style={{ fontSize: '11px' }} />
                                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <label style={{ fontSize: '10px', flexShrink: 0 }}>Bg Color</label>
                                    <input type="color" value={s.background || '#6366f1'} onChange={(e) => updateItemStyle({ background: e.target.value })} style={{ width: '36px', height: '28px', padding: '1px', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', background: 'none' }} />
                                    <input type="text" value={s.background || '#6366f1'} onChange={(e) => updateItemStyle({ background: e.target.value })} style={{ fontSize: '11px', flex: 1 }} />
                                  </div>
                                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <label style={{ fontSize: '10px', flexShrink: 0 }}>Text Color</label>
                                    <input type="color" value={s.color || '#ffffff'} onChange={(e) => updateItemStyle({ color: e.target.value })} style={{ width: '36px', height: '28px', padding: '1px', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', background: 'none' }} />
                                    <input type="text" value={s.color || '#ffffff'} onChange={(e) => updateItemStyle({ color: e.target.value })} style={{ fontSize: '11px', flex: 1 }} />
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                    <div>
                                      <label style={{ fontSize: '10px' }}>Border Radius</label>
                                      <input type="text" value={s.borderRadius || '8px'} onChange={(e) => updateItemStyle({ borderRadius: e.target.value })} style={{ fontSize: '11px' }} />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '10px' }}>Font Size</label>
                                      <input type="text" value={s.fontSize || '14px'} onChange={(e) => updateItemStyle({ fontSize: e.target.value })} style={{ fontSize: '11px' }} />
                                    </div>
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                    <div>
                                      <label style={{ fontSize: '10px' }}>Padding</label>
                                      <input type="text" value={s.padding || '12px 16px'} onChange={(e) => updateItemStyle({ padding: e.target.value })} style={{ fontSize: '11px' }} />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '10px' }}>Font Weight</label>
                                      <select value={s.fontWeight || '600'} onChange={(e) => updateItemStyle({ fontWeight: e.target.value })} style={{ fontSize: '10px' }}>
                                        <option value="400">Regular</option>
                                        <option value="500">Medium</option>
                                        <option value="600">Semi Bold</option>
                                        <option value="700">Bold</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div>
                                    <label style={{ fontSize: '10px' }}>On Click URL (optional)</label>
                                    <input type="text" value={item.href || ''} onChange={(e) => updateItem({ href: e.target.value })} placeholder="https://..." style={{ fontSize: '11px' }} />
                                  </div>
                                </div>
                              )}

                              {/* DIVIDER */}
                              {item.type === 'divider' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                  <div>
                                    <label style={{ fontSize: '10px' }}>Color</label>
                                    <input type="color" value={s.borderColor || 'rgba(255,255,255,0.12)'} onChange={(e) => updateItemStyle({ borderColor: e.target.value })} style={{ width: '100%', height: '28px', padding: '1px', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', background: 'none' }} />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: '10px' }}>Thickness</label>
                                    <input type="text" value={s.borderTopWidth || '1px'} onChange={(e) => updateItemStyle({ borderTopWidth: e.target.value })} placeholder="1px" style={{ fontSize: '11px' }} />
                                  </div>
                                </div>
                              )}

                              {/* SPACER */}
                              {item.type === 'spacer' && (
                                <div>
                                  <label style={{ fontSize: '10px' }}>Height</label>
                                  <input type="text" value={s.height || '24px'} onChange={(e) => updateItemStyle({ height: e.target.value })} placeholder="24px" style={{ fontSize: '11px' }} />
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Add Item Buttons */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginTop: '4px' }}>
                          {[
                            { type: 'text', label: '📝 Text', defaults: { content: 'New text block', styles: {} } },
                            { type: 'heading', label: '🔤 Heading', defaults: { content: 'Section Heading', styles: { fontSize: '20px', fontWeight: '700' } } },
                            { type: 'image', label: '🖼️ Image', defaults: { content: '', styles: {} } },
                            { type: 'link', label: '🔗 Link', defaults: { content: 'Label | /', styles: {} } },
                            { type: 'button', label: '🔘 Button', defaults: { content: 'Click Me', styles: {} } },
                            { type: 'divider', label: '➖ Divider', defaults: { content: '', styles: {} } },
                          ].map(({ type, label, defaults }) => (
                            <button
                              key={type}
                              onClick={() => {
                                const currentItems = selectedElement.action?.drawerItems || [];
                                updateSelectedElement({
                                  action: { drawerItems: [...currentItems, { id: Date.now(), type, ...defaults }] }
                                });
                              }}
                              style={{ padding: '5px 4px', background: 'rgba(99,102,241,0.12)', border: '1px dashed rgba(99,102,241,0.35)', color: '#818cf8', borderRadius: '5px', cursor: 'pointer', fontSize: '10px', fontWeight: '600' }}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveDrawerEl(selectedElement)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                          marginTop: '6px'
                        }}
                      >
                        👁️ Test Open Side Drawer Now
                      </button>
                    </div>
                  )}

                  {/* ── TOAST CONFIG ── */}
                  {selectedElement.action?.type === 'toast' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label>Notification Message</label>
                        <input
                          type="text"
                          value={selectedElement.action?.toastMessage || 'Action completed successfully!'}
                          onChange={(e) => updateSelectedElement({ action: { toastMessage: e.target.value } })}
                          placeholder="Your message..."
                        />
                      </div>
                      <div>
                        <label>Toast Style</label>
                        <select
                          value={selectedElement.action?.toastStyle || 'info'}
                          onChange={(e) => updateSelectedElement({ action: { toastStyle: e.target.value } })}
                        >
                          <option value="info">ℹ️ Info (Blue)</option>
                          <option value="success">✅ Success (Green)</option>
                          <option value="error">❌ Error (Red)</option>
                          <option value="warning">⚠️ Warning (Yellow)</option>
                          <option value="dark">🌑 Dark Theme</option>
                        </select>
                      </div>
                      <div>
                        <label>Screen Position</label>
                        <select
                          value={selectedElement.action?.toastPosition || 'bottom-right'}
                          onChange={(e) => updateSelectedElement({ action: { toastPosition: e.target.value } })}
                        >
                          <option value="top-left">Top Left</option>
                          <option value="top-center">Top Center</option>
                          <option value="top-right">Top Right</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="bottom-center">Bottom Center</option>
                          <option value="bottom-right">Bottom Right</option>
                        </select>
                      </div>
                      <div>
                        <label>Duration (ms)</label>
                        <input
                          type="number"
                          min="1000"
                          max="10000"
                          step="500"
                          value={selectedElement.action?.toastDuration || 3000}
                          onChange={(e) => updateSelectedElement({ action: { toastDuration: parseInt(e.target.value) || 3000 } })}
                        />
                      </div>
                    </div>
                  )}

                  {/* ── POPUP MODAL CONFIG ── */}
                  {selectedElement.action?.type === 'popup_modal' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label>Modal Title</label>
                        <input
                          type="text"
                          value={selectedElement.action?.modalTitle || 'Special Announcement'}
                          onChange={(e) => updateSelectedElement({ action: { modalTitle: e.target.value } })}
                          placeholder="Modal Title"
                        />
                      </div>
                      <div>
                        <label>Modal Content Body</label>
                        <textarea
                          rows={4}
                          value={selectedElement.action?.modalContent || 'Write your modal description or instructions here.'}
                          onChange={(e) => updateSelectedElement({ action: { modalContent: e.target.value } })}
                          placeholder="Write your modal content here..."
                          style={{ resize: 'vertical' }}
                        />
                      </div>
                      <div>
                        <label>Banner Image URL (Optional)</label>
                        <input
                          type="text"
                          value={selectedElement.action?.modalImage || ''}
                          onChange={(e) => updateSelectedElement({ action: { modalImage: e.target.value } })}
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>
                      <div>
                        <label>Close Button Text</label>
                        <input
                          type="text"
                          value={selectedElement.action?.modalCloseLabel || 'Got it!'}
                          onChange={(e) => updateSelectedElement({ action: { modalCloseLabel: e.target.value } })}
                          placeholder="Got it!"
                        />
                      </div>
                      <div>
                        <label>Modal Background Color</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="color"
                            value={selectedElement.action?.modalBg || '#1e293b'}
                            onChange={(e) => updateSelectedElement({ action: { modalBg: e.target.value } })}
                            style={{ width: '44px', height: '36px', padding: '2px', borderRadius: '6px', cursor: 'pointer', background: 'none', border: '1px solid var(--border)' }}
                          />
                          <input
                            type="text"
                            value={selectedElement.action?.modalBg || '#1e293b'}
                            onChange={(e) => updateSelectedElement({ action: { modalBg: e.target.value } })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── COPY TEXT CONFIG ── */}
                  {selectedElement.action?.type === 'copy_text' && (
                    <div style={{ marginBottom: '12px' }}>
                      <label>Text Content to Copy</label>
                      <textarea
                        rows={3}
                        value={selectedElement.action?.copyText || ''}
                        onChange={(e) => updateSelectedElement({ action: { copyText: e.target.value } })}
                        placeholder="Text to copy to user's clipboard..."
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                  )}

                  {/* ── TOGGLE ELEMENT CONFIG ── */}
                  {selectedElement.action?.type === 'toggle_element' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label>Target Element ID</label>
                        <input
                          type="text"
                          value={selectedElement.action?.toggleTargetId || ''}
                          onChange={(e) => updateSelectedElement({ action: { toggleTargetId: e.target.value } })}
                          placeholder="e.g. element_1700000000"
                        />
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                          Enter the element ID to toggle visibility.
                        </span>
                      </div>
                      <div>
                        <label>Behavior</label>
                        <select
                          value={selectedElement.action?.toggleBehavior || 'toggle'}
                          onChange={(e) => updateSelectedElement({ action: { toggleBehavior: e.target.value } })}
                        >
                          <option value="toggle">Toggle Visibility (Show/Hide)</option>
                          <option value="show">Force Show</option>
                          <option value="hide">Force Hide</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* ── INFO BOXES FOR SIMPLE INTERACTIONS ── */}
                  {(selectedElement.action?.type === 'scroll_top' || selectedElement.action?.type === 'toggle_theme' || selectedElement.action?.type === 'confetti') && (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px', padding: '10px', background: 'rgba(99,102,241,0.08)', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)' }}>
                      {selectedElement.action?.type === 'scroll_top' && '⬆️ Smoothly scrolls page back to top when clicked.'}
                      {selectedElement.action?.type === 'toggle_theme' && '🌗 Toggles between Dark & Light mode when clicked.'}
                      {selectedElement.action?.type === 'confetti' && '🎉 Triggers an animated festive confetti celebration explosion!'}
                    </div>
                  )}
                </div>
              </div>
            ) : selectedSectionId ? (() => {
              const sec = activeLayout.find(s => s.id === selectedSectionId);
              if (!sec) return null;
              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold' }}>Section Settings</h3>
                    <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 'bold', padding: '2px 6px', background: 'var(--primary-glow)', borderRadius: '4px' }}>SECTION</span>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Spacing & Size</h4>
                    <div style={{ marginBottom: '12px' }}>
                      <label>Padding Top (px)</label>
                      <input 
                        type="number" 
                        value={sec.settings?.paddingTop || '120'} 
                        onChange={(e) => {
                          const val = e.target.value;
                          const nextLayout = activeLayout.map(s => s.id === sec.id ? { ...s, settings: { ...s.settings, paddingTop: val } } : s);
                          updateLayout(nextLayout);
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label>Padding Bottom (px)</label>
                      <input 
                        type="number" 
                        value={sec.settings?.paddingBottom || '120'} 
                        onChange={(e) => {
                          const val = e.target.value;
                          const nextLayout = activeLayout.map(s => s.id === sec.id ? { ...s, settings: { ...s.settings, paddingBottom: val } } : s);
                          updateLayout(nextLayout);
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label>Container Max Width (px / %)</label>
                      <input 
                        type="text" 
                        value={sec.settings?.containerWidth || '1200px'} 
                        onChange={(e) => {
                          const val = e.target.value;
                          const nextLayout = activeLayout.map(s => s.id === sec.id ? { ...s, settings: { ...s.settings, containerWidth: val } } : s);
                          updateLayout(nextLayout);
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Background Color</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <input
                        type="checkbox"
                        checked={sec.settings?.useGlobalBackground !== false}
                        onChange={(e) => {
                          const val = e.target.checked;
                          const nextLayout = activeLayout.map(s => s.id === sec.id ? { ...s, settings: { ...s.settings, useGlobalBackground: val } } : s);
                          updateLayout(nextLayout);
                        }}
                        id="secGlobalBg"
                        style={{ width: 'auto', cursor: 'pointer' }}
                      />
                      <label htmlFor="secGlobalBg" style={{ margin: 0, cursor: 'pointer' }}>Match Page Background</label>
                    </div>
                    {sec.settings?.useGlobalBackground === false && (
                      <div style={{ marginBottom: '12px' }}>
                        <label>Custom Color</label>
                        <input
                          type="color"
                          value={sec.settings?.backgroundColor || '#1e293b'}
                          onChange={(e) => {
                            const val = e.target.value;
                            const nextLayout = activeLayout.map(s => s.id === sec.id ? { ...s, settings: { ...s.settings, backgroundColor: val } } : s);
                            updateLayout(nextLayout);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '20px' }}>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this section?')) {
                          handleDeleteSection(sec.id);
                          setSelectedSectionId(null);
                        }
                      }}
                      className="btn-danger"
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '6px', fontWeight: 'bold' }}
                    >
                      <Trash2 size={16} /> Delete Section
                    </button>
                  </div>
                </div>
              );
            })() : (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-secondary)' }}>
                <Settings size={36} style={{ marginBottom: '15px', color: 'var(--text-muted)' }} />
                <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>Inspector Panel</h4>
                <p style={{ fontSize: '12px', lineHeight: '1.4' }}>
                  Select any element on the design canvas to configure content and styles here.
                  <br /><br />
                  <strong>Quick Tips:</strong>
                  <br />• Click a section background to configure section settings
                  <br />• Click + hold <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Shift</span> to multi-select elements
                  <br />• Drag on canvas to lasso select multiple items
                  <br />• Use the toolbar above for instant actions
                </p>
              </div>
            )}
          </aside>
          </>
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
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px', overflowY: 'auto'
        }}>
          <div className="glass" style={{ width: '100%', maxWidth: '640px', padding: '35px', borderRadius: 'var(--radius-lg)', position: 'relative' }}>
            <button onClick={() => setShowPublishModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <CheckCircle size={40} style={{ color: '#22c55e', flexShrink: 0 }} />
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>Website is Published! 🚀</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Your site is live on your local server. Follow the guide below to deploy it publicly.</p>
              </div>
            </div>

            {/* Local preview */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px', textTransform: 'uppercase' }}>Local Preview URL</div>
                <code style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 'bold' }}>http://localhost:8001/live/{site.subdomain}/</code>
              </div>
              <a href={`/live/${site.subdomain}/`} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '6px 14px', fontSize: '12px', textDecoration: 'none', flexShrink: 0 }}>
                Open Site ↗
              </a>
            </div>

            {/* Option 1: Export + Netlify */}
            <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#22c55e', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🌐 Option 1 — Free Hosting (Netlify / Vercel) <span style={{ fontSize: '10px', background: 'rgba(34,197,94,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Recommended for Colleagues</span>
              </h4>
              <ol style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '2', paddingLeft: '20px', margin: 0 }}>
                <li>Click <strong style={{ color: '#fff' }}>⬇ Export ZIP</strong> in the toolbar to download your website files</li>
                <li>Go to <strong style={{ color: '#6366f1' }}>app.netlify.com</strong> → "Add new site" → "Deploy manually"</li>
                <li>Drag and drop your ZIP file into the Netlify deploy area</li>
                <li>Netlify gives you a free public URL like <code>yoursite.netlify.app</code> in seconds!</li>
                <li>Share this link with your colleagues — no server needed ✓</li>
              </ol>
            </div>

            {/* Option 2: VPS */}
            <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '10px' }}>
                🖥️ Option 2 — Your Own VPS / Cloud Server
              </h4>
              <ol style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '2', paddingLeft: '20px', margin: 0 }}>
                <li>Get a VPS from <strong style={{ color: '#fff' }}>DigitalOcean, Hetzner, or AWS Lightsail</strong> (from $5/month)</li>
                <li>Install Nginx: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: '3px' }}>sudo apt install nginx</code></li>
                <li>Export ZIP → upload and extract to <code>/var/www/yoursite/</code></li>
                <li>Point your Nginx <code>root</code> to that folder and restart: <code>sudo systemctl restart nginx</code></li>
                <li>Visit your server IP in a browser — your site is live!</li>
              </ol>
            </div>

            {/* Option 3: Custom Domain */}
            <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '10px' }}>
                🔗 Option 3 — Add a Custom Domain (yourcompany.com)
              </h4>
              <ol style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '2', paddingLeft: '20px', margin: 0 }}>
                <li>Buy a domain from <strong style={{ color: '#fff' }}>Namecheap, GoDaddy, or Google Domains</strong></li>
                <li>In your DNS settings, add an <strong style={{ color: '#fff' }}>A record</strong> pointing to your server IP</li>
                <li>On Netlify: go to Site Settings → Custom Domains → Add domain</li>
                <li>Enable free HTTPS via <strong style={{ color: '#fff' }}>Let's Encrypt</strong> with one click</li>
                <li>Done! Your site is accessible at <code>https://yourcompany.com</code> ✓</li>
              </ol>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={exportProjectToDevice} className="btn-secondary" style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ⬇ Export ZIP
              </button>
              <button onClick={() => setShowPublishModal(false)} className="btn-primary" style={{ padding: '10px 24px' }}>
                Got it!
              </button>
            </div>
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
        <div className="modal-overlay active" style={{
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

      {/* ===== SIDE DRAWER OVERLAY ===== */}
      {activeDrawerEl && (() => {
        const a = activeDrawerEl.action || {};
        const side = a.drawerSide || 'right';
        const width = a.drawerWidth || '380px';
        const bg = a.drawerBg || '#1e293b';
        const textColor = a.drawerTextColor || '#f1f5f9';
        const title = a.drawerTitle ?? 'Side Panel';
        const items = a.drawerItems || [
          { id: 1, type: 'text', content: 'Welcome to the side panel!' },
          { id: 2, type: 'divider', content: '' },
          { id: 3, type: 'link', content: 'Home | /' },
          { id: 4, type: 'link', content: 'Contact Us | /contact' }
        ];

        return (
          <>
            {/* Backdrop Blur */}
            <div
              onClick={() => setActiveDrawerEl(null)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 9990,
                backdropFilter: 'blur(6px)',
                transition: 'opacity 0.25s'
              }}
            />

            {/* Slide Drawer Panel */}
            <div style={{
              position: 'fixed',
              top: 0,
              [side]: 0,
              width: width,
              maxWidth: '100vw',
              height: '100vh',
              background: bg,
              color: textColor,
              zIndex: 9991,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: side === 'right' ? '-10px 0 60px rgba(0,0,0,0.5)' : '10px 0 60px rgba(0,0,0,0.5)',
              transition: 'transform 0.3s ease-in-out',
              fontFamily: 'sans-serif'
            }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: textColor }}>{title}</h2>
                <button
                  onClick={() => setActiveDrawerEl(null)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: textColor,
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >✕</button>
              </div>

              {/* Body Content Items */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {items.map((item, idx) => {
                  if (item.type === 'divider') {
                    return <hr key={idx} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.12)', margin: '8px 0' }} />;
                  }
                  if (item.type === 'image') {
                    return (
                      <img
                        key={idx}
                        src={item.content || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600'}
                        alt=""
                        style={{ width: '100%', borderRadius: '10px', objectFit: 'cover', maxHeight: '240px' }}
                      />
                    );
                  }
                  if (item.type === 'link') {
                    const parts = (item.content || '').split('|');
                    const label = parts[0]?.trim() || 'Link Item';
                    const url = parts[1]?.trim() || '#';
                    return (
                      <a
                        key={idx}
                        href={url}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'space-between',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          background: 'rgba(255,255,255,0.06)',
                          color: textColor,
                          textDecoration: 'none',
                          fontWeight: 500,
                          fontSize: '14px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                      >
                        <span>{label}</span>
                        <span>→</span>
                      </a>
                    );
                  }
                  if (item.type === 'button') {
                    return (
                      <button
                        key={idx}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          background: 'var(--primary, #6366f1)',
                          color: '#ffffff',
                          border: 'none',
                          fontWeight: 600,
                          fontSize: '14px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 14px rgba(99,102,241,0.4)'
                        }}
                      >
                        {item.content || 'Click Me'}
                      </button>
                    );
                  }
                  return (
                    <p key={idx} style={{ margin: 0, fontSize: '15px', lineHeight: 1.6, color: textColor, opacity: 0.9 }}>
                      {item.content}
                    </p>
                  );
                })}
              </div>
            </div>
          </>
        );
      })()}

      {/* ===== POPUP MODAL OVERLAY ===== */}
      {activeModalEl && (() => {
        const a = activeModalEl.action || {};
        const bg = a.modalBg || '#1e293b';
        return (
          <div
            onClick={(e) => { if (e.target === e.currentTarget) setActiveModalEl(null); }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 9992,
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              padding: '24px',
              backdropFilter: 'blur(8px)',
              fontFamily: 'sans-serif'
            }}
          >
            <div style={{
              background: bg,
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '480px',
              width: '100%',
              color: '#f1f5f9',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
              position: 'relative'
            }}>
              <button
                onClick={() => setActiveModalEl(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#f1f5f9',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center'
                }}
              >✕</button>
              {a.modalImage && (
                <img src={a.modalImage} alt="" style={{ width: '100%', borderRadius: '10px', marginBottom: '20px', maxHeight: '200px', objectFit: 'cover' }} />
              )}
              <h2 style={{ margin: '0 0 12px', fontSize: '22px', fontWeight: 700 }}>{a.modalTitle || 'Special Announcement'}</h2>
              <p style={{ margin: '0 0 24px', fontSize: '15px', lineHeight: 1.7, opacity: 0.85 }}>{a.modalContent || 'Modal description content.'}</p>
              <button
                onClick={() => setActiveModalEl(null)}
                style={{
                  padding: '11px 24px',
                  background: '#6366f1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px',
                  boxShadow: '0 4px 14px rgba(99,102,241,0.4)'
                }}
              >
                {a.modalCloseLabel || 'Close'}
              </button>
            </div>
          </div>
        );
      })()}

      {/* ===== RIGHT-CLICK CONTEXT MENU ===== */}
      {contextMenu && !isPreview && (
        <div
          onClick={() => setContextMenu(null)}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9998 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              zIndex: 9999,
              background: 'rgba(15, 23, 42, 0.97)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              padding: '6px',
              minWidth: '200px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            }}
          >
            {(() => {
              const menuItem = (icon, label, onClick, danger = false, disabled = false) => (
                <button
                  onClick={() => { if (!disabled) { onClick(); setContextMenu(null); } }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    width: '100%', padding: '8px 12px',
                    background: 'none', border: 'none',
                    color: danger ? '#ef4444' : disabled ? '#475569' : '#e2e8f0',
                    fontSize: '12px', textAlign: 'left', cursor: disabled ? 'not-allowed' : 'pointer',
                    borderRadius: '6px', fontFamily: 'sans-serif', transition: 'background 0.1s'
                  }}
                  onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.08)'; }}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ fontSize: '14px' }}>{icon}</span>
                  {label}
                </button>
              );
              const sep = <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />;
              const targetEl = activeLayout.flatMap(s => s.elements || []).find(e => e.id === contextMenu.elementId);

              return (
                <>
                  {menuItem('⬆', 'Bring to Front', () => {
                    let maxZ = 10;
                    activeLayout.forEach(s => (s.elements||[]).forEach(e => { if (parseInt(e.styles?.zIndex||10) > maxZ) maxZ = parseInt(e.styles?.zIndex||10); }));
                    const n = activeLayout.map(s => ({ ...s, elements: (s.elements||[]).map(e => e.id === contextMenu.elementId ? { ...e, styles: { ...e.styles, zIndex: maxZ + 1 } } : e) }));
                    updateLayout(n);
                  })}
                  {menuItem('🔼', 'Bring Forward', () => {
                    const currentZ = parseInt(targetEl?.styles?.zIndex || 10);
                    const n = activeLayout.map(s => ({ ...s, elements: (s.elements||[]).map(e => e.id === contextMenu.elementId ? { ...e, styles: { ...e.styles, zIndex: currentZ + 1 } } : e) }));
                    updateLayout(n);
                  })}
                  {menuItem('🔽', 'Send Backward', () => {
                    const currentZ = parseInt(targetEl?.styles?.zIndex || 10);
                    const n = activeLayout.map(s => ({ ...s, elements: (s.elements||[]).map(e => e.id === contextMenu.elementId ? { ...e, styles: { ...e.styles, zIndex: currentZ - 1 } } : e) }));
                    updateLayout(n);
                  })}
                  {menuItem('⬇', 'Send to Back', () => {
                    let minZ = 10;
                    activeLayout.forEach(s => (s.elements||[]).forEach(e => { if (parseInt(e.styles?.zIndex||10) < minZ) minZ = parseInt(e.styles?.zIndex||10); }));
                    const n = activeLayout.map(s => ({ ...s, elements: (s.elements||[]).map(e => e.id === contextMenu.elementId ? { ...e, styles: { ...e.styles, zIndex: minZ - 1 } } : e) }));
                    updateLayout(n);
                  })}
                  {sep}
                  {menuItem('⧉', 'Duplicate Element', () => handleDuplicateElement(contextMenu.elementId))}
                  {menuItem('📋', 'Copy Styles', () => {
                    if (targetEl) setStyleClipboard({ type: targetEl.type, styles: JSON.parse(JSON.stringify(targetEl.styles || {})) });
                  })}
                  {menuItem('📌', 'Paste Styles', () => {
                    if (!styleClipboard || !targetEl) return;
                    const n = activeLayout.map(s => ({ ...s, elements: (s.elements||[]).map(e => e.id === contextMenu.elementId ? { ...e, styles: { ...e.styles, ...styleClipboard.styles } } : e) }));
                    updateLayout(n);
                  }, false, !styleClipboard || !targetEl || styleClipboard?.type !== targetEl?.type)}
                  {sep}
                  {selectedElementIds.length > 1 && menuItem('🔗', `Group Elements`, handleGroupElements)}
                  {targetEl?.groupId && menuItem('🔓', 'Ungroup', handleUngroupElements)}
                  {sep}
                  {menuItem('🗑️', 'Delete Element', () => handleDeleteElement(contextMenu.elementId), true)}
                </>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}

export default Builder;