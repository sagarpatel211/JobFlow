"use client";
import React, { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Hypothetical import from a client-side TeX Live compilation library
// e.g., an NPM package or local utility that wraps texlive.js
// import { texliveCompile } from "@/lib/texCompiler"; 

// --- Types ---
export interface ResumeComponent {
  id: string;
  title: string;
  content: string;
}

export type ContainersType = Record<string, ResumeComponent[]>;

const initialData: ContainersType = {
  main: [
    {
      id: "header",
      title: "Header",
      content: "Sagar Patel\nsa24pate@uwaterloo.ca, 289-407-1209\nLinkedIn | Github | Website",
    },
    {
      id: "skills",
      title: "Skills",
      content:
        "Languages: Python, C, C++, Kotlin, HTML, CSS, Javascript, R, SQL, TypeScript, Java, Go, Scala, Bash\n" +
        "Frameworks: Node.js, Express.js, React, Next.js, React Native, Tensorflow, PyTorch, Spring Boot, Flask",
    },
    {
      id: "experience",
      title: "Experience",
      content: "Ford Motor Company, Huawei, Computer Science Club, General Dynamics, Wind River",
    },
    {
      id: "education",
      title: "Education",
      content:
        "Candidate for Bachelor of Computer Science, Honours\n" +
        "University of Waterloo\n" +
        "GPA: 86.55%\n" +
        "Relevant Coursework: Object-Oriented Programming, Data Structures, Algorithms, etc.",
    },
  ],
  holding: [
    {
      id: "projects",
      title: "Projects",
      content: "LowkeyPrepped, Utivity, JobStream, UWConnect",
    },
  ],
};

// --- SortableItem ---
const SortableItem = ({ id, title, content }: ResumeComponent) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-4 mb-2 cursor-move"
    >
      <Label className="font-bold">{title}</Label>
      <p className="text-sm whitespace-pre-wrap">{content}</p>
    </Card>
  );
};

// --- ItemOverlay ---
const ItemOverlay = ({ item }: { item: ResumeComponent }) => {
  return (
    <Card className="p-4">
      <Label className="font-bold">{item.title}</Label>
      <p className="text-sm whitespace-pre-wrap">{item.content}</p>
    </Card>
  );
};

// --- DroppableZone ---
const DroppableZone: React.FC<{ id: string; children: React.ReactNode }> = ({
  id,
  children,
}) => {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef} className="min-h-[100px]">{children}</div>;
};

// --- ResumeBuilder ---
interface ResumeBuilderProps {
  onChange: (containers: ContainersType) => void;
}

