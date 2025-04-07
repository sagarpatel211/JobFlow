// "use client";
// import React, { useState, useCallback, useEffect } from "react";
// import { Card } from "@/components/ui/card";
// import { Label } from "@/components/ui/label";
// import {
//   DndContext,
//   DragEndEvent,
//   DragStartEvent,
//   DragOverlay,
//   closestCenter,
//   PointerSensor,
//   useSensor,
//   useSensors,
//   useDroppable,
// } from "@dnd-kit/core";
// import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
// import { CSS } from "@dnd-kit/utilities";
// import {
//   DropdownMenu,
//   DropdownMenuTrigger,
//   DropdownMenuContent,
//   DropdownMenuItem,
// } from "@/components/ui/dropdown-menu";

// export interface Word {
//   text: string;
//   bold: boolean;
// }

// export interface ResumeComponent {
//   id: string;
//   title: string;
//   content: Word[];
// }

// export type ContainersType = Record<string, ResumeComponent[]>;

// export const parseContent = (text: string): Word[] => text.split(/\s+/).map((word) => ({ text: word, bold: false }));

// export const generateLatexFromResume = (data: ContainersType): string => {
//   let latex = `\n\\documentclass{article}\n\\usepackage[margin=1in]{geometry}\n\\begin{document}\n`;
//   Object.keys(data).forEach((zone) => {
//     latex += `\\section*{${zone.toUpperCase()}}\n`;
//     data[zone].forEach((comp) => {
//       latex += `\\subsection*{${comp.title}}\n`;
//       const contentText = comp.content.map((word) => (word.bold ? `\\textbf{${word.text}}` : word.text)).join(" ");
//       latex += contentText + "\n\n";
//     });
//   });
//   latex += "\\end{document}";
//   return latex;
// };

// const initialData: ContainersType = {
//   main: [
//     {
//       id: "header",
//       title: "Header",
//       content: parseContent("Sagar Patel sa24pate@uwaterloo.ca, 289-407-1209 LinkedIn | Github | Website"),
//     },
//     {
//       id: "skills",
//       title: "Skills",
//       content: parseContent(
//         "Languages: Python, C, C++, Kotlin, HTML, CSS, Javascript, R, SQL, TypeScript, Java, Go, Scala, Bash Frameworks: Node.js, Express.js, React, Next.js, React Native, Tensorflow, PyTorch, Spring Boot, Flask",
//       ),
//     },
//     {
//       id: "experience",
//       title: "Experience",
//       content: parseContent("Ford Motor Company, Huawei, Computer Science Club, General Dynamics, Wind River"),
//     },
//     {
//       id: "education",
//       title: "Education",
//       content: parseContent(
//         "Candidate for Bachelor of Computer Science, Honours University of Waterloo GPA: 86.55% Relevant Coursework: Object-Oriented Programming, Data Structures, Algorithms, etc.",
//       ),
//     },
//   ],
//   holding: [
//     {
//       id: "projects",
//       title: "Projects",
//       content: parseContent("LowkeyPrepped, Utivity, JobStream, UWConnect"),
//     },
//   ],
// };

// export const SectionDropdown = ({ sectionId }: { sectionId: string }) => {
//   const handleAction = (action: string) => {
//     console.log(`Action "${action}" selected for section ${sectionId}`);
//   };
//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger className="p-1">
//         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
//           <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 3a2 2 0 110-4 2 2 0 010 4zm0 3a2 2 0 110-4 2 2 0 010 4z" />
//         </svg>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent align="end" className="min-w-[200px]">
//         <DropdownMenuItem onClick={() => handleAction("Longer with AI")}>Longer with AI</DropdownMenuItem>
//         <DropdownMenuItem onClick={() => handleAction("Shorten with AI")}>Shorten with AI</DropdownMenuItem>
//         <DropdownMenuItem onClick={() => handleAction("Perfect ATS based on Job posting")}>
//           Perfect ATS based on Job posting
//         </DropdownMenuItem>
//       </DropdownMenuContent>
//     </DropdownMenu>
//   );
// };

