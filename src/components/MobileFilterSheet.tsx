import React from "react";

type MobileFilterSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onApply?: () => void;
  sortBy?: string;
  onSortChange?: (val: string) => void;
  categories?: string[];
  selectedCategories?: string[];
  onToggleCategory?: (category: string) => void;
  priceMin?: number;
  priceMax?: number;
  onPriceRangeChange?: (min: number, max: number) => void;
  priceBounds?: { min: number; max: number };
  activeFilter?: string;
  onActiveFilterChange?: (filter: string) => void;
  rooms?: { name: string }[];
  selectedRooms?: string[];
  onToggleRoom?: (room: string) => void;
  roomCounts?: { [key: string]: number };
};

const QUICK_FILTER_OPTIONS = ['All', '2-Set', '3-Set', 'Square', 'Circle', 'Landscape'] as const;

const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

export function MobileFilterSheet(props: MobileFilterSheetProps) {
  const {
    isOpen,
    onClose,
    onApply,
    sortBy,
    onSortChange,
    categories = [],
    selectedCategories = [],
    onToggleCategory,
    priceMin,
    priceMax,
    onPriceRangeChange,
    priceBounds,
    activeFilter = 'All',
    onActiveFilterChange,
    rooms = [],
    selectedRooms = [],
    onToggleRoom,
    roomCounts = {},
  } = props;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true" role="dialog" data-lenis-prevent>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 rounded-t-3xl bg-white shadow-2xl border-t border-gray-100 animate-mobileSheet overflow-hidden flex flex-col">
        <div className="mx-auto mb-1 h-1.5 w-10 rounded-full bg-gray-300" />
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Filters</h2>
          <button onClick={onClose} className="px-3 py-1 rounded-lg border text-gray-700">Close</button>
        </div>
        <div className="px-6 py-4 overflow-y-auto space-y-8 flex-1" data-lenis-prevent>
          {/* Quick Filters - Same as Desktop */}
          {onActiveFilterChange && (
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter By Type</h3>
              <div className="flex flex-wrap gap-2">
                {QUICK_FILTER_OPTIONS.map((opt) => {
                  const active = activeFilter === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => onActiveFilterChange(opt)}
                      className="px-4 py-2 rounded-full border text-sm"
                      style={{
                        backgroundColor: active ? "#14b8a6" : "#f9fafb",
                        color: active ? "#ffffff" : "#374151",
                        borderColor: active ? "#14b8a6" : "#e5e7eb",
                        fontWeight: 600,
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Decor by Space - Same as Desktop */}
          {rooms.length > 0 && onToggleRoom && (
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Decor by Space</h3>
              <div className="space-y-2">
                {rooms.map((room) => {
                  const isChecked = selectedRooms.includes(room.name);
                  return (
                    <label key={room.name} className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleRoom(room.name)}
                          className="mr-2"
                          style={{ accentColor: '#14b8a6' }}
                        />
                        <span className="text-sm" style={{ color: '#4b5563' }}>
                          {room.name}
                        </span>
                      </div>
                      <span className="text-xs" style={{ color: '#94a3b8' }}>({roomCounts[room.name] || 0})</span>
                    </label>
                  );
                })}
              </div>
            </section>
          )}



          {categories.length > 0 && onToggleCategory && (
            <section>
              <h3 className="text-sm font-semibold text-gray-700">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const active = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => onToggleCategory(cat)}
                      className="px-6 py-1.5 rounded-full border text-sm mt-2"
                      style={{
                        backgroundColor: active ? "#14b8a6" : "#f9fafb",
                        color: active ? "#ffffff" : "#374151",
                        borderColor: active ? "#14b8a6" : "#e5e7eb",
                        fontWeight: 600,
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {onPriceRangeChange !== undefined && priceMin !== undefined && priceMax !== undefined && (
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Price Range</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Less than 1000", min: 0, max: 999 },
                  { label: "1000 - 2000", min: 1000, max: 2000 },
                  { label: "2000 - 3000", min: 2000, max: 3000 },
                  { label: "3000 - 4000", min: 3000, max: 4000 },
                  { label: "Greater than 4000", min: 4000, max: (priceBounds?.max ?? 10000) },
                ].map((b) => {
                  const active = (priceMin as number) === b.min && (priceMax as number) === b.max;
                  return (
                    <button
                      key={b.label}
                      className="px-3 py-2 rounded-xl border text-sm text-left"
                      style={{
                        backgroundColor: active ? "#14b8a6" : "#f9fafb",
                        color: active ? "#ffffff" : "#374151",
                        borderColor: active ? "#14b8a6" : "#e5e7eb",
                        fontWeight: 600,
                      }}
                      onClick={() => onPriceRangeChange(b.min, b.max)}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
        <div className="px-4 py-3 border-t flex items-center gap-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}>
          <button
            className="flex-1 py-3 rounded-xl text-white font-semibold"
            style={{ backgroundColor: "#14b8a6" }}
            onClick={() => { onApply?.(); onClose(); }}
          >
            Apply Filters
          </button>
          <button className="px-4 py-3 rounded-xl border font-semibold text-gray-700" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
