/*
 * Global Elements Utility
 * Provides functions to fetch, merge, and sync global elements across all pages.
 * Assumes a backend endpoint `/api/global-elements/` returning an array of element objects
 * with the same schema as page elements, plus an `isGlobal: true` flag.
 */

/**
 * Fetch all global elements from the backend.
 * @returns {Promise<Array>} Array of global element objects.
 */
export async function fetchGlobalElements() {
  const res = await fetch('http://127.0.0.1:8000/api/global-elements/', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch global elements');
  const data = await res.json();
  return data;
}

/**
 * Save (create or update) a global element.
 * @param {Object} element - The element object with `isGlobal: true`.
 * @returns {Promise<Object>} Saved element.
 */
export async function saveGlobalElement(element) {
  const method = element.id ? 'PUT' : 'POST';
  const url = element.id
    ? `http://127.0.0.1:8000/api/global-elements/${element.id}/`
    : 'http://127.0.0.1:8000/api/global-elements/';
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(element),
  });
  if (!res.ok) throw new Error('Failed to save global element');
  return await res.json();
}

/**
 * Delete a global element.
 * @param {string|number} id - Element ID.
 */
export async function deleteGlobalElement(id) {
  const res = await fetch(`http://127.0.0.1:8000/api/global-elements/${id}/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete global element');
}

/**
 * Merge global elements into a page layout.
 * This function takes a page's existing layout (array of sections) and inserts
 * all global elements that are not already present. Global elements keep their
 * original coordinates, ensuring identical placement on every page.
 *
 * @param {Array} layout - Page layout (sections with elements).
 * @param {Array} globalElements - Array of global element objects.
 * @returns {Array} New layout with globals injected.
 */
export function mergeGlobalElements(layout, globalElements) {
  if (!Array.isArray(layout) || !Array.isArray(globalElements)) return layout;

  // Flatten existing element IDs for quick lookup
  const existingIds = new Set();
  layout.forEach(section => {
    (section.elements || []).forEach(el => existingIds.add(el.id));
    // Handle old row/column structures if present
    if (section.rows) {
      section.rows.forEach(row => {
        (row.columns || []).forEach(col => {
          (col.elements || []).forEach(el => existingIds.add(el.id));
        });
      });
    }
  });

  // Deep copy layout to avoid mutating original
  const newLayout = JSON.parse(JSON.stringify(layout));

  // Create or locate a dedicated global section
  let globalSection = newLayout.find(sec => sec.id === 'global_section');
  if (!globalSection) {
    globalSection = {
      id: 'global_section',
      type: 'section',
      settings: { backgroundColor: 'transparent', pointerEvents: 'none' },
      elements: [],
    };
    newLayout.unshift(globalSection);
  }

  globalElements.forEach(el => {
    if (!existingIds.has(el.id)) {
      const copy = { ...el, isGlobal: true };
      globalSection.elements.push(copy);
    }
  });

  return newLayout;
}
