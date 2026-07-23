import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BrowseStartups from "@/pages/talent/BrowseStartups";
import BrowseTalent from "@/pages/founder/BrowseTalent";
import { Search } from "lucide-react";

export default function UnifiedBrowse() {
  const [activeTab, setActiveTab] = useState("startups");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Unified Header */}
      <div className="glass-card border-b px-6 py-6 shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent z-0 pointer-events-none" />
        <div className="w-full max-w-[1920px] mx-auto relative z-10 flex flex-col md:flex-row gap-4 md:items-end justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Search className="w-8 h-8 text-primary" /> Browse Network
            </h1>
            <p className="text-white/80 mt-1 text-base">Discover startups, talents, and founders across SYNERGi.</p>
          </div>
          
          <TabsList className="grid w-full md:w-[400px] grid-cols-3">
            <TabsTrigger value="startups">Startups</TabsTrigger>
            <TabsTrigger value="talents">Talents</TabsTrigger>
            <TabsTrigger value="founders">Founders</TabsTrigger>
          </TabsList>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 flex overflow-hidden">
        <TabsContent value="startups" className="flex-1 m-0 data-[state=active]:flex flex-col border-none p-0 outline-none h-full">
          <BrowseStartups hideHeader />
        </TabsContent>
        <TabsContent value="talents" className="flex-1 m-0 data-[state=active]:flex flex-col border-none p-0 outline-none h-full">
          <BrowseTalent roleFilter="TALENT" hideHeader />
        </TabsContent>
        <TabsContent value="founders" className="flex-1 m-0 data-[state=active]:flex flex-col border-none p-0 outline-none h-full">
          <BrowseTalent roleFilter="FOUNDER" hideHeader />
        </TabsContent>
      </div>
    </Tabs>
  );
}