const ResumeBuilder = ({ onChange }: ResumeBuilderProps) => {
  const [containers, setContainers] = useState<ContainersType>(initialData);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  // Update parent state whenever resume data changes.
  const updateContainers = (newContainers: ContainersType) => {
    setContainers(newContainers);
    onChange(newContainers);
  };

  const getItemById = (id: string): ResumeComponent | null => {
    for (const key of Object.keys(containers)) {
      const found = containers[key].find((item) => item.id === id);
      if (found) return found;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeContainer = Object.keys(containers).find((key) =>
      containers[key].some((item) => item.id === active.id)
    );
    let overContainer = Object.keys(containers).find((key) =>
      containers[key].some((item) => item.id === over.id)
    );
    if (!overContainer) {
      if (over.id === "main-zone") overContainer = "main";
      else if (over.id === "holding-zone") overContainer = "holding";
    }
    if (!activeContainer || !overContainer) return;

    // Same container: reorder the array.
    if (activeContainer === overContainer) {
      const items = containers[activeContainer];
      const oldIndex = items.findIndex((item) => item.id === active.id);
      let newIndex = items.findIndex((item) => item.id === over.id);
      if (newIndex === -1) newIndex = items.length;
      updateContainers({
        ...containers,
        [activeContainer]: arrayMove(items, oldIndex, newIndex),
      });
    } else {
      // Moving to a different container.
      const activeItem = containers[activeContainer].find(
        (item) => item.id === active.id
      );
      if (!activeItem) return;
      updateContainers({
        ...containers,
        [activeContainer]: containers[activeContainer].filter(
          (item) => item.id !== active.id
        ),
        [overContainer]: [...containers[overContainer], activeItem],
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Resume Builder</h2>
        <div className="border rounded-lg p-4 min-h-[300px]">
          <h3 className="font-semibold mb-2">Main Resume Components</h3>
          <DroppableZone id="main-zone">
            <SortableContext
              items={containers.main.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {containers.main.map((item) => (
                <SortableItem key={item.id} {...item} />
              ))}
            </SortableContext>
          </DroppableZone>
        </div>
        <div className="border rounded-lg p-4 min-h-[150px]">
          <h3 className="font-semibold mb-2">Holding Zone (Unused Components)</h3>
          <DroppableZone id="holding-zone">
            <SortableContext
              items={containers.holding.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {containers.holding.map((item) => (
                <SortableItem key={item.id} {...item} />
              ))}
            </SortableContext>
          </DroppableZone>
        </div>
      </div>
      <DragOverlay>
        {activeId && getItemById(activeId) && (
          <ItemOverlay item={getItemById(activeId)!} />
        )}
      </DragOverlay>
    </DndContext>
  );
};

// --- PDF Generation Helpers ---

// 1) Build a LaTeX document from resume data.
const generateLatexFromResume = (data: ContainersType): string => {
  let latex = `
\\documentclass{article}
\\usepackage[margin=1in]{geometry}
\\begin{document}
`;
  // For each "zone" (like main/holding), we can create sections or skip the "holding" if you only want the main
  // For demonstration, let's transform every container into a separate section
  for (const zone of Object.keys(data)) {
    latex += `\\section*{${zone.toUpperCase()}}\n`;
    data[zone].forEach((comp) => {
      latex += `\\subsection*{${comp.title}}\n`;
      // Convert newlines to LaTeX line breaks
      latex += comp.content.replace(/\n/g, "\\\\") + "\n\n";
    });
  }
  latex += "\\end{document}";
  return latex;
};

// 2) Actually compile the LaTeX to a PDF with a real client-side LaTeX compiler
//    E.g., from texlive.js or another WASM-based approach.
const compileLatexToPDF = async (latex: string): Promise<Uint8Array> => {
  // Here is where you'd call your actual compile method. For example:
  // const pdfBytes = await texliveCompile(latex);
  // return pdfBytes;

  throw new Error("No actual compiler implemented. Add your WASM TeX library here!");
};

// --- ResumeSection Component ---
const ResumeSection = () => {
  const [resumeData, setResumeData] = useState<ContainersType>(initialData);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [compiling, setCompiling] = useState(false);

  // Debounce: track a timer to avoid immediate regeneration on every drag
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const handleResumeChange = useCallback((data: ContainersType) => {
    setResumeData(data);
  }, []);

  const generatePDF = async () => {
    setCompiling(true);
    const latex = generateLatexFromResume(resumeData);
    try {
      const pdfBytes = await compileLatexToPDF(latex);
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error("PDF compilation error", err);
      setPdfUrl(null);
    } finally {
      setCompiling(false);
    }
  };

  // Whenever resumeData changes, wait 500ms, then compile.
  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);

    const newTimer = setTimeout(() => {
      generatePDF();
    }, 500);
    setDebounceTimer(newTimer);

    return () => {
      if (newTimer) clearTimeout(newTimer);
    };
  }, [resumeData]);

  return (
    <div className="p-6">
      <div className="w-full flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="flex-1">
            {/* The ResumeBuilder. All changes flow up via handleResumeChange */}
            <ResumeBuilder onChange={handleResumeChange} />
          </div>
          <div className="flex-1 border border-dashed rounded-lg p-4 min-h-[300px] flex flex-col">
            <span className="text-center mb-2">Resume PDF Preview</span>
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                title="Resume PDF"
                className="w-full h-full border"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                {compiling ? <span>Compiling PDF...</span> : <span>No PDF generated yet.</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeSection;
