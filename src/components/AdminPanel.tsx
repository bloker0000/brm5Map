import { useState, useEffect, useRef } from 'react';
import type { MapLocation, LocationCategory, LocationImage } from '../types/location';
import { CATEGORY_COLORS } from '../types/location';
import { CloseIcon, CrosshairIcon, CategoryIcon, SaveIcon } from './Icons';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './AdminPanel.css';

const ALL_CATEGORIES: LocationCategory[] = [
  'Player Spawn',
  'Explorable Area',
  'Exfil Point',
  'Enemy Location',
  'Zombie Nest',
  'Key Spawn Location',
  'Locked Door',
  'Quarantine Zone',
  'Medical',
  'Shop',
  'Landmark',
  'Subway Station',
  'Drop-Off Point',
  'Raid',
  'Safe',
  'Other',
];

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  locations: MapLocation[];
  onAdd: (location: Omit<MapLocation, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<MapLocation>) => void;
  onDelete: (id: string) => void;
  clickPosition: { x: number; y: number } | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  onManualSave: () => void;
  onFormCategoryChange?: (category: LocationCategory) => void;
  onModeChange?: (mode: 'list' | 'add' | 'edit') => void;
  onDragModeChange?: (isDragMode: boolean) => void;
  onImport?: (locations: MapLocation[], replace?: boolean) => number;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

type ViewMode = 'list' | 'add' | 'edit';
type EditorTab = 'basic' | 'content' | 'images';

