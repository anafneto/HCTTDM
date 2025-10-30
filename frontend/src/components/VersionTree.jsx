import React from "react";

function getSnippetFromContent(content, maxLen = 60) {
    if (!content) return "";
    try {
        const text = String(content).replace(/\s+/g, " ").trim();
        if (!text) return "";
        return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
    } catch {
        return "";
    }
}

function TreeItem({ id, nodes, currentId, onSelect, onDelete, level = 0, collections = [] }) {
    const node = nodes[id];
    if (!node) return null;
    const children = node.children || [];
    const isActive = id === currentId;
    const hasCollected = Array.isArray(collections) && collections.some(c => c.originNodeId === id);
    const isRoot = node.parentId === null;

    const typeClass = node.kind === 'summary' ? 'summary' : (node.kind === 'explanation' ? 'explanation' : '');
    const displayText = isRoot ? getSnippetFromContent(node.content) : (node.title || node.snippet || "");
    return (
        <li className="tree-item">
            <div
                className={`tree-card ${isRoot ? "root" : ""} ${typeClass} ${isActive ? "active" : ""}`}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect(id); }}
                aria-current={isActive ? "true" : "false"}
                title={displayText || "(root)"}
            >
                <span className="tree-card-title">{displayText}</span>
                {hasCollected && <span className="tree-dot" aria-hidden>●</span>}
                {/* {node.parentId !== null && (
                    // <button
                    //     type="button"
                    //     className="btn btn-sm btn-outline-danger"
                    //     title="Remover ramificação"
                    //     onClick={(e) => { e.stopPropagation(); onDelete?.(id); }}
                    // >
                    //     <i className="bi bi-x"></i>
                    // </button>
                )} */}
            </div>
            {children.length > 0 && (
                <ul className="tree-children">
                    {children.map((cid) => (
                        <TreeItem
                            key={cid}
                            id={cid}
                            nodes={nodes}
                            currentId={currentId}
                            onSelect={onSelect}
                            onDelete={onDelete}
                            collections={collections}
                            level={level + 1}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
}

export default function VersionTree({ nodes, rootId, currentId, onSelect, onDelete, collections = [], showConsolidated = false, onSelectConsolidated, consolidatedLabel = "Consolidated", consolidatedActive = false }) {
    if (!nodes || !rootId) return null;
    return (
        <div className="version-tree">
            <ul className="tree-root">
                <TreeItem id={rootId} nodes={nodes} currentId={currentId} onSelect={onSelect} onDelete={onDelete} collections={collections} />
                {showConsolidated && (
                    <li className="tree-item">
                        <div
                            className={`tree-card consolidated ${consolidatedActive ? "active" : ""}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => onSelectConsolidated?.()}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelectConsolidated?.(); }}
                            title={consolidatedLabel}
                        >
                            <span className="tree-card-title">{consolidatedLabel}</span>
                        </div>
                    </li>
                )}
            </ul>
        </div>
    );
}
