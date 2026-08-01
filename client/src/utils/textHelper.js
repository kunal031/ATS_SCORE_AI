/**
 * Safely converts any value (string, number, or accidentally wrapped AI object) into a React-renderable string or number.
 * Prevents "Objects are not valid as a React child" errors when LLMs generate objects like { text: "..." } instead of strings.
 */
export const safeRender = (val, fallback = '') => {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return val;
  if (typeof val === 'object') {
    if (val.text !== undefined) return safeRender(val.text, fallback);
    if (val.value !== undefined) return safeRender(val.value, fallback);
    if (val.summary !== undefined) return safeRender(val.summary, fallback);
    if (val.message !== undefined) return safeRender(val.message, fallback);
    if (val.name !== undefined) return safeRender(val.name, fallback);
    if (val.label !== undefined) return safeRender(val.label, fallback);
    try {
      return JSON.stringify(val);
    } catch (e) {
      return fallback;
    }
  }
  return String(val) || fallback;
};

/**
 * Recursively inspects any report data structure or AI response and unwraps objects that only contain
 * keys like { text: "..." } or { value: "..." } back into simple primitive strings.
 */
export const unwrapAiObjects = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      return obj.map(unwrapAiObjects);
    }
    const keys = Object.keys(obj);
    if (keys.length === 1 && ['text', 'value', 'content', 'label', 'summary', 'message'].includes(keys[0])) {
      return unwrapAiObjects(obj[keys[0]]);
    }
    const clean = {};
    for (const key of keys) {
      clean[key] = unwrapAiObjects(obj[key]);
    }
    return clean;
  }
  return obj;
};