// interface SortableItemProps extends ResumeComponent {
//   onWordToggle: (componentId: string, wordIndex: number) => void;
// }
// export const SortableItem = ({ id, title, content, onWordToggle }: SortableItemProps) => {
//   const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
//   const style = {
//     transform: CSS.Transform.toString(transform),
//     transition,
//     opacity: isDragging ? 0 : 1,
//   };
//   return (
//     <Card ref={setNodeRef} style={style} {...attributes} {...listeners} className="p-4 mb-2 cursor-move relative">
//       <div className="absolute top-2 right-2">
//         <SectionDropdown sectionId={id} />
//       </div>
//       <Label className="font-bold">{title}</Label>
//       <p className="text-sm whitespace-pre-wrap">
//         {content.map((word, index) => (
//           <span
//             key={index}
//             onClick={(e) => {
//               e.stopPropagation();
//               onWordToggle(id, index);
//             }}
//             className={`cursor-pointer select-none ${word.bold ? "font-bold" : ""}`}
//           >
//             {word.text}{" "}
//           </span>
//         ))}
//       </p>
//     </Card>
//   );
// };

// export const ItemOverlay = ({ item }: { item: ResumeComponent }) => (
//   <Card className="p-4">
//     <Label className="font-bold">{item.title}</Label>
//     <p className="text-sm whitespace-pre-wrap">
//       {item.content.map((word, index) => (
//         <span key={index} className={word.bold ? "font-bold" : ""}>
//           {word.text}{" "}
//         </span>
//       ))}
//     </p>
//   </Card>
// );

// export const DroppableZone = ({ id, children }: { id: string; children: React.ReactNode }) => {
//   const { setNodeRef } = useDroppable({ id });
//   return (
//     <div ref={setNodeRef} className="min-h-[100px]">
//       {children}
//     </div>
//   );
// };

// export const ResumeBuilder = ({ onChange }: { onChange: (containers: ContainersType) => void }) => {
//   const [containers, setContainers] = useState<ContainersType>(initialData);
//   const [activeId, setActiveId] = useState<string | null>(null);
//   const sensors = useSensors(useSensor(PointerSensor));
//   const updateContainers = (newContainers: ContainersType) => {
//     setContainers(newContainers);
//     onChange(newContainers);
//   };
//   const toggleWordBold = (componentId: string, wordIndex: number) => {
//     const newContainers = { ...containers };
//     for (const zone in newContainers) {
//       const compIndex = newContainers[zone].findIndex((comp) => comp.id === componentId);
//       if (compIndex !== -1) {
//         const component = newContainers[zone][compIndex];
//         const newContent = [...component.content];
//         newContent[wordIndex] = {
//           ...newContent[wordIndex],
//           bold: !newContent[wordIndex].bold,
//         };
//         newContainers[zone][compIndex] = { ...component, content: newContent };
//         break;
//       }
//     }
//     updateContainers(newContainers);
//   };
//   const getItemById = (id: string): ResumeComponent | null => {
//     for (const zone in containers) {
//       const comp = containers[zone].find((item) => item.id === id);
//       if (comp) return comp;
//     }
//     return null;
//   };
//   const handleDragStart = (event: DragStartEvent) => {
//     setActiveId(event.active.id.toString());
//   };
//   const handleDragEnd = (event: DragEndEvent) => {
//     const { active, over } = event;
//     setActiveId(null);
//     if (!over) return;
//     const activeContainer = Object.keys(containers).find((zone) =>
//       containers[zone].some((item) => item.id === active.id),
//     );
//     let overContainer = Object.keys(containers).find((zone) => containers[zone].some((item) => item.id === over.id));
//     if (!overContainer) {
//       if (over.id === "main-zone") overContainer = "main";
//       else if (over.id === "holding-zone") overContainer = "holding";
//     }
//     if (!activeContainer || !overContainer) return;
//     if (activeContainer === overContainer) {
//       const items = containers[activeContainer];
//       const oldIndex = items.findIndex((item) => item.id === active.id);
//       let newIndex = items.findIndex((item) => item.id === over.id);
//       if (newIndex === -1) newIndex = items.length;
//       updateContainers({
//         ...containers,
//         [activeContainer]: arrayMove(items, oldIndex, newIndex),
//       });
//     } else {
//       const activeItem = containers[activeContainer].find((item) => item.id === active.id);
//       if (!activeItem) return;
//       updateContainers({
//         ...containers,
//         [activeContainer]: containers[activeContainer].filter((item) => item.id !== active.id),
//         [overContainer]: [...containers[overContainer], activeItem],
//       });
//     }
//   };
//   return (
//     <DndContext
//       sensors={sensors}
//       collisionDetection={closestCenter}
//       onDragStart={handleDragStart}
//       onDragEnd={handleDragEnd}
//       onDragCancel={() => setActiveId(null)}
//     >
//       <div className="flex flex-col gap-4">
//         <h2 className="text-xl font-bold">Resume Builder</h2>
//         <div className="border rounded-lg p-4 min-h-[300px]">
//           <h3 className="font-semibold mb-2">Main Resume Components</h3>
//           <DroppableZone id="main-zone">
//             <SortableContext items={containers.main.map((item) => item.id)} strategy={verticalListSortingStrategy}>
//               {containers.main.map((item) => (
//                 <SortableItem key={item.id} {...item} onWordToggle={toggleWordBold} />
//               ))}
//             </SortableContext>
//           </DroppableZone>
//         </div>
//         <div className="border rounded-lg p-4 min-h-[150px]">
//           <h3 className="font-semibold mb-2">Holding Zone (Unused Components)</h3>
//           <DroppableZone id="holding-zone">
//             <SortableContext items={containers.holding.map((item) => item.id)} strategy={verticalListSortingStrategy}>
//               {containers.holding.map((item) => (
//                 <SortableItem key={item.id} {...item} onWordToggle={toggleWordBold} />
//               ))}
//             </SortableContext>
//           </DroppableZone>
//         </div>
//       </div>
//       <DragOverlay>{activeId && getItemById(activeId) && <ItemOverlay item={getItemById(activeId)!} />}</DragOverlay>
//     </DndContext>
//   );
// };

