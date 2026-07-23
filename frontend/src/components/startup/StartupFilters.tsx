import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface StartupFiltersProps {
  filters: any;
  setFilters: (filters: any) => void;
  onClear: () => void;
}

export function StartupFilters({ filters, setFilters, onClear }: StartupFiltersProps) {
  
  const updateFilter = (key: string, value: string) => {
    setFilters((prev: any) => ({ ...prev, [key]: value === 'ALL' ? undefined : value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Filters</h3>
        <Button variant="ghost" size="sm" onClick={onClear} className="h-8 text-muted-foreground hover:text-foreground">
          <RotateCcw className="w-3 h-3 mr-2" /> Reset
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Industry</Label>
          <Select value={filters.industry || 'ALL'} onValueChange={(v) => updateFilter('industry', v)}>
            <SelectTrigger className="w-full bg-transparent"><SelectValue placeholder="Any Industry" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Any Industry</SelectItem>
              <SelectItem value="EdTech">EdTech</SelectItem>
              <SelectItem value="FinTech">FinTech</SelectItem>
              <SelectItem value="HealthTech">HealthTech</SelectItem>
              <SelectItem value="SaaS">SaaS</SelectItem>
              <SelectItem value="AI/ML">AI / ML</SelectItem>
              <SelectItem value="E-commerce">E-commerce</SelectItem>
              <SelectItem value="Web3">Web3 / Crypto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Stage</Label>
          <Select value={filters.stage || 'ALL'} onValueChange={(v) => updateFilter('stage', v)}>
            <SelectTrigger className="w-full bg-transparent"><SelectValue placeholder="Any Stage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Any Stage</SelectItem>
              <SelectItem value="IDEA">Idea</SelectItem>
              <SelectItem value="PROTOTYPE">Prototype</SelectItem>
              <SelectItem value="MVP">MVP</SelectItem>
              <SelectItem value="EARLY_TRACTION">Early Traction</SelectItem>
              <SelectItem value="GROWTH">Growth</SelectItem>
              <SelectItem value="SCALING">Scaling</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Commitment</Label>
          <Select value={filters.commitment || 'ALL'} onValueChange={(v) => updateFilter('commitment', v)}>
            <SelectTrigger className="w-full bg-transparent"><SelectValue placeholder="Any Commitment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Any Commitment</SelectItem>
              <SelectItem value="FULL_TIME">Full Time</SelectItem>
              <SelectItem value="PART_TIME">Part Time</SelectItem>
              <SelectItem value="CONTRACT">Contract</SelectItem>
              <SelectItem value="INTERNSHIP">Internship</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Work Type</Label>
          <Select value={filters.workType || 'ALL'} onValueChange={(v) => updateFilter('workType', v)}>
            <SelectTrigger className="w-full bg-transparent"><SelectValue placeholder="Any Work Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Any Location</SelectItem>
              <SelectItem value="REMOTE">Remote</SelectItem>
              <SelectItem value="HYBRID">Hybrid</SelectItem>
              <SelectItem value="ONSITE">On-site</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
