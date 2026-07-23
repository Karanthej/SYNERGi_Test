import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { startupService } from "@/services/myStartupService";
import { jobOfferService } from "@/services/jobOfferService";
import { toast } from "sonner";
import { Loader2, Building2 } from "lucide-react";

interface HireTalentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  talentUuid: string;
  talentName: string;
}

export function HireTalentDialog({ isOpen, onClose, talentUuid, talentName }: HireTalentDialogProps) {
  const [startups, setStartups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStartups, setSelectedStartups] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchStartups();
    } else {
      setSelectedStartups([]);
    }
  }, [isOpen]);

  const fetchStartups = async () => {
    try {
      setLoading(true);
      const data = await startupService.getMyStartups();
      setStartups(data);
    } catch (error) {
      toast.error("Failed to fetch startups");
    } finally {
      setLoading(false);
    }
  };

  const toggleStartup = (uuid: string) => {
    setSelectedStartups(prev => 
      prev.includes(uuid) ? prev.filter(id => id !== uuid) : [...prev, uuid]
    );
  };

  const handleHire = async () => {
    if (selectedStartups.length === 0) {
      toast.error("Please select at least one startup");
      return;
    }

    try {
      setSubmitting(true);
      await jobOfferService.createJobOffers({
        talentUuid,
        startupUuids: selectedStartups
      });
      toast.success(`Job offers sent to ${talentName}!`);
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to send job offers");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hire {talentName}</DialogTitle>
          <DialogDescription>
            Select the startups you want to invite {talentName} to. They will receive a job offer.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-2">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
          ) : startups.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground text-sm bg-muted/30 rounded-2xl border border-white/5">
              You don't have any startups yet. Create one first!
            </div>
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {startups.map(startup => {
                const isSelected = selectedStartups.includes(startup.uuid);
                return (
                  <div 
                    key={startup.uuid} 
                    className={`flex items-center space-x-4 p-4 border rounded-2xl transition-all duration-300 cursor-pointer ${
                      isSelected 
                        ? 'bg-primary/5 border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.1)]' 
                        : 'bg-white/50 dark:bg-black/20 border-black/5 dark:border-white/5 hover:bg-white/80 dark:hover:bg-black/40 hover:border-black/10 dark:hover:border-white/10'
                    }`}
                    onClick={() => toggleStartup(startup.uuid)}
                  >
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={() => toggleStartup(startup.uuid)}
                      id={`startup-${startup.uuid}`} 
                      className="w-5 h-5 rounded-full data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary/70'}`}>
                        {startup.logoUrl ? (
                          <img src={startup.logoUrl} alt={startup.name} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                        ) : (
                          <Building2 className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <label 
                          htmlFor={`startup-${startup.uuid}`} 
                          className="text-base font-semibold leading-tight cursor-pointer truncate block text-foreground"
                        >
                          {startup.name}
                        </label>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {startup.tagline || 'Invite talent to this startup'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <DialogFooter className="mt-2 sm:space-x-3">
          <Button variant="ghost" className="rounded-full px-6 hover:bg-black/5 dark:hover:bg-white/5" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleHire} disabled={loading || submitting || selectedStartups.length === 0} className="rounded-full bg-gradient-to-r from-primary to-blue-600 shadow-md hover:shadow-lg transition-all px-6">
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Send Offer{selectedStartups.length > 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