// const ResumeSection = () => {
//   const [resumeData, setResumeData] = useState<ContainersType>(initialData);
//   const [pdfUrl, setPdfUrl] = useState<string | null>(null);
//   const [compiling, setCompiling] = useState(false);
//   const [selectedCompiler, setSelectedCompiler] = useState<string>("pdflatex");
//   const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
//   const handleResumeChange = useCallback((data: ContainersType) => {
//     setResumeData(data);
//   }, []);
//   const generatePDF = async () => {
//     setCompiling(true);
//     const latex = generateLatexFromResume(resumeData);
//     try {
//       const response = {
//         ok: true,
//         blob: async () => new Blob(["PDF content"], { type: "application/pdf" }),
//       };
//       if (!response.ok) throw new Error("Server error");
//       const blob = await response.blob();
//       const url = URL.createObjectURL(blob);
//       setPdfUrl(url);
//     } catch (err) {
//       console.error("PDF compilation error", err);
//       setPdfUrl(null);
//     } finally {
//       setCompiling(false);
//     }
//   };
//   useEffect(() => {
//     if (debounceTimer) clearTimeout(debounceTimer);
//     const newTimer = setTimeout(() => {
//       generatePDF();
//     }, 500);
//     setDebounceTimer(newTimer);
//     return () => clearTimeout(newTimer);
//   }, [resumeData, selectedCompiler]);
//   return (
//     <div className="p-6">
//       <div className="w-full flex flex-col gap-4">
//         <div className="flex gap-4">
//           <div className="flex-1">
//             <ResumeBuilder onChange={handleResumeChange} />
//           </div>
//           <div className="flex-1 border border-dashed rounded-lg p-4 min-h-[300px] flex flex-col">
//             <div className="mb-2 flex items-center justify-between">
//               <span className="text-center">Resume PDF Preview</span>
//               <select
//                 value={selectedCompiler}
//                 onChange={(e) => setSelectedCompiler(e.target.value)}
//                 className="border rounded p-1"
//               >
//                 <option value="pdflatex">pdfLaTeX</option>
//                 <option value="xelatex">XeLaTeX</option>
//                 <option value="lualatex">LuaLaTeX</option>
//               </select>
//             </div>
//             {pdfUrl ? (
//               <iframe src={pdfUrl} title="Resume PDF" className="w-full h-full border" />
//             ) : (
//               <div className="flex flex-col items-center justify-center h-full">
//                 {compiling ? <span>Compiling PDF...</span> : <span>No PDF generated yet.</span>}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ResumeSection;

import React from "react";

const GenerateDocsPage = () => {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
        <span>Generate Application</span>
      </h1>
      <div className="flex flex-col items-center justify-center flex-1 p-8">
        <p className="text-2xl font-semibold">Coming Soon...</p>
        <p className="mt-2 text-lg text-muted-foreground">
          We&apos;re working hard to bring you the document generation feature. Stay tuned!
        </p>
      </div>
    </div>
  );
};

export default GenerateDocsPage;
