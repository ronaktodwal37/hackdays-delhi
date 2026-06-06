"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Mic, FileText, UploadCloud, ChevronRight, 
  ArrowLeft, AlertTriangle, CheckCircle, RefreshCw, Send, 
  Edit3, Languages, Download, Share2, Eye, Layout, ShieldAlert,
  Sliders, Trash2, Calendar, FileJson, Layers, Map, HelpCircle, Info, Loader2
} from "lucide-react";
import { useBRD, BRD, UserStory } from "@/context/BRDContext";
import jsPDF from "jspdf";
import confetti from "canvas-confetti";

export default function NewBRDFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeParamId = searchParams.get("id");
  const { 
    brds, 
    activeBrd, 
    createNewBRD, 
    updateBrdSection, 
    updateBrdStatus, 
    submitClarificationAnswer,
    translateActiveBRD,
    updateStoryStatus
  } = useBRD();

  // Step 1 UI States
  const [projectTitle, setProjectTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("E-commerce App");
  const [rawTextRequirements, setRawTextRequirements] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [audioTranscript, setAudioTranscript] = useState("");
  
  // Step 3 Clarification UI States
  const [chatInput, setChatInput] = useState("");
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  // Step 4 Workspace UI States
  const [editorSectionId, setEditorSectionId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"document" | "diagram" | "agile" | "risks">("document");
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Timer reference for voice recording
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const LANGUAGES_OPTIONS = [
    { value: "English", label: "English", flag: "🇬🇧" },
    { value: "Hindi", label: "हिंदी (Hindi)", flag: "🇮🇳" },
    { value: "Tamil", label: "தமிழ் (Tamil)", flag: "🇮🇳" },
    { value: "Gujarati", label: "ગુજરાતી (Gujarati)", flag: "🇮🇳" },
    { value: "Marathi", label: "मराठी (Marathi)", flag: "🇮🇳" },
    { value: "Bengali", label: "বাংলা (Bengali)", flag: "🇮🇳" }
  ];

  // Handle auto-routing based on query ID
  useEffect(() => {
    if (activeParamId && activeBrd) {
      if (activeBrd.status === "completed") {
        setActiveWorkspaceTab("document");
      }
    }
  }, [activeParamId, activeBrd]);

  // Sync selected language with active BRD state
  useEffect(() => {
    if (activeBrd) {
      setSelectedLanguage(activeBrd.language || "English");
    }
  }, [activeBrd]);

  // Audio recording simulation
  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);
      
      // Provide highly realistic transcript based on template selection
      const mockTranscripts: Record<string, string> = {
        "E-commerce App": "I want an organic farmer market e-commerce platform. Shoppers should checkout using Razorpay UPI QR codes. We need automatic notification logs for order statuses.",
        "Food Delivery App": "We need a hyper-local fast food delivery dispatch system like Swiggy. Deliveries must coordinate in less than 5 minutes using socket tracking.",
        "Healthcare Platform": "Build an online patient-doctor portal. Needs secure video consultancy rooms, pharmacy coupon integrations, and auto-translated prescription forms."
      };
      setAudioTranscript(mockTranscripts[selectedTemplate] || "Build a responsive startup marketplace app.");
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  // Submit requirements to begin Step 2
  const handleLaunchAI = async () => {
    const finalInput = rawTextRequirements || audioTranscript || (uploadedFile ? `Uploaded specification document: ${uploadedFile.name}` : "");
    if (!finalInput) {
      alert("Please provide some specifications, record audio, or upload a file first!");
      return;
    }

    const createdId = await createNewBRD(
      projectTitle || `Smart Project (${selectedTemplate})`,
      finalInput,
      selectedTemplate,
      audioTranscript
    );

    router.push(`/dashboard/new?id=${createdId}`);
  };

  // Submit clarification answer (Step 3)
  const handleAnswerQuestion = async (qId: string) => {
    if (!activeBrd || !chatInput) return;

    await submitClarificationAnswer(activeBrd.id, qId, chatInput);
    setChatInput("");

    // Move to next question or complete BRD if all answered!
    const nextUnansweredIdx = activeBrd.questions.findIndex((q, i) => i > activeQuestionIdx && !q.answered);
    
    if (nextUnansweredIdx !== -1) {
      setActiveQuestionIdx(nextUnansweredIdx);
    } else {
      // All answered! Fire confetti and set to completed!
      updateBrdStatus(activeBrd.id, "completed");
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#8b5cf6", "#06b6d4", "#6366f1"]
      });
    }
  };

  // Translate complete BRD
  const handleTranslate = async (lang: string) => {
    if (!activeBrd) return;
    setIsTranslating(true);
    setSelectedLanguage(lang);
    
    // Simulate translation delay for high UX quality (1.2 seconds)
    setTimeout(async () => {
      try {
        await translateActiveBRD(lang);
        setToastMessage(`${lang} translation generated successfully`);
        setTimeout(() => setToastMessage(null), 3000);
        confetti({ particleCount: 35, spread: 45, colors: ["#8b5cf6", "#06b6d4"] });
      } catch (error) {
        console.error("Translation error", error);
      } finally {
        setIsTranslating(false);
      }
    }, 1200);
  };

  // Compute active variables to display based on active language selection
  const translatedData = selectedLanguage === "English" 
    ? null 
    : activeBrd?.translations?.[selectedLanguage];

  const displayTitle = translatedData?.title || activeBrd?.title || "";
  const displaySections = translatedData?.sections || activeBrd?.sections || [];
  const displayStories = translatedData?.userStories || activeBrd?.userStories || [];
  const displayRisks = translatedData?.risks || activeBrd?.risks || [];
  const displayTimeline = translatedData?.timeline || activeBrd?.timeline || [];
  const displayBudget = translatedData?.budgetEstimate || activeBrd?.budgetEstimate || { low: 0, high: 0, currency: "USD", details: "" };

  // PDF Export
  const handleExportPDF = () => {
    if (!activeBrd) return;
    setIsExporting(true);

    setTimeout(() => {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.text(`BUSINESS REQUIREMENTS DOCUMENT (BRD)`, 15, 20);
      doc.setFont("helvetica", "normal");
      doc.text(`Project Title: ${displayTitle}`, 15, 30);
      doc.text(`Language: ${selectedLanguage}`, 15, 38);
      doc.text(`Generated Date: ${activeBrd.createdAt}`, 15, 46);
      
      doc.line(15, 52, 195, 52);

      let yPos = 65;
      displaySections.forEach(sec => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.text(sec.title, 15, yPos);
        yPos += 8;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(sec.content, 180);
        lines.forEach((line: string) => {
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, 15, yPos);
          yPos += 6;
        });
        yPos += 10;
      });

      doc.save(`AutoBRD_${displayTitle.replaceAll(" ", "_")}.pdf`);
      setIsExporting(false);
      confetti({ particleCount: 50, spread: 60 });
    }, 1800);
  };

  // DOCX Export Simulator (downloads clean structured text file)
  const handleExportDOCX = () => {
    if (!activeBrd) return;
    setIsExporting(true);

    setTimeout(() => {
      let content = `BUSINESS REQUIREMENTS DOCUMENT\n`;
      content += `Project: ${displayTitle}\n`;
      content += `Generated via AutoBRD AI\n\n`;

      displaySections.forEach(sec => {
        content += `========================================\n`;
        content += `${sec.title.toUpperCase()}\n`;
        content += `========================================\n`;
        content += `${sec.content}\n\n`;
      });

      const element = document.createElement("a");
      const file = new Blob([content], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = `AutoBRD_${displayTitle.replaceAll(" ", "_")}.docx`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      setIsExporting(false);
    }, 1000);
  };

  // Drag and drop story statuses (Kanban simulator)
  const handleMoveStory = (storyId: string, currentStatus: UserStory["status"]) => {
    if (!activeBrd) return;
    const nextStatusMap: Record<UserStory["status"], UserStory["status"]> = {
      "To Do": "In Progress",
      "In Progress": "Done",
      "Done": "To Do"
    };
    updateStoryStatus(activeBrd.id, storyId, nextStatusMap[currentStatus]);
  };

  // Renders the correct step content
  const renderWorkspaceContent = () => {
    // If no active BRD, show Step 1
    if (!activeBrd) {
      return (
        <div className="max-w-4xl mx-auto flex flex-col gap-8 py-4">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Initiate Generative Scoping</h2>
            <p className="text-zinc-500 text-sm mt-1.5">Provide transcripts, voice recordings, or blueprint outlines to extract requirements.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Inputs */}
            <div className="md:col-span-2 flex flex-col gap-6">
              {/* Title and Blueprint dropdown */}
              <div className="p-5 rounded-2xl bg-zinc-950/60 border border-white/5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Project Scope Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. My Organic Farm Storefront"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl glass-input"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Blueprint Template Selection</label>
                  <select 
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl glass bg-zinc-950/90 border border-white/10 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="E-commerce App">E-commerce App Template</option>
                    <option value="Food Delivery App">Food Delivery App Template</option>
                    <option value="Healthcare Platform">Healthcare Platform Template</option>
                    <option value="EdTech App">EdTech App Template</option>
                    <option value="SaaS Platform">SaaS Platform Template</option>
                    <option value="AI Product">AI Product Template</option>
                  </select>
                </div>
              </div>

              {/* Text Area Input */}
              <div className="p-5 rounded-2xl bg-zinc-950/60 border border-white/5 flex flex-col gap-3">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Raw Requirements Description</label>
                <textarea 
                  rows={6}
                  placeholder="Describe your project goals, features, target users, payment structures, timelines, etc..."
                  value={rawTextRequirements}
                  onChange={(e) => setRawTextRequirements(e.target.value)}
                  className="w-full p-4 text-sm rounded-xl glass-input resize-none"
                />
              </div>
            </div>

            {/* Right Media Uploaders */}
            <div className="flex flex-col gap-6">
              {/* Voice Recorder */}
              <div className="p-5 rounded-2xl bg-zinc-950/60 border border-white/5 flex flex-col gap-4 items-center text-center">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">In-Browser Audio Recorder</span>
                
                <button 
                  onClick={toggleRecording}
                  className={`h-16 w-16 rounded-full flex items-center justify-center transition-all ${
                    isRecording 
                      ? "bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse" 
                      : "bg-primary hover:bg-primary-dark shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                  }`}
                >
                  <Mic className="h-6 w-6 text-white" />
                </button>

                <div>
                  <span className="text-xs font-bold text-white block">
                    {isRecording ? `Recording... (${recordingDuration}s)` : "Speak your ideas"}
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-1 block">Supports Hinglish/Hindi speech logs</span>
                </div>

                {audioTranscript && (
                  <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-lg text-left w-full">
                    <span className="text-[9px] uppercase font-bold text-primary font-mono block">Voice Transcript Auto-Synced:</span>
                    <p className="text-[11px] text-zinc-300 mt-1 italic">"{audioTranscript}"</p>
                  </div>
                )}
              </div>

              {/* Drag and Drop File Upload */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`p-6 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center gap-3 transition-colors ${
                  dragActive ? "border-primary bg-primary/5" : "border-white/10 bg-zinc-950/60"
                }`}
              >
                <UploadCloud className="h-8 w-8 text-zinc-500" />
                <div>
                  <span className="text-xs font-bold text-white block">Drag & Drop specifications</span>
                  <span className="text-[10px] text-zinc-500 mt-1 block">Supports PDF, DOCX, TXT transcripts</span>
                </div>
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  onChange={handleFileChange} 
                  accept=".pdf,.docx,.txt"
                />
                <label 
                  htmlFor="file-upload" 
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-300 hover:bg-white/10 cursor-pointer"
                >
                  {uploadedFile ? uploadedFile.name : "Select File"}
                </label>
              </div>
            </div>
          </div>

          <button 
            onClick={handleLaunchAI}
            className="w-full py-4 rounded-xl bg-primary hover:bg-primary-dark text-sm font-bold text-white shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 transition-all mt-4"
          >
            Launch Generative Extraction
            <Sparkles className="h-4.5 w-4.5" />
          </button>
        </div>
      );
    }

    // Step 2: Processing state
    if (activeBrd.status === "processing") {
      return (
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[480px] text-center gap-6 py-12">
          {/* Pulsing visual */}
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse-slow">
              <Sparkles className="h-8 w-8 animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-transparent animate-spin" style={{ animationDuration: "1.5s" }} />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-white">AI Requirement Analysis Active</h2>
            <p className="text-zinc-500 text-xs mt-1.5">Processing unstructured transcripts. Formatting baseline objectives.</p>
          </div>

          {/* Terminal log stream simulator */}
          <div className="w-full bg-black/80 border border-white/10 rounded-xl p-4 font-mono text-[10px] text-zinc-400 text-left flex flex-col gap-2.5 shadow-2xl h-44 overflow-y-auto">
            <p className="text-zinc-600">// Connecting to generative pipeline nodes...</p>
            <p className="text-primary font-bold">✓ SSL verified. Parsing audio inputs.</p>
            <p className="text-cyan-400">✓ Contextual dictionary indexing completed (Language: Hinglish / Hindi).</p>
            <p className="text-indigo-400">✓ Compiling database schemas and structural user stories...</p>
            <p className="text-green-400">✓ Generating system architecture data sets using Mermaid.js compiler...</p>
            <p className="text-zinc-500 animate-pulse">// Waiting for clarification engine initialization...</p>
          </div>
        </div>
      );
    }

    // Step 3: Clarification dialogue
    if (activeBrd.status === "clarification") {
      const unansweredQuestions = activeBrd.questions.filter(q => !q.answered);
      const activeQuestion = unansweredQuestions[0];

      return (
        <div className="max-w-3xl mx-auto flex flex-col gap-6 py-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => updateBrdStatus(activeBrd.id, "processing")}
              className="p-1.5 rounded hover:bg-white/5 border border-white/10 text-zinc-400"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-white">Step 3 — Interactive Clarification Co-pilot</h2>
              <p className="text-zinc-500 text-xs mt-0.5">Let's refine the gaps in requirements before freezing the final draft specification sheet.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[400px]">
            {/* Questions Left Checklist */}
            <div className="md:col-span-4 bg-zinc-950/40 p-4 rounded-xl border border-white/5 flex flex-col gap-2.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Interview Pipeline</span>
              {activeBrd.questions.map((q, idx) => (
                <div 
                  key={q.id}
                  className={`p-3 rounded-lg border text-left text-xs transition-all flex items-start gap-2 ${
                    q.answered 
                      ? "border-green-500/20 bg-green-500/5 text-green-400" 
                      : activeQuestion?.id === q.id 
                        ? "border-primary bg-primary/5 text-white" 
                        : "border-white/5 bg-transparent text-zinc-500"
                  }`}
                >
                  <CheckCircle className={`h-4 w-4 shrink-0 mt-0.5 ${q.answered ? "text-green-400 fill-green-400/10" : "text-zinc-600"}`} />
                  <div>
                    <p className="font-bold">Query {idx + 1}</p>
                    <p className="text-[10px] line-clamp-1 mt-0.5">{q.question}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Box Panel */}
            <div className="md:col-span-8 bg-zinc-950/60 rounded-xl border border-white/5 p-5 flex flex-col justify-between relative">
              {activeQuestion ? (
                <>
                  <div className="flex flex-col gap-4">
                    {/* Bot Message bubbles */}
                    <div className="flex items-start gap-3">
                      <div className="bg-primary p-2 rounded-lg text-white shrink-0 shadow-lg shadow-primary/20">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/5 text-xs text-zinc-200 leading-relaxed max-w-[85%] text-left">
                        <span className="text-[10px] font-bold text-primary uppercase block mb-1">AutoBRD Copilot</span>
                        {activeQuestion.question}
                      </div>
                    </div>

                    {/* Pre-recorded past messages */}
                    {activeQuestion.answer && (
                      <div className="flex items-start gap-3 justify-end">
                        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-xs text-white max-w-[85%] text-left">
                          <span className="text-[10px] font-bold text-primary uppercase block mb-1 text-right">Your Decision</span>
                          {activeQuestion.answer}
                        </div>
                        <div className="bg-zinc-800 p-2 rounded-lg text-white shrink-0">
                          <Eye className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input form */}
                  <div className="mt-8 flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. Yes, we need single checkout with Razorpay links, no multi-vendor split..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAnswerQuestion(activeQuestion.id);
                      }}
                      className="flex-1 px-4 py-3 text-xs rounded-xl glass-input"
                    />
                    <button 
                      onClick={() => handleAnswerQuestion(activeQuestion.id)}
                      className="p-3 rounded-xl bg-primary hover:bg-primary-dark text-white flex items-center justify-center shadow-lg shadow-primary/20"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center gap-4 h-full py-12">
                  <CheckCircle className="h-12 w-12 text-green-400 fill-green-400/10 animate-bounce" />
                  <div>
                    <h4 className="font-bold text-white">All Ambiguities Resolved!</h4>
                    <p className="text-zinc-500 text-xs mt-1">AI compiler is restructuring final document indices.</p>
                  </div>
                  <button 
                    onClick={() => {
                      updateBrdStatus(activeBrd.id, "completed");
                      confetti({ particleCount: 80, spread: 50 });
                    }}
                    className="px-6 py-2 rounded-xl bg-primary text-white text-xs font-bold"
                  >
                    View Final BRD
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Step 4: Finished BRD Workspace
    if (activeBrd.status === "completed") {
      return (
        <div className="flex flex-col gap-6 py-4">
          {/* Workspace Toolbar Header */}
          <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg">
                <CheckCircle className="h-4.5 w-4.5" />
              </div>
              <div className="text-left">
                <h2 className="text-base font-extrabold text-white">{displayTitle}</h2>
                <span className="text-[10px] text-zinc-500 mt-0.5 block font-mono">ID: {activeBrd.id} • Language: {selectedLanguage}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 relative z-30">
              {/* Indian Translation switcher & Status Badge */}
              <div className="flex items-center gap-3 relative">
                {/* Powered by Sarvam Badge */}
                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/5 border border-purple-500/20 text-purple-300 glass shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  ✓ Powered by Sarvam AI
                </div>

                {/* Custom dropdown wrapper with fixed width & z-index */}
                <div className="relative w-48 text-left">
                  <button
                    onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                    disabled={isTranslating}
                    className="w-full px-3 py-2 text-xs rounded-xl glass bg-zinc-950/90 border border-white/10 text-zinc-300 flex items-center justify-between gap-1 cursor-pointer disabled:opacity-50 hover:border-primary/40 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{LANGUAGES_OPTIONS.find(l => l.value === selectedLanguage)?.flag}</span>
                      <span>{LANGUAGES_OPTIONS.find(l => l.value === selectedLanguage)?.label}</span>
                    </span>
                    <ChevronRight className={`h-3 w-3 text-zinc-500 transition-transform ${langDropdownOpen ? "rotate-90" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {langDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-full glass bg-zinc-950/95 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                      >
                        <div className="py-1">
                          {LANGUAGES_OPTIONS.map((lang) => {
                            const isSelected = selectedLanguage === lang.value;
                            return (
                              <button
                                key={lang.value}
                                onClick={() => {
                                  setLangDropdownOpen(false);
                                  handleTranslate(lang.value);
                                }}
                                className={`w-full px-3 py-2.5 text-xs text-left flex items-center justify-between transition-colors ${
                                  isSelected 
                                    ? "bg-primary/20 text-white font-bold" 
                                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <span>{lang.flag}</span>
                                  <span>{lang.label}</span>
                                </span>
                                {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Exports */}
              <button 
                onClick={handleExportPDF}
                disabled={isExporting}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Export PDF
              </button>

              <button 
                onClick={handleExportDOCX}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-indigo-400" />
                Export DOCX
              </button>

              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Shareable workspace link successfully copied to your clipboard!");
                }}
                className="p-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white flex items-center justify-center shadow-lg shadow-primary/20 cursor-pointer"
                title="Copy Share Link"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Double Pane Workspace Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* Left Pane: Document Viewer with editor block */}
            <div className="xl:col-span-8 flex flex-col gap-6 relative">
              {/* Premium Overlay Translator Loader */}
              {isTranslating && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-[3px] rounded-2xl flex flex-col items-center justify-center gap-3.5 z-40 transition-all">
                  <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-3 shadow-2xl max-w-xs text-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-white">Translating via Sarvam AI...</span>
                      <span className="text-[10px] text-zinc-500 mt-1">Refining grammar and terminology</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Tabs switcher for Right panel on Mobile / Left content tabs */}
              <div className="flex border-b border-white/10">
                <button 
                  onClick={() => setActiveWorkspaceTab("document")}
                  className={`px-4 py-2.5 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${
                    activeWorkspaceTab === "document" ? "border-primary text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Requirements Spec
                </button>
                <button 
                  onClick={() => setActiveWorkspaceTab("diagram")}
                  className={`px-4 py-2.5 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${
                    activeWorkspaceTab === "diagram" ? "border-primary text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Architecture Diagram
                </button>
                <button 
                  onClick={() => setActiveWorkspaceTab("agile")}
                  className={`px-4 py-2.5 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${
                    activeWorkspaceTab === "agile" ? "border-primary text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Agile Backlog Board
                </button>
                <button 
                  onClick={() => setActiveWorkspaceTab("risks")}
                  className={`px-4 py-2.5 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${
                    activeWorkspaceTab === "risks" ? "border-primary text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  AI Risk Analyzer
                </button>
              </div>

              {activeWorkspaceTab === "document" && (
                <div className="p-6 rounded-2xl bg-zinc-950/40 border border-white/5 flex flex-col gap-6 text-left shadow-xl">
                  {displaySections.map((sec) => (
                    <div key={sec.id} className="group relative border-b border-white/[0.04] pb-6 last:border-0 last:pb-0">
                      
                      {/* Section Header */}
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-sm text-white tracking-wide">{sec.title}</h3>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditorSectionId(sec.id);
                              setEditContent(sec.content);
                            }}
                            className="p-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="h-3 w-3" />
                            Edit
                          </button>
                          <button 
                            onClick={() => {
                              alert("AI processing: Rewriting section text content with higher technical precision...");
                            }}
                            className="p-1 rounded bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="h-3 w-3" />
                            AI Refine
                          </button>
                        </div>
                      </div>

                      {/* Content block / Editor */}
                      {editorSectionId === sec.id ? (
                        <div className="flex flex-col gap-3">
                          <textarea 
                            rows={6}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-4 text-xs rounded-xl glass-input resize-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => setEditorSectionId(null)}
                              className="px-2.5 py-1.5 rounded-lg bg-white/5 text-[10px] text-zinc-400 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => {
                                updateBrdSection(activeBrd.id, sec.id, editContent);
                                setEditorSectionId(null);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-primary text-white text-[10px] font-bold cursor-pointer"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap">{sec.content}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Renders Mermaid system architecture */}
              {activeWorkspaceTab === "diagram" && (
                <div className="p-6 rounded-2xl bg-zinc-950/40 border border-white/5 flex flex-col gap-6 text-left shadow-xl">
                  <div>
                    <h3 className="text-sm font-bold text-white">System Architecture Mapping</h3>
                    <p className="text-xs text-zinc-500 mt-1">Generated node connectivity charts visualizing request flows and database logs.</p>
                  </div>

                  {/* Flowchart Visualization container */}
                  <div className="border border-white/5 bg-black/60 rounded-xl p-6 min-h-[300px] flex items-center justify-center text-center">
                    <div className="w-full max-w-lg flex flex-col gap-6">
                      <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl font-mono text-[10px] text-zinc-400 text-left overflow-x-auto">
                        <span className="text-primary font-bold">// Mermaid Source Code:</span>
                        <pre className="mt-2">{activeBrd.diagramCode}</pre>
                      </div>

                      {/* Visual Flow diagram representation mapping for premium judging visual */}
                      <div className="flex flex-col gap-3 border border-indigo-500/20 bg-indigo-500/5 rounded-xl p-6 relative">
                        <span className="absolute top-2.5 right-3 text-[9px] font-mono text-indigo-400 uppercase tracking-widest">Interactive Sandbox Model</span>
                        
                        <div className="flex items-center justify-around gap-2 text-[10px] font-bold text-white">
                          <div className="px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg">Storefront App</div>
                          <ChevronRight className="h-4 w-4 text-zinc-500" />
                          <div className="px-3 py-2 bg-primary/20 border border-primary/40 text-primary rounded-lg">Payment Engine</div>
                          <ChevronRight className="h-4 w-4 text-zinc-500" />
                          <div className="px-3 py-2 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 rounded-lg">Razorpay gateway</div>
                        </div>

                        <div className="h-px bg-white/5 my-2" />

                        <div className="flex items-center justify-around gap-2 text-[10px] font-bold text-white">
                          <div className="px-3 py-2 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 rounded-lg">Prisma Sync</div>
                          <ChevronRight className="h-4 w-4 text-zinc-500" />
                          <div className="px-3 py-2 bg-green-500/20 border border-green-500/40 text-green-400 rounded-lg">Postgres Database</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Renders Agile Sprint Backlog Board */}
              {activeWorkspaceTab === "agile" && (
                <div className="p-6 rounded-2xl bg-zinc-950/40 border border-white/5 flex flex-col gap-6 text-left shadow-xl">
                  <div>
                    <h3 className="text-sm font-bold text-white">Agile Backlog Conversion Board</h3>
                    <p className="text-xs text-zinc-500 mt-1">User stories automatically converted into To Do, In Progress, and Completed Jira-style columns. Tap card arrows to move between swimlanes.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Column 1: To Do */}
                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 flex flex-col gap-3 min-h-[300px]">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2 block">
                        To Do ({displayStories.filter(s => s.status === "To Do").length})
                      </span>
                      <div className="flex flex-col gap-2.5">
                        {displayStories.filter(s => s.status === "To Do").map(story => (
                          <div 
                            key={story.id} 
                            onClick={() => handleMoveStory(story.id, "To Do")}
                            className="p-3 rounded-lg bg-zinc-950 border border-white/5 hover:border-primary/40 cursor-pointer transition-all text-xs flex flex-col justify-between gap-3 text-left group"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[9px] font-bold text-primary uppercase font-mono">{story.id}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                                  story.priority === "High" ? "bg-red-500/10 text-red-400" : "bg-zinc-800 text-zinc-400"
                                }`}>
                                  {story.priority}
                                </span>
                              </div>
                              <p className="text-white font-bold leading-tight">{story.title}</p>
                              <p className="text-[10px] text-zinc-500 mt-1">As a {story.actor}, I want to {story.action} so that {story.benefit}.</p>
                            </div>
                            <span className="text-[9px] text-zinc-600 group-hover:text-primary transition-colors text-right font-semibold">Tap to start →</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column 2: In Progress */}
                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 flex flex-col gap-3 min-h-[300px]">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2 block">
                        In Progress ({displayStories.filter(s => s.status === "In Progress").length})
                      </span>
                      <div className="flex flex-col gap-2.5">
                        {displayStories.filter(s => s.status === "In Progress").map(story => (
                          <div 
                            key={story.id} 
                            onClick={() => handleMoveStory(story.id, "In Progress")}
                            className="p-3 rounded-lg bg-zinc-950 border border-primary/20 hover:border-green-500/40 cursor-pointer transition-all text-xs flex flex-col justify-between gap-3 text-left group"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[9px] font-bold text-primary uppercase font-mono">{story.id}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                                  story.priority === "High" ? "bg-red-500/10 text-red-400" : "bg-zinc-800 text-zinc-400"
                                }`}>
                                  {story.priority}
                                </span>
                              </div>
                              <p className="text-white font-bold leading-tight">{story.title}</p>
                              <p className="text-[10px] text-zinc-400 mt-1">As a {story.actor}, I want to {story.action} so that {story.benefit}.</p>
                            </div>
                            <span className="text-[9px] text-zinc-600 group-hover:text-green-400 transition-colors text-right font-semibold">Tap to complete →</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column 3: Done */}
                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 flex flex-col gap-3 min-h-[300px]">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2 block">
                        Done ({displayStories.filter(s => s.status === "Done").length})
                      </span>
                      <div className="flex flex-col gap-2.5">
                        {displayStories.filter(s => s.status === "Done").map(story => (
                          <div 
                            key={story.id} 
                            onClick={() => handleMoveStory(story.id, "Done")}
                            className="p-3 rounded-lg bg-zinc-950 border border-green-500/20 hover:border-red-500/40 cursor-pointer transition-all text-xs flex flex-col justify-between gap-3 text-left group"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[9px] font-bold text-green-400 uppercase font-mono">{story.id}</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-mono">Completed</span>
                              </div>
                              <p className="text-zinc-500 font-bold leading-tight line-through">{story.title}</p>
                            </div>
                            <span className="text-[9px] text-zinc-600 group-hover:text-red-400 transition-colors text-right font-semibold">Tap to reset ↺</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Renders Risk predictions */}
              {activeWorkspaceTab === "risks" && (
                <div className="p-6 rounded-2xl bg-zinc-950/40 border border-white/5 flex flex-col gap-6 text-left shadow-xl">
                  <div>
                    <h3 className="text-sm font-bold text-white">AI Project Risk Analysis</h3>
                    <p className="text-xs text-zinc-500 mt-1">Automatic complexity prediction indexes and mitigation frameworks.</p>
                  </div>

                  <div className="flex flex-col gap-4">
                    {displayRisks.map(risk => (
                      <div key={risk.id} className="p-4 bg-zinc-900/60 border border-white/5 rounded-xl text-xs flex items-start gap-4">
                        <div className={`p-2.5 rounded-lg shrink-0 ${
                          risk.impact === "Critical" || risk.impact === "High" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-white text-xs">{risk.description}</span>
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/10">Category: {risk.category}</span>
                          </div>
                          <p className="text-zinc-400 leading-relaxed text-[11px]"><strong className="text-primary font-bold">Mitigation Strategy:</strong> {risk.mitigation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Pane: AI Assistant panel & Budget info */}
            <div className="xl:col-span-4 flex flex-col gap-6">
              
              {/* Budget Estimation card */}
              <div className="p-5 rounded-2xl bg-zinc-950/60 border border-white/5 flex flex-col gap-4 text-left shadow-xl relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 glow-gradient pointer-events-none" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">AI Budget Estimation</span>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">
                    {displayBudget.currency === "USD" ? "$" : "₹"}
                    {displayBudget.low.toLocaleString()}
                  </span>
                  <span className="text-zinc-500 text-xs font-bold">to</span>
                  <span className="text-2xl font-extrabold text-indigo-400">
                    {displayBudget.currency === "USD" ? "$" : "₹"}
                    {displayBudget.high.toLocaleString()}
                  </span>
                </div>
                
                <p className="text-[11px] text-zinc-400 leading-relaxed">{displayBudget.details}</p>
              </div>

              {/* Persistent AI Workspace Assistant */}
              <div className="p-5 rounded-2xl bg-zinc-950/60 border border-white/5 flex flex-col gap-4 text-left shadow-xl min-h-[300px] justify-between">
                <div>
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <Sparkles className="h-4.5 w-4.5 text-primary" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">AI Assistant Panel</span>
                  </div>

                  <div className="flex flex-col gap-2.5 py-4">
                    <button 
                      onClick={() => alert("AI Suggestion: Recommending standard serverless architecture using Supabase DB, NextAuth paths, and dynamic Vercel scaling pipelines.")}
                      className="p-2.5 rounded-xl border border-white/5 hover:border-primary/20 bg-white/[0.01] hover:bg-white/[0.03] text-left text-[11px] text-zinc-300 font-bold transition-all flex items-center justify-between cursor-pointer"
                    >
                      Suggest Technical Stack
                      <ChevronRight className="h-3 w-3 text-zinc-500" />
                    </button>
                    <button 
                      onClick={() => alert("AI Suggestion: Cart checkout updates could require 2 additional days of edge function testing. Standard milestones extended.")}
                      className="p-2.5 rounded-xl border border-white/5 hover:border-primary/20 bg-white/[0.01] hover:bg-white/[0.03] text-left text-[11px] text-zinc-300 font-bold transition-all flex items-center justify-between cursor-pointer"
                    >
                      Estimate Effort & Timelines
                      <ChevronRight className="h-3 w-3 text-zinc-500" />
                    </button>
                    <button 
                      onClick={() => alert("AI Suggestion: Recommend security protocols like multi-factor authentication (MFA) and HTTPS edge encryptions to lower cart hijack risk metrics.")}
                      className="p-2.5 rounded-xl border border-white/5 hover:border-primary/20 bg-white/[0.01] hover:bg-white/[0.03] text-left text-[11px] text-zinc-300 font-bold transition-all flex items-center justify-between cursor-pointer"
                    >
                      Improve Scopes Security
                      <ChevronRight className="h-3 w-3 text-zinc-500" />
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-2 text-[10px] text-zinc-500">
                  <Info className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span>AI suggestions live-update final document variables.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 relative">
      {/* Toast alert system */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 glass border border-green-500/20 bg-green-500/10 text-green-300 px-4 py-3 rounded-xl shadow-2xl z-50 text-xs font-bold flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4 text-green-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step Stepper Header indicator */}
      {activeBrd && (
        <div className="flex items-center gap-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-widest font-mono">
          <span className={activeBrd.status === "processing" ? "text-primary" : "text-zinc-400"}>1. Inputs</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className={activeBrd.status === "processing" ? "text-primary animate-pulse" : activeBrd.status === "clarification" ? "text-primary" : "text-zinc-400"}>2. AI Processing</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className={activeBrd.status === "clarification" ? "text-primary" : activeBrd.status === "completed" ? "text-zinc-400" : "text-zinc-600"}>3. Clarifications</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className={activeBrd.status === "completed" ? "text-green-400 font-bold" : "text-zinc-600"}>4. Generated Spec Sheet</span>
        </div>
      )}

      {renderWorkspaceContent()}
    </div>
  );
}