export function AdminPanel({
  isOpen,
  onClose,
  locations,
  onAdd,
  onUpdate,
  onDelete,
  clickPosition,
  saveStatus,
  onManualSave,
  onFormCategoryChange,
  onModeChange,
  onDragModeChange,
  onImport,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: AdminPanelProps) {
  const [mode, setMode] = useState<ViewMode>('list');
  const [editingLocation, setEditingLocation] = useState<MapLocation | null>(null);
  const [originalLocation, setOriginalLocation] = useState<MapLocation | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragMode, setIsDragMode] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>('basic');
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<LocationCategory | 'all'>('all');
  const [formData, setFormData] = useState({
    name: '',
    x: 0,
    y: 0,
    description: '',
    shortDescription: '',
    category: 'Other' as LocationCategory,
    images: [] as LocationImage[],
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formCoordsRef = useRef({ x: 0, y: 0 });
  formCoordsRef.current = { x: formData.x, y: formData.y };
  const prevClickPositionRef = useRef(clickPosition);

  // --- Form-level undo/redo ---
  const formDataRef = useRef(formData);
  formDataRef.current = formData;
  const formHistoryRef = useRef<typeof formData[]>([]);
  const formFutureRef = useRef<typeof formData[]>([]);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isInTypingGroupRef = useRef(false);
  const editingLocationRef = useRef(editingLocation);
  editingLocationRef.current = editingLocation;
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const pushFormSnapshot = () => {
    const current = formDataRef.current;
    const stack = formHistoryRef.current;
    const last = stack[stack.length - 1];
    if (last && JSON.stringify(last) === JSON.stringify(current)) return;
    stack.push(structuredClone(current));
    if (stack.length > 50) stack.shift();
    formFutureRef.current = [];
  };

  const currentTypingFieldRef = useRef<string | null>(null);

  const clearFormHistory = () => {
    formHistoryRef.current = [];
    formFutureRef.current = [];
    isInTypingGroupRef.current = false;
    currentTypingFieldRef.current = null;
    clearTimeout(typingTimerRef.current);
  };

  const trackTextEdit = (field: string, prevValue: string, newValue: string) => {
    if (currentTypingFieldRef.current !== field) {
      // Switched to a different field — end previous group
      isInTypingGroupRef.current = false;
      currentTypingFieldRef.current = field;
    }
    if (!isInTypingGroupRef.current) {
      pushFormSnapshot();
      isInTypingGroupRef.current = true;
    }
    if (newValue.length >= prevValue.length && newValue.length > 0) {
      const newChar = newValue[newValue.length - 1];
      if (newChar === ' ' || newChar === '\n') {
        isInTypingGroupRef.current = false;
      }
    }
    if (newValue.length < prevValue.length - 1) {
      pushFormSnapshot();
      isInTypingGroupRef.current = false;
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isInTypingGroupRef.current = false;
    }, 1000);
  };

  const onTextFieldChange = (field: 'name' | 'description' | 'shortDescription', value: string) => {
    trackTextEdit(field, formDataRef.current[field], value);
    formDataRef.current = { ...formDataRef.current, [field]: value };
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const onDiscreteChange = (updates: Partial<typeof formData>) => {
    isInTypingGroupRef.current = false;
    clearTimeout(typingTimerRef.current);
    pushFormSnapshot();
    const newData = { ...formDataRef.current, ...updates };
    formDataRef.current = newData;
    setFormData(newData);
  };

  const formUndo = () => {
    const stack = formHistoryRef.current;
    if (stack.length === 0) return;
    clearTimeout(typingTimerRef.current);
    isInTypingGroupRef.current = false;
    formFutureRef.current.push(structuredClone(formDataRef.current));
    const prev = stack.pop()!;
    if (modeRef.current === 'edit' && editingLocationRef.current &&
        (prev.x !== formDataRef.current.x || prev.y !== formDataRef.current.y)) {
      onUpdate(editingLocationRef.current.id, { x: prev.x, y: prev.y });
    }
    formDataRef.current = prev;
    setFormData(prev);
  };

  const formRedo = () => {
    const future = formFutureRef.current;
    if (future.length === 0) return;
    clearTimeout(typingTimerRef.current);
    isInTypingGroupRef.current = false;
    formHistoryRef.current.push(structuredClone(formDataRef.current));
    const next = future.pop()!;
    if (modeRef.current === 'edit' && editingLocationRef.current &&
        (next.x !== formDataRef.current.x || next.y !== formDataRef.current.y)) {
      onUpdate(editingLocationRef.current.id, { x: next.x, y: next.y });
    }
    formDataRef.current = next;
    setFormData(next);
  };

  const formUndoRef = useRef(formUndo);
  formUndoRef.current = formUndo;
  const formRedoRef = useRef(formRedo);
  formRedoRef.current = formRedo;

  // Form-level Ctrl+Z/Ctrl+Shift+Z (capture phase, takes priority over App handler)
  useEffect(() => {
    if (mode === 'list') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (e.shiftKey) {
          formRedoRef.current();
        } else {
          formUndoRef.current();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [mode]);

  useEffect(() => {
    // Only react to actual new clicks, not mode changes with a stale clickPosition
    if (!clickPosition || clickPosition === prevClickPositionRef.current) return;
    prevClickPositionRef.current = clickPosition;
    if (mode === 'add') {
      pushFormSnapshot();
      isInTypingGroupRef.current = false;
      const newX = Math.round(clickPosition.x);
      const newY = Math.round(clickPosition.y);
      formDataRef.current = { ...formDataRef.current, x: newX, y: newY };
      setFormData((prev) => ({ ...prev, x: newX, y: newY }));
    } else if (mode === 'edit' && editingLocation) {
      pushFormSnapshot();
      isInTypingGroupRef.current = false;
      const newX = Math.round(clickPosition.x);
      const newY = Math.round(clickPosition.y);
      formDataRef.current = { ...formDataRef.current, x: newX, y: newY };
      setFormData((prev) => ({ ...prev, x: newX, y: newY }));
      onUpdate(editingLocation.id, { x: newX, y: newY });
    }
  }, [clickPosition, mode]);

  // Sync form coordinates when the edited pin is dragged on the map
  useEffect(() => {
    if (mode === 'edit' && editingLocation) {
      const current = locations.find(l => l.id === editingLocation.id);
      if (current && (current.x !== formCoordsRef.current.x || current.y !== formCoordsRef.current.y)) {
        setFormData(prev => ({ ...prev, x: current.x, y: current.y }));
      }
    }
  }, [mode, editingLocation, locations]);

  useEffect(() => {
    if (mode === 'add' || mode === 'edit') {
      setIsExpanded(true);
    }
  }, [mode]);

  useEffect(() => {
    onFormCategoryChange?.(formData.category);
  }, [formData.category, onFormCategoryChange]);

  useEffect(() => {
    onModeChange?.(mode);
    if (mode !== 'list') {
      setIsDragMode(false);
    }
  }, [mode, onModeChange]);

  useEffect(() => {
    onDragModeChange?.(isDragMode);
  }, [isDragMode, onDragModeChange]);

  const resetForm = () => {
    setFormData({
      name: '',
      x: 0,
      y: 0,
      description: '',
      shortDescription: '',
      category: 'Other',
      images: [],
    });
    setEditingLocation(null);
    setOriginalLocation(null);
    setActiveTab('basic');
    setShowPreview(false);
    clearFormHistory();
  };

  const hasUnsavedChanges = (): boolean => {
    if (mode === 'add') {
      return formData.name.trim() !== '' || formData.description.trim() !== '' || formData.images.length > 0;
    }
    if (mode === 'edit' && originalLocation) {
      return formData.name !== originalLocation.name
        || formData.x !== originalLocation.x
        || formData.y !== originalLocation.y
        || formData.description !== originalLocation.description
        || formData.shortDescription !== (originalLocation.shortDescription || '')
        || formData.category !== originalLocation.category
        || JSON.stringify(formData.images) !== JSON.stringify(originalLocation.images || []);
    }
    return false;
  };

  const confirmDiscard = (): boolean => {
    if (!hasUnsavedChanges()) return true;
    return confirm('You have unsaved changes. Discard them?');
  };

  const handleStartAdd = () => {
    if (mode !== 'list' && !confirmDiscard()) return;
    revertAndReset();
    if (clickPosition) {
      setFormData((prev) => ({
        ...prev,
        x: Math.round(clickPosition.x),
        y: Math.round(clickPosition.y),
      }));
    }
    setMode('add');
    setIsExpanded(true);
    clearFormHistory();
  };

  const handleStartEdit = (location: MapLocation) => {
    if (mode !== 'list' && !confirmDiscard()) return;
    revertAndReset();
    setEditingLocation(location);
    setOriginalLocation({ ...location });
    const images: LocationImage[] = location.images && location.images.length > 0
      ? location.images
      : location.image
        ? [{ url: location.image, description: '' }]
        : [];
    setFormData({
      name: location.name,
      x: location.x,
      y: location.y,
      description: location.description,
      shortDescription: location.shortDescription || '',
      category: location.category,
      images,
    });
    setMode('edit');
    setIsExpanded(true);
    clearFormHistory();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const validImages = formData.images.filter(img => img.url.trim() !== '');
    const locationData = {
      name: formData.name.trim(),
      x: formData.x,
      y: formData.y,
      description: formData.description.trim(),
      shortDescription: formData.shortDescription.trim() || undefined,
      category: formData.category,
      images: validImages.length > 0 ? validImages : undefined,
    };

    if (mode === 'add') {
      onAdd(locationData);
    } else if (mode === 'edit' && editingLocation) {
      onUpdate(editingLocation.id, locationData);
    }

    resetForm();
    setMode('list');
    setIsExpanded(false);
  };

  // Revert position and clear form without prompting
  const revertAndReset = () => {
    if (mode === 'edit' && originalLocation) {
      onUpdate(originalLocation.id, { x: originalLocation.x, y: originalLocation.y });
    }
    resetForm();
  };

  const handleCancel = () => {
    if (!confirmDiscard()) return;
    revertAndReset();
    setMode('list');
    setIsExpanded(false);
  };

  // Escape key to cancel editing
  const handleCancelRef = useRef(handleCancel);
  handleCancelRef.current = handleCancel;
  useEffect(() => {
    if (mode === 'list') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancelRef.current();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mode]);

  const handleAddImage = () => {
    pushFormSnapshot();
    isInTypingGroupRef.current = false;
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, { url: '', description: '' }],
    }));
  };

  const handleUpdateImage = (index: number, field: 'url' | 'description', value: string) => {
    const prevValue = formDataRef.current.images[index]?.[field] || '';
    trackTextEdit(`image-${index}-${field}`, prevValue, value);
    const newImages = formDataRef.current.images.map((img, i) =>
      i === index ? { ...img, [field]: value } : img
    );
    formDataRef.current = { ...formDataRef.current, images: newImages };
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => 
        i === index ? { ...img, [field]: value } : img
      ),
    }));
  };

  const handleRemoveImage = (index: number) => {
    pushFormSnapshot();
    isInTypingGroupRef.current = false;
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...formData.images];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newImages.length) return;
    pushFormSnapshot();
    isInTypingGroupRef.current = false;
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this location?')) {
      onDelete(id);
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(locations, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brm5-locations.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string);
        const arr: MapLocation[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.locations)
            ? raw.locations
            : null;
        if (!arr) {
          alert('Import failed: expected a JSON array or { locations: [...] }');
          return;
        }
        const count = onImport ? onImport(arr, true) : 0;
        alert(`Imported ${count} location${count !== 1 ? 's' : ''} successfully.`);
      } catch {
        alert('Import failed: invalid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const insertMarkdown = (syntax: string, wrap: boolean = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.description;
    const selectedText = text.substring(start, end);

    let newText: string;
    let newCursorPos: number;

    if (wrap && selectedText) {
      newText = text.substring(0, start) + syntax + selectedText + syntax + text.substring(end);
      newCursorPos = end + syntax.length * 2;
    } else {
      newText = text.substring(0, start) + syntax + text.substring(end);
      newCursorPos = start + syntax.length;
    }

    pushFormSnapshot();
    isInTypingGroupRef.current = false;
    setFormData(prev => ({ ...prev, description: newText }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const filteredLocations = locations.filter(loc => {
    const matchesSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         loc.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || loc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedLocations = [...filteredLocations].sort((a, b) => a.name.localeCompare(b.name));

  if (!isOpen) return null;

  return (
    <div className={`admin-overlay ${isExpanded ? 'expanded' : ''}`}>
      <div className="admin-panel">
        <div className="admin-header">
          <div className="admin-header-left">
            <h2 className="admin-title">
              <span className="admin-title-icon">⚙</span>
              Admin Panel
            </h2>
            {mode !== 'list' && (
              <span className="admin-mode-badge">
                {mode === 'add' ? 'Adding' : 'Editing'}
              </span>
            )}
          </div>
          <div className="admin-header-actions">
            {(mode === 'add' || mode === 'edit') && (
              <button 
                className={`admin-toggle-expand ${isExpanded ? 'active' : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Collapse panel' : 'Expand panel'}
              >
                {isExpanded ? '◀' : '▶'}
              </button>
            )}
            <button className="admin-close" onClick={() => {
              if (mode !== 'list') {
                if (!confirmDiscard()) return;
                revertAndReset();
                setMode('list');
                setIsExpanded(false);
              }
              onClose();
            }}>
              <CloseIcon size={20} />
            </button>
          </div>
        </div>

        {mode === 'list' && (
          <div className="admin-list-view">
            <div className="admin-toolbar">
              <button className="admin-btn primary" onClick={handleStartAdd}>
                <span className="btn-icon">+</span>
                Add Location
              </button>
              <button className={`admin-btn${isDragMode ? ' active' : ''}`} onClick={() => setIsDragMode(!isDragMode)} title="Toggle drag mode to reposition pins">
                <span className="btn-icon">✥</span>
                {isDragMode ? 'Drag: ON' : 'Drag: OFF'}
              </button>
              <div className="admin-toolbar-group">
                <button className="admin-btn" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
                  <span className="btn-icon">↩</span>
                  Undo
                </button>
                <button className="admin-btn" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
                  <span className="btn-icon">↪</span>
                  Redo
                </button>
              </div>
              <div className="admin-toolbar-group">
                <button className="admin-btn save" onClick={onManualSave} title="Save to file">
                  <SaveIcon size={14} />
                  Save
                  {saveStatus === 'saving' && <span className="save-indicator saving">...</span>}
                  {saveStatus === 'saved' && <span className="save-indicator saved">✓</span>}
                  {saveStatus === 'error' && <span className="save-indicator error">✗</span>}
                </button>
                <button className="admin-btn" onClick={handleExport} title="Export as JSON file">
                  <span className="btn-icon">↓</span>
                  Export
                </button>
                <label className="admin-btn" title="Import locations">
                  <span className="btn-icon">↑</span>
                  Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            <div className="admin-autosave-info">
              {saveStatus === 'saving' ? 'Auto-saving...' : 
               saveStatus === 'saved' ? 'Saved to brm5-locations.json' :
               saveStatus === 'error' ? 'Auto-save failed — use Export' :
               'Changes auto-save to file'}
            </div>

            {clickPosition && (
              <div className="admin-click-info">
                <CrosshairIcon size={14} />
                <span>Clicked: X: {Math.round(clickPosition.x)}, Y: {Math.round(clickPosition.y)}</span>
              </div>
            )}

            <div className="admin-filters">
              <div className="admin-search">
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="admin-search-clear" onClick={() => setSearchQuery('')}>×</button>
                )}
              </div>
              <select
                className="admin-filter-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as LocationCategory | 'all')}
              >
                <option value="all">All Categories</option>
                {ALL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="admin-list-header">
              <span className="admin-list-count">
                {sortedLocations.length} location{sortedLocations.length !== 1 ? 's' : ''}
                {(searchQuery || filterCategory !== 'all') && ` (filtered)`}
              </span>
            </div>

            <div className="admin-list">
              {sortedLocations.map((loc) => (
                <div
                  key={loc.id}
                  className="admin-list-item"
                  style={{ '--item-color': CATEGORY_COLORS[loc.category] } as React.CSSProperties}
                >
                  <div className="admin-list-item-icon">
                    <CategoryIcon category={loc.category} size={18} color={CATEGORY_COLORS[loc.category]} />
                  </div>
                  <div className="admin-list-item-info">
                    <div className="admin-list-item-name">{loc.name}</div>
                    <div className="admin-list-item-meta">
                      <span className="admin-list-item-category">{loc.category}</span>
                      <span className="admin-list-item-coords">({loc.x}, {loc.y})</span>
                      {loc.images && loc.images.length > 0 && (
                        <span className="admin-list-item-images">📷 {loc.images.length}</span>
                      )}
                    </div>
                  </div>
                  <div className="admin-list-item-actions">
                    <button className="admin-item-btn edit" onClick={() => handleStartEdit(loc)} title="Edit">
                      ✎
                    </button>
                    <button className="admin-item-btn delete" onClick={() => handleDelete(loc.id)} title="Delete">
                      ×
                    </button>
                  </div>
                </div>
              ))}
              {sortedLocations.length === 0 && (
                <div className="admin-list-empty">
                  {searchQuery || filterCategory !== 'all' 
                    ? 'No locations match your filters'
                    : 'No locations yet. Click "Add Location" to create one.'}
                </div>
              )}
            </div>
          </div>
        )}

        {(mode === 'add' || mode === 'edit') && (
          <div className="admin-editor">
            <div className="admin-editor-tabs">
              <button 
                className={`admin-tab ${activeTab === 'basic' ? 'active' : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                Basic Info
              </button>
              <button 
                className={`admin-tab ${activeTab === 'content' ? 'active' : ''}`}
                onClick={() => setActiveTab('content')}
              >
                Description
              </button>
              <button 
                className={`admin-tab ${activeTab === 'images' ? 'active' : ''}`}
                onClick={() => setActiveTab('images')}
              >
                Images ({formData.images.length})
              </button>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
              {activeTab === 'basic' && (
                <div className="admin-tab-content">
                  <div className="admin-form-hint">
                    <CrosshairIcon size={14} />
                    <span>Click on the map to set coordinates</span>
                  </div>

                  <div className="admin-field">
                    <label>Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => onTextFieldChange('name', e.target.value)}
                      placeholder="Location name"
                      required
                    />
                  </div>

                  <div className="admin-field-row">
                    <div className="admin-field">
                      <label>X Coordinate</label>
                      <input
                        type="number"
                        value={formData.x}
                        onChange={(e) => onDiscreteChange({ x: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="admin-field">
                      <label>Y Coordinate</label>
                      <input
                        type="number"
                        value={formData.y}
                        onChange={(e) => onDiscreteChange({ y: Number(e.target.value) })}
                        required
                      />
                    </div>
                  </div>

                  <div className="admin-field">
                    <label>Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => onDiscreteChange({ category: e.target.value as LocationCategory })}
                    >
                      {ALL_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-field">
                    <label>
                      Hover Preview Text
                      <span className="admin-field-hint">(Shows when hovering over pin)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.shortDescription}
                      onChange={(e) => onTextFieldChange('shortDescription', e.target.value)}
                      placeholder="Brief description for tooltip (optional)"
                      maxLength={100}
                    />
                    <span className="admin-char-count">{formData.shortDescription.length}/100</span>
                  </div>
                </div>
              )}

              {activeTab === 'content' && (
                <div className="admin-tab-content">
                  <div className="admin-content-header">
                    <div className="admin-content-toolbar">
                      <button type="button" onClick={() => insertMarkdown('**', true)} title="Bold">
                        <strong>B</strong>
                      </button>
                      <button type="button" onClick={() => insertMarkdown('*', true)} title="Italic">
                        <em>I</em>
                      </button>
                      <button type="button" onClick={() => insertMarkdown('~~', true)} title="Strikethrough">
                        <s>S</s>
                      </button>
                      <span className="toolbar-divider" />
                      <button type="button" onClick={() => insertMarkdown('# ')} title="Heading 1">
                        H1
                      </button>
                      <button type="button" onClick={() => insertMarkdown('## ')} title="Heading 2">
                        H2
                      </button>
                      <button type="button" onClick={() => insertMarkdown('### ')} title="Heading 3">
                        H3
                      </button>
                      <span className="toolbar-divider" />
                      <button type="button" onClick={() => insertMarkdown('- ')} title="Bullet List">
                        •
                      </button>
                      <button type="button" onClick={() => insertMarkdown('1. ')} title="Numbered List">
                        1.
                      </button>
                      <button type="button" onClick={() => insertMarkdown('> ')} title="Quote">
                        "
                      </button>
                      <span className="toolbar-divider" />
                      <button type="button" onClick={() => insertMarkdown('\n---\n')} title="Divider">
                        ─
                      </button>
                      <button type="button" onClick={() => insertMarkdown('[text](url)')} title="Link">
                        🔗
                      </button>
                    </div>
                    <button 
                      type="button"
                      className={`admin-preview-toggle ${showPreview ? 'active' : ''}`}
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? '✎ Edit' : '👁 Preview'}
                    </button>
                  </div>

                  <div className={`admin-content-editor ${showPreview ? 'preview-mode' : ''}`}>
                    {!showPreview ? (
                      <textarea
                        ref={textareaRef}
                        value={formData.description}
                        onChange={(e) => onTextFieldChange('description', e.target.value)}
                        placeholder="Enter description with Markdown formatting...

Examples:
# Main Heading
## Sub Heading

**Bold text** and *italic text*

- Bullet point 1
- Bullet point 2

> Quote block

---

[Link text](https://example.com)"
                        rows={isExpanded ? 20 : 10}
                      />
                    ) : (
                      <div className="admin-preview-content">
                        <Markdown remarkPlugins={[remarkGfm]}>
                          {formData.description || '*No content yet*'}
                        </Markdown>
                      </div>
                    )}
                  </div>

                  <div className="admin-markdown-help">
                    <details>
                      <summary>Markdown Help</summary>
                      <div className="markdown-help-content">
                        <div className="markdown-help-row">
                          <code>**bold**</code>
                          <span><strong>bold</strong></span>
                        </div>
                        <div className="markdown-help-row">
                          <code>*italic*</code>
                          <span><em>italic</em></span>
                        </div>
                        <div className="markdown-help-row">
                          <code># Heading</code>
                          <span>Large heading</span>
                        </div>
                        <div className="markdown-help-row">
                          <code>- item</code>
                          <span>Bullet point</span>
                        </div>
                        <div className="markdown-help-row">
                          <code>[text](url)</code>
                          <span>Link</span>
                        </div>
                        <div className="markdown-help-row">
                          <code>---</code>
                          <span>Horizontal line</span>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              )}

              {activeTab === 'images' && (
                <div className="admin-tab-content">
                  <div className="admin-images-header">
                    <p>Add images to showcase the location. First image will be the main thumbnail.</p>
                    <button type="button" className="admin-btn primary" onClick={handleAddImage}>
                      <span className="btn-icon">+</span>
                      Add Image
                    </button>
                  </div>

                  <div className="admin-images-list">
                    {formData.images.map((img, index) => (
                      <div key={index} className="admin-image-card">
                        <div className="admin-image-card-header">
                          <span className="admin-image-number">Image {index + 1}</span>
                          <div className="admin-image-card-actions">
                            <button
                              type="button"
                              className="admin-image-move"
                              onClick={() => handleMoveImage(index, 'up')}
                              disabled={index === 0}
                              title="Move up"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="admin-image-move"
                              onClick={() => handleMoveImage(index, 'down')}
                              disabled={index === formData.images.length - 1}
                              title="Move down"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              className="admin-image-remove-btn"
                              onClick={() => handleRemoveImage(index)}
                              title="Remove image"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                        <div className="admin-image-card-body">
                          <div className="admin-image-preview">
                            {img.url ? (
                              <img src={img.url} alt={img.description || 'Preview'} />
                            ) : (
                              <div className="admin-image-placeholder">No image</div>
                            )}
                          </div>
                          <div className="admin-image-fields">
                            <input
                              type="text"
                              value={img.url}
                              onChange={(e) => handleUpdateImage(index, 'url', e.target.value)}
                              placeholder="Image URL"
                            />
                            <input
                              type="text"
                              value={img.description || ''}
                              onChange={(e) => handleUpdateImage(index, 'description', e.target.value)}
                              placeholder="Caption (optional)"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {formData.images.length === 0 && (
                      <div className="admin-images-empty">
                        No images added yet. Click "Add Image" to add one.
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="admin-form-footer">
                <button type="button" className="admin-btn" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn primary">
                  {mode === 'add' ? 'Create Location' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
