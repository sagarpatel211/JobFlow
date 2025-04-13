import { ReactNode } from "react";

// Resume component types
export interface Word {
  text: string;
  bold: boolean;
}

export interface ResumeComponent {
  id: string;
  title: string;
  content: Word[] | string;
}

export type ContainersType = Record<string, ResumeComponent[]>;

// Component props
export interface SortableItemProps extends ResumeComponent {
  onWordToggle?: (componentId: string, wordIndex: number) => void;
}

export interface ResumeBuilderProps {
  onChange: (containers: ContainersType) => void;
}

export interface DroppableZoneProps {
  id: string;
  children: ReactNode;
}

export interface ItemOverlayProps {
  item: ResumeComponent;
}

export interface SectionDropdownProps {
  sectionId: string;
}
