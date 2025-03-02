"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

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
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";

interface ResumeComponent {
  id: string;
  title: string;
  content: string;
}

const initialData: Record<string, ResumeComponent[]> = {
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
        "Languages: Python, C, C++, Kotlin, HTML, CSS, Javascript, R, SQL, TypeScript, Java, Go, Scala, Bash\nFrameworks: Node.js, Express.js, React, Next.js, React Native, Tensorflow, PyTorch, Spring Boot, Flask",
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
        "Candidate for Bachelor of Computer Science, Honours\nUniversity of Waterloo\nGPA: 86.55%\nRelevant Coursework: Object-Oriented Programming, Data Structures, Algorithms, etc.",
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

const SortableItem = ({ id, title, content }: ResumeComponent) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} {...attributes} {...listeners} className="p-4 mb-2 cursor-move">
      <Label className="font-bold">{title}</Label>
      <p className="text-sm whitespace-pre-wrap">{content}</p>
    </Card>
  );
};

const ItemOverlay = ({ item }: { item: ResumeComponent }) => {
  return (
    <Card className="p-4">
      <Label className="font-bold">{item.title}</Label>
      <p className="text-sm whitespace-pre-wrap">{item.content}</p>
    </Card>
  );
};

const DroppableZone: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="min-h-[100px]">
      {children}
    </div>
  );
};

const ResumeBuilder = () => {
  const [containers, setContainers] = useState<Record<string, ResumeComponent[]>>(initialData);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

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
      containers[key].some((item) => item.id === active.id),
    );

    let overContainer = Object.keys(containers).find((key) => containers[key].some((item) => item.id === over.id));
    if (overContainer == null || overContainer === "") {
      if (over.id === "main-zone") {
        overContainer = "main";
      } else if (over.id === "holding-zone") {
        overContainer = "holding";
      }
    }
    if (activeContainer == null || activeContainer === "" || overContainer == null || overContainer === "") return;

    if (activeContainer === overContainer) {
      const items = containers[activeContainer];
      const oldIndex = items.findIndex((item) => item.id === active.id);
      let newIndex = items.findIndex((item) => item.id === over.id);
      if (newIndex === -1) newIndex = items.length;
      setContainers({
        ...containers,
        [activeContainer]: arrayMove(items, oldIndex, newIndex),
      });
    } else {
      const activeItem = containers[activeContainer].find((item) => item.id === active.id);
      if (!activeItem) return;
      setContainers({
        ...containers,
        [activeContainer]: containers[activeContainer].filter((item) => item.id !== active.id),
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
      onDragCancel={() => {
        setActiveId(null);
      }}
    >
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Resume Builder</h2>
        <div className="border rounded-lg p-4 min-h-[300px]">
          <h3 className="font-semibold mb-2">Main Resume Components</h3>
          <DroppableZone id="main-zone">
            <SortableContext items={containers.main.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              {containers.main.map((item) => (
                <SortableItem key={item.id} {...item} />
              ))}
            </SortableContext>
          </DroppableZone>
        </div>
        <div className="border rounded-lg p-4 min-h-[150px]">
          <h3 className="font-semibold mb-2">Holding Zone (Unused Components)</h3>
          <DroppableZone id="holding-zone">
            <SortableContext items={containers.holding.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              {containers.holding.map((item) => (
                <SortableItem key={item.id} {...item} />
              ))}
            </SortableContext>
          </DroppableZone>
        </div>
      </div>
      <DragOverlay>
        {activeId !== null && activeId !== "" && getItemById(activeId) ? (
          <ItemOverlay item={getItemById(activeId) as ResumeComponent} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

const ResumeSection = () => {
  return (
    <div className="p-6">
      <div className="w-full flex gap-4">
        <div className="flex-1">
          <ResumeBuilder />
        </div>
        <div className="flex-1 border border-dashed rounded-lg p-4 min-h-[300px] flex items-center justify-center">
          <span>Resume PDF Preview</span>
        </div>
      </div>
    </div>
  );
};

const GenerateAppPage = () => {
  const [coverLetterEnabled, setCoverLetterEnabled] = useState(true);
  const [resumeEnabled, setResumeEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowResults(false);
    setTimeout(() => {
      setLoading(false);
      setShowResults(true);
    }, 5000);
  };

  const handleClear = () => {
    setShowResults(false);
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-4 relative">
      <h1 className="text-4xl sticky top-0 z-[10] p-6 bg-background/50 backdrop-blur-lg flex items-center border-b">
        Generate Application
      </h1>
      <div className="flex gap-8 items-center p-6">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={coverLetterEnabled}
            onCheckedChange={(checked) => {
              setCoverLetterEnabled(checked === true);
            }}
          />
          <Label>Cover Letter</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={resumeEnabled}
            onCheckedChange={(checked) => {
              setResumeEnabled(checked === true);
            }}
          />
          <Label>Resume</Label>
        </div>
      </div>
      {coverLetterEnabled && (
        <div className="flex gap-8 p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-1/2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" placeholder="Company Name" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="roleName">Role Name</Label>
              <Input id="roleName" placeholder="Role Name" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="companyAddress">Company Address</Label>
              <Input id="companyAddress" placeholder="Company Address" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="jobPosting">Job Posting</Label>
              <Textarea id="jobPosting" placeholder="Paste job posting here..." />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="dateField">Date</Label>
              <Input id="dateField" type="date" />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Generating..." : "Submit"}
            </Button>
          </form>
          <div className="w-1/2 flex flex-col gap-4">
            {loading && (
              <div className="flex flex-col items-center justify-center h-96">
                <Loader2 className="animate-spin" size={48} />
                <span className="mt-4">Generating PDF...</span>
              </div>
            )}
            {showResults && loading && (
              <>
                <div className="border border-dashed h-96 flex items-center justify-center">
                  <span>Empty PDF</span>
                </div>
                <div className="flex flex-col gap-2">
                  <Progress value={50} className="h-4" />
                  <p className="text-sm text-muted-foreground">
                    ATS Score: 50%. This score indicates that your profile partially matches the job posting
                    requirements.
                  </p>
                </div>
                <Button variant="destructive" onClick={handleClear}>
                  Clear
                </Button>
              </>
            )}
          </div>
        </div>
      )}
      {resumeEnabled && <ResumeSection />}
    </div>
  );
};

export default GenerateAppPage;
