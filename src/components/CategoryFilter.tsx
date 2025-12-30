import type { LocationCategory } from '../types/location';
import { CATEGORY_COLORS } from '../types/location';
import { CategoryIcon } from './Icons';
import './CategoryFilter.css';

interface CategoryFilterProps {
  categories: LocationCategory[];
  selectedCategories: Set<LocationCategory>;
  onToggle: (category: LocationCategory) => void;
  onClear: () => void;
}

export function CategoryFilter({
  categories,
  selectedCategories,
  onToggle,
  onClear,
}: CategoryFilterProps) {
  const hasFilters = selectedCategories.size > 0;

  return (
    <div className="category-filter">
      <div className="category-filter-header">
        <span className="category-filter-title">Categories</span>
        {hasFilters && (
          <button className="category-filter-clear" onClick={onClear}>
            Clear
          </button>
        )}
      </div>
      <div className="category-filter-list">
        {categories.map((category) => {
          const isActive = selectedCategories.size === 0 || selectedCategories.has(category);
          const color = CATEGORY_COLORS[category];

          return (
            <button
              key={category}
              className={`category-filter-item ${isActive ? 'active' : 'inactive'}`}
              style={{ '--cat-color': color } as React.CSSProperties}
              onClick={() => onToggle(category)}
            >
              <span className="category-icon">
                <CategoryIcon category={category} size={16} color={isActive ? color : '#666'} />
              </span>
              <span className="category-name">{category}</span>
              <span className="category-indicator" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
