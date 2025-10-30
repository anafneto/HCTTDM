import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { marked } from 'marked';
import Navbar from "./components/Navbar";
import VersionTree from "./components/VersionTree";
import { promptService, authService } from "./services/api";
import { storageService } from "./services/storage";
import ShipsSpecialNeeds from "./components/ShipsSpecialNeeds";

function Homepage() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const displayName = (user?.name && user.name.trim()) ? user.name.trim() : "User";
  const [query, setQuery] = useState("");
  const [segments, setSegments] = useState([]);
  const [showPopover, setShowPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState("");

  const [showRemovePopover, setShowRemovePopover] = useState(false);
  const [removePopoverPosition, setRemovePopoverPosition] = useState({ top: 0, left: 0 });
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);

  const containerRef = useRef(null);
  const rangeRef = useRef(null);
  const selIdCounter = useRef(1);
  const [annotations, setAnnotations] = useState(() => storageService.annotations.get());
  const [draggedItem, setDraggedItem] = useState(null);
  const [cards, setCards] = useState([]);
  const [currentContent, setCurrentContent] = useState("");
  const [autoSubmit, setAutoSubmit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [treeNodes, setTreeNodes] = useState({});
  const [rootNodeId, setRootNodeId] = useState(null);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const nodeIdCounterRef = useRef(1);
  const [isConsolidatedActive, setIsConsolidatedActive] = useState(false);
  const [consolidatedText, setConsolidatedText] = useState("");
  const [hasConsolidated, setHasConsolidated] = useState(() => {
    const cached = storageService.consolidated.getText();
    return !!(cached && cached.trim() && !isDummyConsolidated(cached));
  });

  const [consolidatedStale, setConsolidatedStale] = useState(() => {
    const sig = storageService.consolidated.getSignature();
    const currentSig = computeCollectionsSignatureSafe();
    return !!(sig && currentSig && sig !== currentSig);
  });

  const [collections, setCollections] = useState(() => storageService.collections.get());

  useEffect(() => {
    const savedNodes = storageService.tree.getNodes();
    const savedRootId = storageService.tree.getRootId();
    const savedCurrentId = storageService.tree.getCurrentId();
    const savedCounter = storageService.tree.getCounter();

    if (savedNodes && Object.keys(savedNodes).length > 0 && savedRootId) {
      setTreeNodes(savedNodes);
      setRootNodeId(savedRootId);
      const startId = savedCurrentId || savedRootId;
      setCurrentNodeId(startId);
      nodeIdCounterRef.current = savedCounter;

      const content = savedNodes[startId]?.content || storageService.session.getContent();
      if (content) {
        setCurrentContent(content);
        setTimeout(() => {
          insertTextToContainer(content);

          const savedAnnotations = storageService.annotations.getForNode(startId);
          const collectionsForNode = collections.filter(c => c.originNodeId === startId)
            .map(c => ({ id: c.id, text: c.text, type: c.type || 'known', originNodeId: c.originNodeId }));

          const allAnnotations = [...savedAnnotations];
          collectionsForNode.forEach(colAnn => {
            if (!allAnnotations.some(a => a.id === colAnn.id)) {
              allAnnotations.push(colAnn);
            }
          });

          restoreContentWithAnnotations(content, allAnnotations);
        }, 100);
      }
    }

    setAutoSubmit(storageService.session.getAutoSubmit());
    selIdCounter.current = storageService.session.getSelCounter();
  }, []);

  useEffect(() => {
    try {
      const cached = localStorage.getItem('consolidatedText');
      if (cached && isDummyConsolidated(cached)) {
        localStorage.removeItem('consolidatedText');
        setHasConsolidated(false);
      } else {
        setHasConsolidated(!!(cached && cached.trim()));
      }
    } catch { }
  }, []);

  useEffect(() => {
    if (autoSubmit && annotations.length > 0) {
      generateCardsFromAnnotations();
    }
  }, [annotations, autoSubmit]);

  useEffect(() => {
    if (currentContent) {
      localStorage.setItem('currentContent', currentContent);
    }
  }, [currentContent]);

  useEffect(() => {
    if (Object.keys(treeNodes).length > 0) {
      localStorage.setItem('versionTreeNodes', JSON.stringify(treeNodes));
    }
  }, [treeNodes]);

  useEffect(() => {
    if (currentNodeId) {
      localStorage.setItem('versionTreeCurrentId', currentNodeId);
    }
  }, [currentNodeId]);

  useEffect(() => {
    localStorage.setItem('autoSubmit', autoSubmit.toString());
  }, [autoSubmit]);

  useEffect(() => {
    localStorage.setItem('collections', JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    try {
      const sig = localStorage.getItem('consolidatedSignature');
      const currentSig = computeCollectionsSignature(collections);
      if (!sig) {
        const cached = localStorage.getItem('consolidatedText');
        setConsolidatedStale(!!(cached && cached.trim()) && (collections?.length || 0) > 0);
      } else {
        setConsolidatedStale(sig !== currentSig);
      }
    } catch {
      setConsolidatedStale(false);
    }
  }, [collections]);

  useEffect(() => {
    if (Object.keys(treeNodes).length > 0) {
      storageService.tree.setNodes(treeNodes);
    }
  }, [treeNodes]);

  useEffect(() => {
    if (currentNodeId) {
      storageService.tree.setCurrentId(currentNodeId);
    }
  }, [currentNodeId]);

  useEffect(() => {
    storageService.collections.set(collections);

    const currentSig = computeCollectionsSignature(collections);
    const savedSig = storageService.consolidated.getSignature();
    if (savedSig) {
      setConsolidatedStale(savedSig !== currentSig);
    }
  }, [collections]);

  useEffect(() => {
    if (currentContent) {
      storageService.session.setContent(currentContent);
    }
  }, [currentContent]);

  useEffect(() => {
    storageService.session.setAutoSubmit(autoSubmit);
  }, [autoSubmit]);

  useEffect(() => {
    storageService.annotations.set(annotations);
  }, [annotations]);

  function restoreContentWithAnnotations(content, anns) {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";
    const p = document.createElement("p");
    p.textContent = content;
    container.appendChild(p);

    setTimeout(() => {
      const sortedAnns = [...anns].sort((a, b) => {
        const aIndex = content.indexOf(a.text);
        const bIndex = content.indexOf(b.text);
        return bIndex - aIndex;
      });

      const usedRanges = [];

      sortedAnns.forEach(ann => {
        const textContent = container.textContent;
        let searchStart = 0;
        let found = false;

        while (!found && searchStart < textContent.length) {
          const index = textContent.indexOf(ann.text, searchStart);

          if (index === -1) break;

          const overlaps = usedRanges.some(range =>
            (index >= range.start && index < range.end) ||
            (index + ann.text.length > range.start && index + ann.text.length <= range.end)
          );

          if (!overlaps) {
            const range = document.createRange();
            const walker = document.createTreeWalker(
              container,
              NodeFilter.SHOW_TEXT,
              null,
              false
            );

            let currentPos = 0;
            let startNode = null;
            let startOffset = 0;
            let endNode = null;
            let endOffset = 0;

            while (walker.nextNode()) {
              const node = walker.currentNode;
              const nodeLength = node.textContent.length;

              if (currentPos + nodeLength > index && !startNode) {
                startNode = node;
                startOffset = index - currentPos;
              }

              if (currentPos + nodeLength >= index + ann.text.length) {
                endNode = node;
                endOffset = index + ann.text.length - currentPos;
                break;
              }

              currentPos += nodeLength;
            }

            if (startNode && endNode) {
              try {
                range.setStart(startNode, startOffset);
                range.setEnd(endNode, endOffset);

                const extracted = range.extractContents();
                const span = document.createElement("span");
                span.dataset.annotationId = ann.id;
                span.id = ann.id;

                if (ann.type === "summarize") {
                  span.className = "annotation-highlight";
                  span.style.background = "rgba(255, 243, 167, 0.9)";
                } else if (ann.type === "known") {
                  span.className = "annotation-known";
                  span.style.background = "rgba(144, 238, 144, 0.4)";
                } else if (ann.type === "unfamiliar") {
                  span.className = "annotation-not-interested";
                  span.style.background = "rgba(255, 182, 193, 0.4)";
                }

                span.style.padding = "2px 4px";
                span.style.borderRadius = "4px";
                span.style.cursor = "pointer";
                span.appendChild(extracted);
                range.insertNode(span);

                usedRanges.push({
                  start: index,
                  end: index + ann.text.length,
                  id: ann.id
                });

                found = true;
              } catch (e) {
                console.error("Error restoring annotation:", e);
                searchStart = index + 1;
              }
            } else {
              searchStart = index + 1;
            }
          } else {
            searchStart = index + 1;
          }
        }

        if (!found) {
          console.warn(`Could not restore annotation: ${ann.id} - "${ann.text}"`);
        }
      });
    }, 100);
  }

  function isDummyConsolidated(text) {
    const t = (text || "").toLowerCase();
    return t.includes("no knowledge items collected yet");
  }

  function computeCollectionsSignature(cols) {
    try {
      const arr = (cols || []).map(c => ({ id: c.id, originNodeId: c.originNodeId, text: c.text }));
      return JSON.stringify(arr);
    } catch {
      return '';
    }
  }

  function computeCollectionsSignatureSafe() {
    try {
      const saved = localStorage.getItem('collections');
      const cols = saved ? JSON.parse(saved) : [];
      return computeCollectionsSignature(cols);
    } catch {
      return '';
    }
  }

  function insertTextToContainer(text, renderAsMarkdown = false) {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    if (renderAsMarkdown) {
      const htmlContent = marked.parse(text);
      const wrapper = document.createElement("div");
      wrapper.className = "markdown-content";
      wrapper.innerHTML = htmlContent;
      container.appendChild(wrapper);
    } else {
      const p = document.createElement("p");
      p.textContent = text;
      container.appendChild(p);
    }
  }

  function resetTreeWithRoot(text, title = "Texto original") {
    const rootId = `node-1`;
    const rootNode = { id: rootId, parentId: null, title, snippet: "", content: text, children: [] };
    const nodes = { [rootId]: rootNode };

    setTreeNodes(nodes);
    setRootNodeId(rootId);
    setCurrentNodeId(rootId);
    nodeIdCounterRef.current = 1;

    storageService.tree.setNodes(nodes);
    storageService.tree.setRootId(rootId);
    storageService.tree.setCurrentId(rootId);
    storageService.tree.setCounter(1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const topic = query.trim();
    if (!topic) return;

    setLoading(true);
    setAnnotations([]);
    setCards([]);

    storageService.annotations.clear();
    storageService.session.clear();
    storageService.consolidated.clear();

    setHasConsolidated(false);
    setConsolidatedStale(false);
    selIdCounter.current = 1;
    storageService.session.setSelCounter(1);

    try {
      const response = await promptService.sendPrompt(topic, "");

      let generatedText = "";
      if (typeof response === 'string') {
        generatedText = response;
      } else if (response.content) {
        generatedText = response.content;
      } else if (response.text) {
        generatedText = response.text;
      } else if (response.response) {
        generatedText = response.response;
      } else if (response.answer) {
        generatedText = response.answer;
      } else if (response.data) {
        generatedText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2);
      } else {
        generatedText = JSON.stringify(response, null, 2);
      }

      setLoading(false);
      setCurrentContent(generatedText);

      setTimeout(() => {
        resetTreeWithRoot(generatedText);
        insertTextToContainer(generatedText, true);
      }, 50);

    } catch (error) {
      console.error("Error sending prompt:", error);
      setLoading(false);
      alert("Error connecting to service. Please try again.");
    }
  }

  function clearInput() {
    setQuery("");
  }

  function handleContainerClick(e) {
    const annotationSpan = e.target.closest('[data-annotation-id]');

    if (annotationSpan) {
      e.stopPropagation();
      const annotationId = annotationSpan.dataset.annotationId;
      const annotationText = annotationSpan.textContent;

      const ann = [...annotations, ...collections].find(a => a.id === annotationId);

      if (ann) {
        const rect = annotationSpan.getBoundingClientRect();
        setRemovePopoverPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX
        });
        setSelectedAnnotation({
          id: annotationId,
          text: annotationText,
          type: ann.type,
          originNodeId: ann.originNodeId || currentNodeId
        });
        setShowRemovePopover(true);
        hidePopover();
      }
    }
  }

  function onMouseUpInContainer(e) {
    if (e.target.closest('[data-annotation-id]')) {
      return;
    }

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return hidePopover();
    const text = sel.toString().trim();
    if (!text) return hidePopover();
    const container = containerRef.current;
    try {
      const range = sel.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) return hidePopover();

      const startContainer = range.startContainer;
      const endContainer = range.endContainer;

      if (startContainer.nodeType === Node.TEXT_NODE) {
        const textBefore = startContainer.textContent.substring(0, range.startOffset);
        const lastSpaceIndex = textBefore.lastIndexOf(' ');
        range.setStart(startContainer, lastSpaceIndex === -1 ? 0 : lastSpaceIndex + 1);
      }

      if (endContainer.nodeType === Node.TEXT_NODE) {
        const textAfter = endContainer.textContent.substring(range.endOffset);
        const nextSpaceIndex = textAfter.indexOf(' ');
        const newOffset = range.endOffset + (nextSpaceIndex === -1 ? textAfter.length : nextSpaceIndex);
        range.setEnd(endContainer, newOffset);
      }

      sel.removeAllRanges();
      sel.addRange(range);

      const adjustedText = range.toString().trim();
      if (!adjustedText) return hidePopover();

      rangeRef.current = range.cloneRange();

      const rect = range.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX
      });

      setSelectedText(adjustedText);
      setShowPopover(true);
      hideRemovePopover();
    } catch {
      hidePopover();
    }
  }

  function hidePopover() {
    setShowPopover(false);
    setSelectedText("");
    try {
      window.getSelection()?.removeAllRanges();
    } catch { }
  }

  function hideRemovePopover() {
    setShowRemovePopover(false);
    setSelectedAnnotation(null);
  }

  function handleRemoveAnnotation() {
    if (!selectedAnnotation) return;

    const { id } = selectedAnnotation;

    const span = containerRef.current?.querySelector(`[data-annotation-id="${id}"]`);
    if (span) {
      const parent = span.parentNode;
      while (span.firstChild) parent.insertBefore(span.firstChild, span);
      parent.removeChild(span);
    }

    setAnnotations((a) => a.filter((ann) => ann.id !== id));

    setCollections((c) => c.filter((it) => it.id !== id));

    setCards((c) => c.filter((card) => card.id !== id));

    hideRemovePopover();
  }

  function handleMoreInfo() {
    if (!selectedText || !rangeRef.current) return hidePopover();
    const id = `ann-${selIdCounter.current++}`;
    storageService.session.setSelCounter(selIdCounter.current);

    try {
      const range = rangeRef.current;
      const extracted = range.extractContents();
      const span = document.createElement("span");
      span.className = "annotation-highlight";
      span.dataset.annotationId = id;
      span.id = id;
      span.style.background = "rgba(255, 243, 167, 0.9)";
      span.style.padding = "2px 4px";
      span.style.borderRadius = "4px";
      span.style.cursor = "pointer";
      span.appendChild(extracted);
      range.insertNode(span);
    } catch { }

    setAnnotations((a) => [...a, {
      id,
      text: selectedText,
      type: "summarize",
      originNodeId: currentNodeId
    }]);
    hidePopover();
  }

  function handleAlreadyKnow() {
    if (!selectedText || !rangeRef.current) return hidePopover();
    const id = `ann-${selIdCounter.current++}`;
    storageService.session.setSelCounter(selIdCounter.current);
    const range = rangeRef.current;
    try {
      const extracted = range.extractContents();
      const span = document.createElement("span");
      span.className = "annotation-known";
      span.dataset.annotationId = id;
      span.id = id;
      span.style.background = "rgba(144, 238, 144, 0.4)";
      span.style.padding = "2px 4px";
      span.style.borderRadius = "4px";
      span.style.cursor = "pointer";
      span.appendChild(extracted);
      range.insertNode(span);
    } catch { }

    const newAnnotation = {
      id,
      text: selectedText,
      type: "known",
      originNodeId: currentNodeId
    };

    setAnnotations((a) => [...a, newAnnotation]);

    const norm = (s) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();
    const exists = collections.some((c) => c.originNodeId === currentNodeId && norm(c.text) === norm(selectedText));
    if (!exists) {
      setCollections((prev) => [...prev, {
        id,
        text: selectedText,
        type: "known",
        originNodeId: currentNodeId,
        createdAt: Date.now()
      }]);
    }
    hidePopover();
  }

  function handleNotInterested() {
    if (!selectedText || !rangeRef.current) return hidePopover();
    const id = `ann-${selIdCounter.current++}`;
    storageService.session.setSelCounter(selIdCounter.current);

    const range = rangeRef.current;
    try {
      const extracted = range.extractContents();
      const span = document.createElement("span");
      span.className = "annotation-not-interested";
      span.dataset.annotationId = id;
      span.id = id;
      span.style.background = "rgba(255, 182, 193, 0.4)";
      span.style.padding = "2px 4px";
      span.style.borderRadius = "4px";
      span.style.cursor = "pointer";
      span.appendChild(extracted);
      range.insertNode(span);
    } catch { }

    setAnnotations((a) => [...a, {
      id,
      text: selectedText,
      type: "unfamiliar",
      originNodeId: currentNodeId
    }]);
    hidePopover();
  }

  async function generateCardsFromAnnotations() {
    setCardsLoading(true);
    const newCards = [];

    try {
      for (const ann of annotations) {
        if (ann.type === "summarize" || ann.type === "unfamiliar") {
          const result = await promptService.processAnnotation(
            ann.text,
            ann.type,
            currentContent
          );

          const card = {
            id: ann.id,
            title: ann.text,
            type: ann.type,
            content: result.content || "Content not available",
            bgColor: ann.type === "summarize"
              ? "rgba(255, 243, 167, 0.3)"
              : "rgba(255, 182, 193, 0.3)",
            label: ann.type === "summarize" ? "Summary" : "Explanation"
          };

          newCards.push(card);
        }
      }

      setCards(newCards);
    } catch (error) {
      console.error("Error generating cards:", error);
      alert("Error generating cards. Please try again.");
    } finally {
      setCardsLoading(false);
    }
  }

  function normalizeText(s) {
    return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function findExistingNodeByTitleContent(title, content) {
    const nt = normalizeText(title);
    const nc = normalizeText(content);
    for (const id of Object.keys(treeNodes)) {
      const n = treeNodes[id];
      if (normalizeText(n.title || n.snippet) === nt && normalizeText(n.content) === nc) {
        return id;
      }
    }
    return null;
  }

  function findExistingChildByTitle(parentId, title) {
    const parent = treeNodes[parentId];
    if (!parent) return null;
    const nt = normalizeText(title);
    for (const cid of parent.children || []) {
      const n = treeNodes[cid];
      if (n && normalizeText(n.title || n.snippet) === nt) return cid;
    }
    return null;
  }

  function createChildFromCard(card) {
    if (!currentNodeId) return;

    const dupGlobalId = findExistingNodeByTitleContent(card.title, card.content);
    if (dupGlobalId) {
      onSelectNode(dupGlobalId);
      return null;
    }

    const dupSiblingId = findExistingChildByTitle(currentNodeId, card.title);
    if (dupSiblingId) {
      onSelectNode(dupSiblingId);
      return null;
    }

    const nextIdNum = (nodeIdCounterRef.current || 1) + 1;
    const newId = `node-${nextIdNum}`;
    nodeIdCounterRef.current = nextIdNum;
    storageService.tree.setCounter(nextIdNum);

    const parent = treeNodes[currentNodeId];
    const newNode = {
      id: newId,
      parentId: currentNodeId,
      title: card.title,
      snippet: card.title,
      content: card.content,
      kind: card.type === "summarize" ? "summary" : (card.type === "unfamiliar" ? "explanation" : "other"),
      children: []
    };

    const updated = { ...treeNodes, [newId]: newNode, [currentNodeId]: { ...parent, children: [...(parent.children || []), newId] } };
    setTreeNodes(updated);
    return newId;
  }

  function onSelectNode(id) {
    if (!id || !treeNodes[id]) return;
    setIsConsolidatedActive(false);
    setCurrentNodeId(id);
    const text = treeNodes[id].content || "";

    const nodeAnnotations = storageService.annotations.getForNode(id);
    const collectionsForNode = collections.filter(c => c.originNodeId === id)
      .map(c => ({ id: c.id, text: c.text, type: c.type || 'known', originNodeId: c.originNodeId }));

    const allAnnotations = [...nodeAnnotations];
    collectionsForNode.forEach(colAnn => {
      if (!allAnnotations.some(a => a.id === colAnn.id)) {
        allAnnotations.push(colAnn);
      }
    });

    setAnnotations(allAnnotations);
    setCards([]);
    selIdCounter.current = storageService.session.getSelCounter();
    setCurrentContent(text);

    setTimeout(() => {
      insertTextToContainer(text);
      restoreContentWithAnnotations(text, allAnnotations);
    }, 50);
  }

  function handleGenerateCards() {
    generateCardsFromAnnotations();
  }

  function removeAnnotation(id, originNodeId) {
    const span = containerRef.current?.querySelector(`[data-annotation-id="${id}"]`);
    if (span) {
      const parent = span.parentNode;
      while (span.firstChild) parent.insertBefore(span.firstChild, span);
      parent.removeChild(span);
    }
    setAnnotations((a) => a.filter((ann) => ann.id !== id));
    setCollections((c) => c.filter((it) => it.id !== id));
  }

  function goToAnnotation(id) {
    const container = containerRef.current;
    if (!container || !id) return;
    const el = container.querySelector(`#${CSS.escape(id)}`) || container.querySelector(`[data-annotation-id="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const prev = el.style.boxShadow;
    el.style.transition = 'box-shadow 0.2s ease';
    el.style.boxShadow = '0 0 0 6px rgba(13,110,253,0.2)';
    setTimeout(() => {
      el.style.boxShadow = prev || '';
    }, 900);
    try { window.location.hash = id; } catch { }
  }

  function deleteNode(nodeId) {
    if (!treeNodes[nodeId]) return;
    if (treeNodes[nodeId].parentId === null) {
      alert("Cannot remove root node.");
      return;
    }

    const collectIds = (id, acc = []) => {
      acc.push(id);
      const kids = treeNodes[id]?.children || [];
      kids.forEach((cid) => collectIds(cid, acc));
      return acc;
    };

    const toDelete = collectIds(nodeId, []);
    const newCollections = collections.filter((c) => !toDelete.includes(c.originNodeId));
    const newNodes = { ...treeNodes };

    toDelete.forEach((id) => { delete newNodes[id]; });

    const parentId = treeNodes[nodeId].parentId;
    if (newNodes[parentId]) {
      newNodes[parentId] = { ...newNodes[parentId], children: (newNodes[parentId].children || []).filter((cid) => cid !== nodeId) };
    }

    setCollections(newCollections);
    setTreeNodes(newNodes);

    if (toDelete.includes(currentNodeId)) {
      const fallbackId = parentId || rootNodeId || Object.keys(newNodes)[0] || null;
      if (fallbackId) {
        setCurrentNodeId(fallbackId);
        const text = newNodes[fallbackId]?.content || "";
        setAnnotations([]);
        setCards([]);
        selIdCounter.current = 1;
        setCurrentContent(text);

        setTimeout(() => {
          insertTextToContainer(text);
          const annsForNode = newCollections.filter((c) => c.originNodeId === fallbackId).map(c => ({ id: c.id, text: c.text, type: 'known' }));
          restoreContentWithAnnotations(text, annsForNode);
        }, 50);
      }
    }
  }

  function handleDragStart(e, index) {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", String(index)); } catch { }
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const newCollections = [...collections];
    const [moved] = newCollections.splice(draggedItem, 1);
    newCollections.splice(index, 0, moved);

    setCollections(newCollections);
    setDraggedItem(index);
  }

  function handleDragEnd() {
    setDraggedItem(null);
  }

  useEffect(() => {
    function onDocClick(e) {
      const popover = document.getElementById("selection-popover");
      const removePopover = document.getElementById("remove-annotation-popover");

      if (popover && !popover.contains(e.target) && containerRef.current && !containerRef.current.contains(e.target)) {
        hidePopover();
      }

      if (removePopover && !removePopover.contains(e.target) && !e.target.closest('[data-annotation-id]')) {
        hideRemovePopover();
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const collectedItems = collections;

  async function onSelectConsolidated(force = false) {
    setIsConsolidatedActive(true);
    setAnnotations([]);
    setCards([]);
    selIdCounter.current = 1;

    if (!force) {
      const cached = storageService.consolidated.getText();
      if (cached && cached.trim() && !isDummyConsolidated(cached)) {
        setCurrentContent(cached);
        setConsolidatedText(cached);
        setHasConsolidated(true);
        setTimeout(() => {
          insertTextToContainer(cached, true);
        }, 50);
        return;
      }
    }

    if (collections.length === 0) {
      const emptyText = "No knowledge items collected yet. Select text and mark as 'Collected' to build your consolidated view.";
      setCurrentContent(emptyText);
      setConsolidatedText(emptyText);
      setTimeout(() => {
        insertTextToContainer(emptyText, false);
      }, 50);
      return;
    }

    const loadingText = force ? "Re-generating consolidated text..." : "Generating consolidated text...";
    setCurrentContent(loadingText);
    setTimeout(() => {
      insertTextToContainer(loadingText, false);
    }, 50);

    try {
      const response = await promptService.consolidateKnowledge(collections, currentContent);
      const consolidated = response.consolidatedText || "Unable to generate consolidated text.";

      setConsolidatedText(consolidated);
      setCurrentContent(consolidated);

      storageService.consolidated.setText(consolidated);
      const sig = computeCollectionsSignature(collections);
      storageService.consolidated.setSignature(sig);

      setHasConsolidated(!isDummyConsolidated(consolidated));
      setConsolidatedStale(false);
      setTimeout(() => {
        insertTextToContainer(consolidated, true);
      }, 50);

    } catch (error) {
      console.error("Error consolidating knowledge:", error);
      const errorText = "Error generating consolidated text. Please try again.";
      setConsolidatedText(errorText);
      setCurrentContent(errorText);

      setTimeout(() => {
        insertTextToContainer(errorText, false);
      }, 50);

      alert("Error consolidating knowledge. Please try again.");
    }
  }

  function goToCollected(item) {
    if (!item) return;
    if (currentNodeId !== item.originNodeId) {
      onSelectNode(item.originNodeId);
      setTimeout(() => goToAnnotation(item.id), 200);
    } else {
      goToAnnotation(item.id);
    }
  }

  const hasAnyCollections = (collections?.length || 0) > 0;
  const consolidateDisabled = !hasAnyCollections || (hasConsolidated && !consolidatedStale);
  const consolidateLabel = consolidatedStale ? 'Consolidate' : (hasConsolidated ? 'Consolidated' : 'Consolidate');
  const consolidateAria = consolidatedStale ? 'Consolidate' : 'Consolidate';

  function getAnnotationTypeLabel(type) {
    switch (type) {
      case 'known': return 'Collected';
      case 'summarize': return 'Summarize';
      case 'unfamiliar': return 'Need to know more';
      default: return type;
    }
  }

  return (
    <>
      <Navbar />
      <div className="container-fluid py-4" style={{ marginTop: "80px" }}>
        <div className="row">
          <div className="col-lg-3">
            <div className="sticky-top" style={{ top: "100px" }}>
              <div className="card-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                <VersionTree
                  nodes={treeNodes}
                  rootId={rootNodeId}
                  currentId={currentNodeId}
                  onSelect={onSelectNode}
                  onDelete={deleteNode}
                  collections={collections}
                  showConsolidated={hasConsolidated}
                  consolidatedLabel="Consolidated"
                  onSelectConsolidated={onSelectConsolidated}
                  consolidatedActive={isConsolidatedActive}
                />
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <h1 className="hello_user">Hello, {displayName}</h1>
            <ShipsSpecialNeeds />
            <form onSubmit={handleSubmit} className="mt-3">
              <div className="d-flex align-items-center gap-2">
                <div className="input-wrapper" style={{ flex: 1, position: "relative" }}>
                  <i className="bi bi-stars" style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "1rem",
                    color: "#6c757d",
                    pointerEvents: "none",
                    zIndex: 1
                  }}></i>
                  <input
                    type="text"
                    className="form-control"
                    id="searchInput"
                    placeholder="What do you want to learn today?"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={loading}
                    style={{
                      paddingLeft: "40px",
                      paddingRight: query ? "35px" : "12px",
                      border: "1px solid #ddd",
                      borderRadius: "25px"
                    }}
                  />
                  {query && !loading && (
                    <button
                      type="button"
                      className="clear-btn"
                      onClick={clearInput}
                      aria-label="Clear"
                    >
                      <i className="bi bi-x-circle-fill"></i>
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="submit-circle-btn"
                  disabled={!query.trim() || loading}
                  aria-label="Submit question"
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    <i className="bi bi-arrow-up"></i>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-3">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted mt-3">Generating content...</p>
                </div>
              ) : (
                <>
                  <div
                    ref={containerRef}
                    onMouseUp={onMouseUpInContainer}
                    onClick={handleContainerClick}
                    className="p-1"
                    style={{
                      minHeight: "120px",
                      position: "relative",
                      lineHeight: "1.8",
                      fontSize: "1rem",
                      textAlign: "left"
                    }}
                  />

                  {annotations.length > 0 && (
                    <div className="mt-1 d-flex align-items-center gap-3">
                      <button
                        type="button"
                        className="btn btn-roxo btn-primary"
                        onClick={handleGenerateCards}
                        disabled={autoSubmit || cardsLoading}
                      >
                        {cardsLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Submitting...
                          </>
                        ) : (
                          'Submit'
                        )}
                      </button>

                      <div className="form-check form-switch m-0 d-flex align-items-center">
                        <input
                          className="form-check-input me-2"
                          type="checkbox"
                          role="switch"
                          id="autoSubmitSwitch"
                          checked={autoSubmit}
                          onChange={(e) => setAutoSubmit(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="autoSubmitSwitch">Auto-submit</label>
                      </div>

                      <hr className="flex-grow-1 my-0" style={{ borderTop: '1px solid #aeafb1ff' }} />
                    </div>
                  )}
                </>
              )}

              {/* Selection Popover */}
              {showPopover && (
                <div
                  id="selection-popover"
                  className="selection-popover"
                  style={{
                    top: `${popoverPosition.top}px`,
                    left: `${popoverPosition.left}px`
                  }}
                >
                  <div className="d-flex flex-column gap-2">
                    <button className="btn btn-sm btn-outline-success w-100" onClick={handleAlreadyKnow}>
                      <i className="bi bi-check-circle me-2"></i>
                      Collected
                    </button>
                    <button className="btn btn-sm btn-roxo w-100" onClick={handleMoreInfo}>
                      <i className="bi bi-file-text me-2"></i>
                      Summarize
                    </button>
                    <button className="btn btn-sm btn-outline-danger w-100" onClick={handleNotInterested}>
                      <i className="bi bi-question-circle me-2"></i>
                      Need to know more
                    </button>
                  </div>
                </div>
              )}

              {/* Remove Annotation Popover */}
              {showRemovePopover && selectedAnnotation && (
                <div
                  id="remove-annotation-popover"
                  className="selection-popover"
                  style={{
                    top: `${removePopoverPosition.top}px`,
                    left: `${removePopoverPosition.left}px`
                  }}
                >
                  <div className="p-2">
                    <div className="mb-2">
                      <small className="text-muted d-block mb-1">
                        {getAnnotationTypeLabel(selectedAnnotation.type)}
                      </small>
                      <div className="fw-medium small" style={{ maxWidth: '250px' }}>
                        {selectedAnnotation.text}
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-outline-danger w-100"
                      onClick={handleRemoveAnnotation}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {cards.length > 0 && (
                <div className="mt-4">
                  <div className="row g-3">
                    {cards.map((card) => (
                      <div key={card.id} className="row-md-6">
                        <div
                          className="card h-100"
                          role="button"
                          tabIndex={0}
                          onClick={() => { const id = createChildFromCard(card); if (id) onSelectNode(id); }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const id = createChildFromCard(card); if (id) onSelectNode(id); } }}
                          style={{
                            backgroundColor: card.bgColor,
                            border: "1px solid rgba(0,0,0,0.1)",
                            borderRadius: "12px",
                            cursor: "pointer"
                          }}
                          title="Create branch and open"
                        >
                          <div className="card-body">
                            <h6 className="card-title text-truncate">{card.title}</h6>
                            <p className="text-muted small mb-2">{card.label}</p>
                            <p className="card-text">{card.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="col-lg-3">
            <div className="sticky-top" style={{ top: "100px", borderLeft: '1px solid #aeafb14b', minHeight: "calc(100vh - 100px)", paddingLeft: "12px" }}>
              <div style={{ maxHeight: "600px", overflowY: "auto" }}>
                <h5 className="mb-2">
                  <i className="bi bi-check-circle text-success me-2"></i>
                  Collected
                </h5>
                {collectedItems.length === 0 ? (
                  <p className="text-muted my-3">
                    No items yet. Select text and mark as "Collect".
                  </p>
                ) : (
                  <ul className="list-group">
                    {collectedItems.map((ann, index) => (
                      <li
                        key={ann.id}
                        className={`list-group-item d-flex align-items-start gap-2 ${draggedItem === index ? 'opacity-50' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        style={{ cursor: "move" }}
                      >
                        <i className="bi bi-grip-vertical text-muted" style={{ fontSize: "1.2rem" }}></i>
                        <div className="flex-grow-1">
                          <div
                            className="fw-medium"
                            role="button"
                            tabIndex={0}
                            onClick={() => goToCollected(ann)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') goToCollected(ann); }}
                            style={{ cursor: 'pointer' }}
                          >
                            {ann.text}
                          </div>
                        </div>
                        <button
                          className="btn btn-sm"
                          onClick={() => removeAnnotation(ann.id, ann.originNodeId)}
                          style={{ padding: "2px 8px" }}
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="btn-lg btn-success btn shadow floating-consolidate-btn d-inline-flex align-items-center gap-2"
        onClick={() => { if (!consolidateDisabled) onSelectConsolidated(consolidatedStale); }}
        aria-label={consolidateAria}
        title={consolidateAria}
        disabled={consolidateDisabled}
        aria-disabled={consolidateDisabled}
      >
        <i className="bi bi-book"></i>
        <span>{consolidateLabel}</span>
      </button>
    </>
  );
}

export default Homepage;