"use client";
import React, { useEffect, useState } from "react";
import { getFolders, getTags } from "../services/api";
import { Folder } from "@/types/job";
import { Tag, FolderClosed } from "lucide-react";

interface FilterBadgesProps {
  onSelectFolder: (folderId: number | null) => void;
  onSelectTag: (tag: string | null) => void;
  selectedFolder: number | null;
  selectedTag: string | null;
}

export default function FilterBadges({ onSelectFolder, onSelectTag, selectedFolder, selectedTag }: FilterBadgesProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"folders" | "tags">("folders");

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [folderData, tagData] = await Promise.all([getFolders(), getTags()]);
        setFolders(folderData);
        setTags(tagData);
      } catch (error) {
        console.error("Error loading filters:", error);
      }
    };

    loadFilters();
  }, []);

  return (
    <div className="flex flex-col my-4 pb-4 border-b">
      <div className="flex items-center mb-3 gap-2">
        <h3 className="text-lg font-semibold">Quick Filters</h3>
        <div className="ml-4 rounded-md bg-muted p-1 inline-flex">
          <button
            className={`px-3 py-1.5 text-sm rounded-sm font-medium flex items-center gap-1.5 transition-colors ${activeTab === "folders" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setActiveTab("folders")}
          >
            <FolderClosed className="h-4 w-4" />
            Folders
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded-sm font-medium flex items-center gap-1.5 transition-colors ${activeTab === "tags" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setActiveTab("tags")}
          >
            <Tag className="h-4 w-4" />
            Tags
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-1">
        {activeTab === "folders" ? (
          <>
            <button
              onClick={() => onSelectFolder(null)}
              className={`flex items-center px-3 py-1.5 rounded-full text-sm transition-colors ${
                selectedFolder === null
                  ? "bg-gray-200 text-gray-800 font-medium"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All Folders
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => onSelectFolder(folder.id)}
                className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedFolder === folder.id
                    ? "text-white shadow-sm"
                    : "text-gray-700 bg-opacity-20 hover:bg-opacity-30"
                }`}
                style={{
                  backgroundColor: selectedFolder === folder.id ? folder.color : folder.color + "20",
                  borderColor: folder.color,
                }}
              >
                {folder.name}
              </button>
            ))}
          </>
        ) : (
          <>
            <button
              onClick={() => onSelectTag(null)}
              className={`flex items-center px-3 py-1.5 rounded-full text-sm transition-colors ${
                selectedTag === null
                  ? "bg-gray-200 text-gray-800 font-medium"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
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
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
