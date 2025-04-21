"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Tag } from "lucide-react";
import { getTagsWithCounts, TagWithCount } from "../services/api";

interface FilterBadgesProps {
  onSelectTag: (tag: string | null) => void;
  selectedTag: string | null;
  onRefreshTagsFunc?: (refresh: () => Promise<void>) => void;
}

function useFiltersData(loadTags = true) {
  const [tags, setTags] = useState<string[]>([]);
  const [tagsWithCounts, setTagsWithCounts] = useState<TagWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshTags = useCallback(async () => {
    if (!loadTags) return;
    try {
      setLoading(true);
      const data = await getTagsWithCounts();
      setTagsWithCounts(data);
      setTags(data.map((t) => t.name));
    } finally {
      setLoading(false);
    }
  }, [loadTags]);

  useEffect(() => {
    void refreshTags();
  }, [refreshTags]);

  return { tags, tagsWithCounts, loading, refreshTags };
}

export default function FilterBadges({ onSelectTag, selectedTag, onRefreshTagsFunc }: FilterBadgesProps) {
  const { tags, tagsWithCounts, loading, refreshTags } = useFiltersData();
  const tagCountMap = useMemo(
    () => tagsWithCounts.reduce<Record<string, number>>((acc, t) => ({ ...acc, [t.name]: Number(t.job_count) || 0 }), {}),
    [tagsWithCounts],
  );

  const wired = useRef(false);
  useEffect(() => {
    if (!wired.current && onRefreshTagsFunc) {
      wired.current = true;
      onRefreshTagsFunc(refreshTags);
    }
  }, [refreshTags, onRefreshTagsFunc]);

  return (
    <div className="flex flex-col my-4 pb-4 border-b">
      <div className="flex items-center mb-3 gap-2">
        <h3 className="text-lg font-semibold">Tag Filters</h3>
        {!loading && <span className="text-sm text-gray-500">{tags.length} unique tags</span>}
      </div>
      {loading ? (
        <div className="animate-pulse flex flex-wrap gap-2 mt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 mt-1">
          <button
            onClick={() => onSelectTag(null)}
            className={`flex items-center px-3 py-1.5 rounded-full text-sm transition-colors ${
              selectedTag === null ? "bg-gray-200 text-gray-800 font-medium" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Tag className="h-4 w-4 mr-1.5" />
            All Tags
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onSelectTag(tag)}
              className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedTag === tag
                  ? "bg-gradient-to-r from-blue-600 to-indigo-800 text-white shadow-sm"
                  : "bg-gradient-to-r from-blue-600/10 to-indigo-800/10 text-indigo-900 hover:from-blue-600/20 hover:to-indigo-800/20"
              }`}
            >
              {tag}
              <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-gray-700/10">{tagCountMap[tag] ?? 0}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
