const STORAGE_KEYS = {
  USER: 'user',
  TREE_NODES: 'versionTreeNodes',
  TREE_ROOT: 'versionTreeRootId',
  TREE_CURRENT: 'versionTreeCurrentId',
  NODE_COUNTER: 'versionNodeIdCounter',
  COLLECTIONS: 'collections',
  CONSOLIDATED_TEXT: 'consolidatedText',
  CONSOLIDATED_SIG: 'consolidatedSignature',
  AUTO_SUBMIT: 'autoSubmit',
  CURRENT_CONTENT: 'currentContent',
  SEL_ID_COUNTER: 'selIdCounter',
  ANNOTATIONS: 'annotations'
};

const safeGet = (key, defaultValue = null) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const safeSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn(`Failed to save ${key} to localStorage:`, e);
    return false;
  }
};

const safeRemove = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

export const storageService = {
  tree: {
    getNodes: () => safeGet(STORAGE_KEYS.TREE_NODES, {}),
    setNodes: (nodes) => safeSet(STORAGE_KEYS.TREE_NODES, nodes),

    getRootId: () => localStorage.getItem(STORAGE_KEYS.TREE_ROOT),
    setRootId: (id) => localStorage.setItem(STORAGE_KEYS.TREE_ROOT, id),

    getCurrentId: () => localStorage.getItem(STORAGE_KEYS.TREE_CURRENT),
    setCurrentId: (id) => localStorage.setItem(STORAGE_KEYS.TREE_CURRENT, id),

    getCounter: () => parseInt(localStorage.getItem(STORAGE_KEYS.NODE_COUNTER) || '1', 10),
    setCounter: (count) => localStorage.setItem(STORAGE_KEYS.NODE_COUNTER, String(count)),

    clear: () => {
      safeRemove(STORAGE_KEYS.TREE_NODES);
      safeRemove(STORAGE_KEYS.TREE_ROOT);
      safeRemove(STORAGE_KEYS.TREE_CURRENT);
      safeRemove(STORAGE_KEYS.NODE_COUNTER);
    }
  },

  collections: {
    get: () => safeGet(STORAGE_KEYS.COLLECTIONS, []),
    set: (collections) => safeSet(STORAGE_KEYS.COLLECTIONS, collections),
    clear: () => safeRemove(STORAGE_KEYS.COLLECTIONS)
  },

  consolidated: {
    getText: () => localStorage.getItem(STORAGE_KEYS.CONSOLIDATED_TEXT) || '',
    setText: (text) => localStorage.setItem(STORAGE_KEYS.CONSOLIDATED_TEXT, text),

    getSignature: () => localStorage.getItem(STORAGE_KEYS.CONSOLIDATED_SIG) || '',
    setSignature: (sig) => localStorage.setItem(STORAGE_KEYS.CONSOLIDATED_SIG, sig),

    clear: () => {
      safeRemove(STORAGE_KEYS.CONSOLIDATED_TEXT);
      safeRemove(STORAGE_KEYS.CONSOLIDATED_SIG);
    }
  },

  annotations: {
    get: () => safeGet(STORAGE_KEYS.ANNOTATIONS, []),
    set: (annotations) => safeSet(STORAGE_KEYS.ANNOTATIONS, annotations),
    clear: () => safeRemove(STORAGE_KEYS.ANNOTATIONS),

    getForNode: (nodeId) => {
      const all = safeGet(STORAGE_KEYS.ANNOTATIONS, []);
      return all.filter(ann => ann.originNodeId === nodeId);
    },

    add: (annotation) => {
      const all = safeGet(STORAGE_KEYS.ANNOTATIONS, []);
      const updated = [...all, annotation];
      safeSet(STORAGE_KEYS.ANNOTATIONS, updated);
      return updated;
    },

    remove: (annotationId) => {
      const all = safeGet(STORAGE_KEYS.ANNOTATIONS, []);
      const updated = all.filter(ann => ann.id !== annotationId);
      safeSet(STORAGE_KEYS.ANNOTATIONS, updated);
      return updated;
    }
  },

  session: {
    getContent: () => localStorage.getItem(STORAGE_KEYS.CURRENT_CONTENT) || '',
    setContent: (content) => localStorage.setItem(STORAGE_KEYS.CURRENT_CONTENT, content),

    getAutoSubmit: () => localStorage.getItem(STORAGE_KEYS.AUTO_SUBMIT) === 'true',
    setAutoSubmit: (value) => localStorage.setItem(STORAGE_KEYS.AUTO_SUBMIT, String(value)),

    getSelCounter: () => parseInt(localStorage.getItem(STORAGE_KEYS.SEL_ID_COUNTER) || '1', 10),
    setSelCounter: (count) => localStorage.setItem(STORAGE_KEYS.SEL_ID_COUNTER, String(count)),

    clear: () => {
      safeRemove(STORAGE_KEYS.CURRENT_CONTENT);
      safeRemove(STORAGE_KEYS.SEL_ID_COUNTER);
    }
  },

  clearAll: () => {
    storageService.tree.clear();
    storageService.collections.clear();
    storageService.consolidated.clear();
    storageService.session.clear();
    storageService.annotations.clear();
  },

  clearSession: () => {
    storageService.session.clear();
    storageService.consolidated.clear();
    storageService.annotations.clear();
  }
};