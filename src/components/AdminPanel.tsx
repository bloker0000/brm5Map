import { useState, useEffect } from 'react';
import type { MapLocation, LocationCategory } from '../types/location';
import { CATEGORY_COLORS } from '../types/location';
import { CloseIcon, CrosshairIcon } from './Icons';
import './AdminPanel.css';

const ALL_CATEGORIES: LocationCategory[] = [
  'Spawnpoint',
  'Building',
  'Residence',
  'Office Building Small',
  'Office Building Large',
  'Extraction Point',
  'Enemy Outpost',
  'Zombie Nest',
  'Key Spawn Location',
  'Key Use Location',
  'Quarantine Zone',
  'Medical',
  'Shop',
  'Landmark',
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
}

export function AdminPanel({
  isOpen,
  onClose,
  locations,
  onAdd,
  onUpdate,
  onDelete,
  clickPosition,
}: AdminPanelProps) {
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingLocation, setEditingLocation] = useState<MapLocation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    x: 0,
    y: 0,
    description: '',
    category: 'Other' as LocationCategory,
    image: '',
  });

  useEffect(() => {
    if (clickPosition && (mode === 'add' || mode === 'edit')) {
      setFormData((prev) => ({
        ...prev,
        x: Math.round(clickPosition.x),
        y: Math.round(clickPosition.y),
      }));
    }
  }, [clickPosition, mode]);

  const resetForm = () => {
    setFormData({
      name: '',
      x: 0,
      y: 0,
      description: '',
      category: 'Other',
      image: '',
    });
    setEditingLocation(null);
  };

  const handleStartAdd = () => {
    resetForm();
    if (clickPosition) {
      setFormData((prev) => ({
        ...prev,
        x: Math.round(clickPosition.x),
        y: Math.round(clickPosition.y),
      }));
    }
    setMode('add');
  };

  const handleStartEdit = (location: MapLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      x: location.x,
      y: location.y,
      description: location.description,
      category: location.category,
      image: location.image || '',
    });
    setMode('edit');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) return;

    const locationData = {
      name: formData.name.trim(),
      x: formData.x,
      y: formData.y,
      description: formData.description.trim(),
      category: formData.category,
      image: formData.image.trim() || undefined,
    };

    if (mode === 'add') {
      onAdd(locationData);
    } else if (mode === 'edit' && editingLocation) {
      onUpdate(editingLocation.id, locationData);
    }

    resetForm();
    setMode('list');
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
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          imported.forEach((loc: MapLocation) => {
            onAdd({
              name: loc.name,
              x: loc.x,
              y: loc.y,
              description: loc.description,
              category: loc.category,
              image: loc.image,
            });
          });
        }
      } catch (err) {
        alert('Failed to import locations. Invalid JSON format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="admin-overlay">
      <div className="admin-panel">
        <div className="admin-header">
          <h2 className="admin-title">Admin Panel</h2>
          <button className="admin-close" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>

        {mode === 'list' && (
          <>
            <div className="admin-actions">
              <button className="admin-btn primary" onClick={handleStartAdd}>
                Add Location
              </button>
              <button className="admin-btn" onClick={handleExport}>
                Export
              </button>
              <label className="admin-btn">
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {clickPosition && (
              <div className="admin-click-info">
                <CrosshairIcon size={14} /> X: {Math.round(clickPosition.x)}, Y: {Math.round(clickPosition.y)}
              </div>
            )}

            <div className="admin-list">
              <div className="admin-list-header">
                {locations.length} location{locations.length !== 1 ? 's' : ''}
              </div>
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className="admin-list-item"
                  style={{ '--item-color': CATEGORY_COLORS[loc.category] } as React.CSSProperties}
                >
                  <div className="admin-list-item-info">
                    <div className="admin-list-item-name">{loc.name}</div>
                    <div className="admin-list-item-meta">
                      {loc.category} ({loc.x}, {loc.y})
                    </div>
                  </div>
                  <div className="admin-list-item-actions">
                    <button onClick={() => handleStartEdit(loc)}>Edit</button>
                    <button className="danger" onClick={() => handleDelete(loc.id)}>
                      Del
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {(mode === 'add' || mode === 'edit') && (
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-form-title">
              {mode === 'add' ? 'Add New Location' : 'Edit Location'}
            </div>

            <div className="admin-form-hint">
              <CrosshairIcon size={14} /> Click on the map to set coordinates
            </div>

            <label className="admin-field">
              <span>Name</span>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </label>

            <div className="admin-field-row">
              <label className="admin-field">
                <span>X</span>
                <input
                  type="number"
                  value={formData.x}
                  onChange={(e) => setFormData({ ...formData, x: Number(e.target.value) })}
                  required
                />
              </label>
              <label className="admin-field">
                <span>Y</span>
                <input
                  type="number"
                  value={formData.y}
                  onChange={(e) => setFormData({ ...formData, y: Number(e.target.value) })}
                  required
                />
              </label>
            </div>

            <label className="admin-field">
              <span>Category</span>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as LocationCategory })
                }
              >
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span>Description</span>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </label>

            <label className="admin-field">
              <span>Image URL (optional)</span>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/image.png"
              />
            </label>

            <div className="admin-form-actions">
              <button type="button" className="admin-btn" onClick={() => setMode('list')}>
                Cancel
              </button>
              <button type="submit" className="admin-btn primary">
                {mode === 'add' ? 'Add' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
