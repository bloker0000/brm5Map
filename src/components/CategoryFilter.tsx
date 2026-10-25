import type { LocationCategory } from '../types/location';
import { CATEGORY_COLORS } from '../types/location';
import { CategoryIcon } from './Icons';
import './CategoryFilter.css';

interface CategoryFilterProps {
  categories: LocationCategory[];
  counts: Record<LocationCategory, number>;
  selectedCategories: Set<LocationCategory>;
  onToggle: (category: LocationCategory) => void;
  onClear: () => void;
}

export function CategoryFilter({
  categories,
  counts,
  selectedCategories,
  onToggle,
  onClear,
}: CategoryFilterProps) {
  const hasFilters = selectedCategories.size > 0;

  return (
    <div className="category-filter">
      <div className="brm-section-title">
        <h2>Categories</h2>
        {hasFilters && (
          <button className="brm-btn category-filter-clear" onClick={onClear}>
            Clear
          </button>
        )}
      </div>
      <div className="brm-box category-filter-box">
        <div className="category-filter-list">
          {categories.map((category) => {
            const isShown = !hasFilters || selectedCategories.has(category);

            return (
              <button
                key={category}
                className={`brm-btn category-filter-item${isShown ? '' : ' off-map'}`}
                aria-pressed={selectedCategories.has(category)}
                onClick={() => onToggle(category)}
              >
                <CategoryIcon category={category} size={16} color={isShown ? CATEGORY_COLORS[category] : '#646464'} />
                <span className="category-name">{category}</span>
                <span className="category-count tabular">{counts[category]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
