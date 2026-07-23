import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useSettingsStore } from '@/store/useSettingsStore';
import {
  Monitor, Moon, Sun, Volume2, Shield, Palette, Image as ImageIcon,
  User, UploadCloud, RotateCcw, Zap, Type, Layout, Eye, Layers,
  CheckCircle, AlertTriangle, XCircle, Info
} from 'lucide-react';
import { ImageCropperModal } from '@/components/shared/ImageCropperModal';
import { fileService } from '@/services/fileService';
import { settingsService } from '@/services/settingsService';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getImageUrl } from '@/lib/utils';

// ── Color Presets ──────────────────────────────────────────────────────────────
const PRIMARY_COLORS = [
  { label: 'Indigo',    value: '226 100% 61%',    bg: 'bg-indigo-500' },
  { label: 'Blue',      value: '221.2 83.2% 53.3%', bg: 'bg-blue-500' },
  { label: 'Violet',    value: '271.5 81.3% 55.9%', bg: 'bg-violet-600' },
  { label: 'Purple',    value: '285 80% 55%',      bg: 'bg-purple-600' },
  { label: 'Pink',      value: '330 80% 60%',      bg: 'bg-pink-500' },
  { label: 'Rose',      value: '346.8 77.2% 49.8%', bg: 'bg-rose-600' },
  { label: 'Orange',    value: '24.6 95% 53.1%',   bg: 'bg-orange-500' },
  { label: 'Amber',     value: '35 92% 50%',       bg: 'bg-amber-500' },
  { label: 'Green',     value: '142.1 76.2% 36.3%', bg: 'bg-green-600' },
  { label: 'Emerald',   value: '160 60% 45%',      bg: 'bg-emerald-500' },
  { label: 'Teal',      value: '173 80% 40%',      bg: 'bg-teal-500' },
  { label: 'Cyan',      value: '188.7 94.5% 42.7%', bg: 'bg-cyan-500' },
  { label: 'Slate',     value: '215 25% 50%',      bg: 'bg-slate-500' },
  { label: 'White',     value: '0 0% 95%',         bg: 'bg-white border border-border' },
];

const SECONDARY_COLORS = [
  { label: 'Dark Blue',  value: '217 32% 15%',  bg: 'bg-slate-800' },
  { label: 'Dark Slate', value: '220 20% 12%',  bg: 'bg-slate-900' },
  { label: 'Dark Purple',value: '260 25% 18%',  bg: 'bg-purple-950' },
  { label: 'Dark Teal',  value: '190 30% 18%',  bg: 'bg-teal-950' },
  { label: 'Neutral',    value: '220 13% 90%',  bg: 'bg-slate-200' },
  { label: 'Light Blue', value: '210 40% 96%',  bg: 'bg-blue-50' },
  { label: 'Light Purple',value:'260 30% 95%',  bg: 'bg-purple-50' },
  { label: 'Gray',       value: '0 0% 50%',     bg: 'bg-gray-500' },
];

const DESTRUCTIVE_COLORS = [
  { label: 'Red',    value: '0 84.2% 60.2%',  bg: 'bg-red-500' },
  { label: 'Crimson',value: '345 80% 50%',    bg: 'bg-rose-600' },
  { label: 'Orange', value: '14 90% 55%',     bg: 'bg-orange-600' },
];

const SUCCESS_COLORS = [
  { label: 'Green',   value: '142.1 76.2% 36.3%', bg: 'bg-green-600' },
  { label: 'Emerald', value: '160 60% 45%',        bg: 'bg-emerald-500' },
  { label: 'Teal',    value: '173 80% 40%',        bg: 'bg-teal-500' },
];

const WARNING_COLORS = [
  { label: 'Yellow', value: '47.9 95.8% 53.1%', bg: 'bg-yellow-400' },
  { label: 'Amber',  value: '35 92% 50%',        bg: 'bg-amber-500' },
  { label: 'Orange', value: '24.6 95% 53.1%',    bg: 'bg-orange-500' },
];

// ── Sub-component: Color Swatch Picker ────────────────────────────────────────
function ColorSwatchPicker({
  options, value, onChange,
}: {
  options: { label: string; value: string; bg: string }[];
  value: string;
  onChange: (v: string) => void;

}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          title={opt.label}
          onClick={() => onChange(opt.value)}
          className={`w-8 h-8 rounded-full ${opt.bg} transition-all duration-200 hover:scale-110 ${
            value === opt.value
              ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110'
              : ''
          }`}
        />
      ))}
    </div>
  );
}

// ── Sub-component: Section Divider ────────────────────────────────────────────
function SectionDivider({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 pt-5 pb-2 border-t border-border">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="font-semibold text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// ── Main Export ────────────────────────────────────────────────────────────────
export function GeneralSettingsSection() {
  const settings = useSettingsStore();
  const user = useAuthStore(state => state.user);

  const [cropConfig, setCropConfig] = useState<{
    isOpen: boolean;
    imageUrl: string | null;
    aspectRatio: number;
    type: 'profile' | 'background' | null;
  }>({ isOpen: false, imageUrl: null, aspectRatio: 1, type: null });

  const handleThemeChange = (value: 'light' | 'dark' | 'system') => {
    settings.updateSetting('theme', value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'background') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropConfig({ isOpen: true, imageUrl: reader.result as string, aspectRatio: type === 'profile' ? 1 : 16 / 9, type });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCropComplete = async (croppedFile: File) => {
    setCropConfig(prev => ({ ...prev, isOpen: false }));
    const type = cropConfig.type;
    try {
      const loadingToast = toast.loading(`Uploading ${type}...`);
      if (type === 'profile') {
        const response = await settingsService.uploadProfileImage(croppedFile);
        if (response && response.imageUrl) {
          const newImageUrl = `${response.imageUrl}?t=${new Date().getTime()}`;
          useAuthStore.getState().updateUser({ profileImage: newImageUrl });
          toast.success('Profile picture updated!', { id: loadingToast });
        }
      } else if (type === 'background') {
        const url = await fileService.uploadFile(croppedFile);
        settings.updateSetting('appBackgroundUrl', url);
        toast.success('Background updated!', { id: loadingToast });
      }
    } catch (error) {
      /* console.error removed */
      toast.error(`Failed to upload ${type}.`);
    }
  };

  // Live preview color for custom hex input

  return (
    <div className="space-y-6">

      {/* ── Appearance ───────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg"><Monitor className="w-5 h-5 mr-2 text-primary" /> Appearance</CardTitle>
          <CardDescription>Customize how the application looks on your device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label className="text-base">Theme</Label>
            <RadioGroup defaultValue={settings.theme} onValueChange={handleThemeChange} className="grid grid-cols-3 gap-4">
              {[
                { value: 'light', icon: Sun, label: 'Light' },
                { value: 'dark',  icon: Moon, label: 'Dark' },
                { value: 'system', icon: Monitor, label: 'System' },
              ].map(({ value, icon: Icon, label }) => (
                <div key={value}>
                  <RadioGroupItem value={value} id={value} className="peer sr-only" />
                  <Label htmlFor={value} className="flex flex-col items-center justify-between rounded-md border-2 border-muted glass-surface p-4 hover:bg-accent/10 peer-data-[state=checked]:border-primary cursor-pointer transition-all">
                    <Icon className="mb-3 h-6 w-6" />
                    {label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* ── Privacy & Status ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg"><Shield className="w-5 h-5 mr-2 text-primary" /> Privacy & Status</CardTitle>
          <CardDescription>Manage your visibility and online presence.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Show Online Status</Label>
              <p className="text-sm text-muted-foreground">Let others see when you are active on the platform.</p>
            </div>
            <Switch checked={settings.showOnlineStatus} onCheckedChange={(v) => settings.updateSetting('showOnlineStatus', v)} />
          </div>
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="space-y-0.5">
              <Label className="text-base">Profile Visibility</Label>
              <p className="text-sm text-muted-foreground">Who can view your full profile details.</p>
            </div>
            <RadioGroup defaultValue={settings.profileVisibility} onValueChange={(v: 'public' | 'workspace_only') => settings.updateSetting('profileVisibility', v)} className="flex flex-col space-y-2 mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" />
                <Label htmlFor="public" className="font-normal">Public (Anyone on SYNERGi)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="workspace_only" />
                <Label htmlFor="workspace_only" className="font-normal">Workspace Only (Only people in your workspaces)</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* ── Media & Sound ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg"><Volume2 className="w-5 h-5 mr-2 text-primary" /> Media & Sound</CardTitle>
          <CardDescription>Configure in-app sounds and media playback.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            { key: 'playSoundOnMessage' as const, label: 'Message Sounds', desc: 'Play a sound when you receive a new chat message.' },
            { key: 'playRingtoneOnCall' as const, label: 'Call Ringtone', desc: 'Play a ringing sound for incoming voice calls.' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">{label}</Label>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
              <Switch checked={settings[key] as boolean} onCheckedChange={(v) => settings.updateSetting(key, v)} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Personalization ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-lg"><Palette className="w-5 h-5 mr-2 text-primary" /> Personalization</CardTitle>
            <CardDescription>Full control over colors, style, layout, and behavior.</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => {
              settings.resetPersonalization();
              toast.success('Personalization reset to defaults.');
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </CardHeader>

        <CardContent className="space-y-2">

          {/* ── Profile Picture ─────────────────────────────────────────────── */}
          <SectionDivider icon={User} title="Profile Picture" description="Your avatar shown across the platform." />
          <div className="flex items-center gap-4 pt-2">
            <div className="relative overflow-hidden rounded-full h-16 w-16 bg-muted border-2 border-primary/30 shadow-md">
              {user?.profileImage ? (
                <img src={getImageUrl(user.profileImage)} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><User className="text-muted-foreground w-8 h-8" /></div>
              )}
            </div>
            <div className="relative">
              <Input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'profile')} />
              <Button variant="outline" className="gap-2 pointer-events-none"><UploadCloud className="w-4 h-4" /> Change Avatar</Button>
            </div>
          </div>

          {/* ── Website Background ──────────────────────────────────────────── */}
          <SectionDivider icon={ImageIcon} title="Website Background" description="Global background applied across the entire app." />
          <div className="flex items-center gap-4 pt-2">
            <div className="relative overflow-hidden rounded-xl h-16 w-28 bg-muted border-2 border-border shadow-md">
              {settings.appBackgroundUrl ? (
                <img src={getImageUrl(settings.appBackgroundUrl)} alt="Background" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><ImageIcon className="text-muted-foreground w-6 h-6" /></div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'background')} />
                <Button variant="outline" className="gap-2 pointer-events-none"><UploadCloud className="w-4 h-4" /> Set Background</Button>
              </div>
              {settings.appBackgroundUrl && (
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => settings.updateSetting('appBackgroundUrl', null)}>Remove</Button>
              )}
            </div>
          </div>

          {/* ── Primary Color ───────────────────────────────────────────────── */}
          <SectionDivider icon={Palette} title="Primary Color" description="Buttons, links, active states, focus rings." />
          <div className="space-y-3 pt-1">
            <ColorSwatchPicker
              options={PRIMARY_COLORS}
              value={settings.primaryColor}
              onChange={(v) => {
                settings.updateSetting('primaryColor', v);
                settings.updateSetting('accentColor', v); // keep compat
              }}
            />
            {/* Live preview badge */}
            <div className="flex items-center gap-3">
              <div className="h-8 px-4 rounded-full flex items-center text-xs font-semibold text-white shadow-md transition-all" style={{ backgroundColor: `hsl(${settings.primaryColor})` }}>
                Preview Button
              </div>
              <code className="text-xs text-muted-foreground">{settings.primaryColor}</code>
            </div>
          </div>

          {/* ── Secondary Color ─────────────────────────────────────────────── */}
          <SectionDivider icon={Layers} title="Secondary Color" description="Secondary backgrounds, muted surfaces, cards." />
          <div className="space-y-3 pt-1">
            <ColorSwatchPicker
              options={SECONDARY_COLORS}
              value={settings.secondaryColor}
              onChange={(v) => settings.updateSetting('secondaryColor', v)}
            />
            <div className="flex items-center gap-3">
              <div className="h-8 px-4 rounded-full flex items-center text-xs font-semibold shadow-md transition-all" style={{ backgroundColor: `hsl(${settings.secondaryColor})`, color: settings.secondaryColor.includes('9') ? '#fff' : '#111' }}>
                Secondary Surface
              </div>
              <code className="text-xs text-muted-foreground">{settings.secondaryColor}</code>
            </div>
          </div>

          {/* ── Semantic Colors ─────────────────────────────────────────────── */}
          <SectionDivider icon={Info} title="Semantic Colors" description="Success, warning, and danger/error colors." />
          <div className="grid sm:grid-cols-3 gap-6 pt-1">
            {/* Success */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <Label className="text-sm font-medium">Success</Label>
              </div>
              <ColorSwatchPicker
                options={SUCCESS_COLORS}
                value={settings.successColor}
                onChange={(v) => settings.updateSetting('successColor', v)}
              />
              <div className="h-7 rounded-lg px-3 flex items-center text-xs font-semibold text-white transition-all" style={{ backgroundColor: `hsl(${settings.successColor})` }}>
                Saved ✓
              </div>
            </div>

            {/* Warning */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <Label className="text-sm font-medium">Warning</Label>
              </div>
              <ColorSwatchPicker
                options={WARNING_COLORS}
                value={settings.warningColor}
                onChange={(v) => settings.updateSetting('warningColor', v)}
              />
              <div className="h-7 rounded-lg px-3 flex items-center text-xs font-semibold transition-all" style={{ backgroundColor: `hsl(${settings.warningColor})`, color: '#111' }}>
                ⚠ Warning
              </div>
            </div>

            {/* Danger */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <Label className="text-sm font-medium">Danger / Error</Label>
              </div>
              <ColorSwatchPicker
                options={DESTRUCTIVE_COLORS}
                value={settings.destructiveColor}
                onChange={(v) => settings.updateSetting('destructiveColor', v)}
              />
              <div className="h-7 rounded-lg px-3 flex items-center text-xs font-semibold text-white transition-all" style={{ backgroundColor: `hsl(${settings.destructiveColor})` }}>
                Delete ✗
              </div>
            </div>
          </div>

          {/* ── Typography ──────────────────────────────────────────────────── */}
          <SectionDivider icon={Type} title="Typography" description="Font style and text size across the app." />
          <div className="grid sm:grid-cols-2 gap-6 pt-1">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Font Style</Label>
              <RadioGroup value={settings.fontFamily} onValueChange={(v: 'sans' | 'serif' | 'mono') => settings.updateSetting('fontFamily', v)} className="flex flex-col gap-2">
                {[
                  { value: 'sans',  label: 'Modern (Sans-Serif)',   cls: 'font-sans' },
                  { value: 'serif', label: 'Elegant (Serif)',       cls: 'font-serif' },
                  { value: 'mono',  label: 'Technical (Monospace)', cls: 'font-mono' },
                ].map(({ value, label, cls }) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={value} id={`font-${value}`} />
                    <Label htmlFor={`font-${value}`} className={`font-normal ${cls}`}>{label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Font Size</Label>
              <RadioGroup value={settings.fontSize} onValueChange={(v: 'sm' | 'md' | 'lg') => settings.updateSetting('fontSize', v)} className="flex flex-col gap-2">
                {[
                  { value: 'sm', label: 'Compact (13px)' },
                  { value: 'md', label: 'Normal (15px)'  },
                  { value: 'lg', label: 'Large (17px)'   },
                ].map(({ value, label }) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={value} id={`size-${value}`} />
                    <Label htmlFor={`size-${value}`} className="font-normal">{label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          {/* ── UI Style ────────────────────────────────────────────────────── */}
          <SectionDivider icon={Layers} title="UI Style" description="Border radius and glass intensity." />
          <div className="grid sm:grid-cols-2 gap-6 pt-1">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Border Style</Label>
              <RadioGroup value={settings.borderRadius} onValueChange={(v: 'sharp' | 'rounded' | 'extra-rounded') => settings.updateSetting('borderRadius', v)} className="flex flex-col gap-2">
                {[
                  { value: 'sharp',         label: 'Sharp Corners' },
                  { value: 'rounded',       label: 'Standard Rounded' },
                  { value: 'extra-rounded', label: 'Extra Rounded (Pill)' },
                ].map(({ value, label }) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={value} id={`border-${value}`} />
                    <Label htmlFor={`border-${value}`} className="font-normal">{label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Glass Intensity</Label>
              <RadioGroup value={settings.glassOpacity} onValueChange={(v: 'high' | 'medium' | 'low') => settings.updateSetting('glassOpacity', v)} className="flex flex-col gap-2">
                {[
                  { value: 'high',   label: 'High (Frosted)' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low',    label: 'Low (Clearer)' },
                ].map(({ value, label }) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={value} id={`glass-${value}`} />
                    <Label htmlFor={`glass-${value}`} className="font-normal">{label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          {/* ── Sidebar Style ───────────────────────────────────────────────── */}
          <SectionDivider icon={Layout} title="Sidebar Style" description="Visual style of the navigation sidebar." />
          <RadioGroup value={settings.sidebarStyle} onValueChange={(v: 'glass' | 'solid' | 'minimal') => settings.updateSetting('sidebarStyle', v)} className="grid grid-cols-3 gap-3 pt-1">
            {[
              { value: 'glass',   label: 'Glass',   desc: 'Translucent' },
              { value: 'solid',   label: 'Solid',   desc: 'Opaque bg' },
              { value: 'minimal', label: 'Minimal', desc: 'Transparent' },
            ].map(({ value, label, desc }) => (
              <div key={value}>
                <RadioGroupItem value={value} id={`sidebar-${value}`} className="peer sr-only" />
                <Label htmlFor={`sidebar-${value}`} className="flex flex-col items-center gap-1 rounded-xl border-2 border-muted glass-surface p-3 hover:bg-accent/10 peer-data-[state=checked]:border-primary cursor-pointer transition-all text-center">
                  <span className="font-semibold text-sm">{label}</span>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>

          {/* ── Animation Speed ─────────────────────────────────────────────── */}
          <SectionDivider icon={Zap} title="Animation Speed" description="Controls how fast transitions and animations run." />
          <RadioGroup value={settings.animationSpeed} onValueChange={(v: 'none' | 'reduced' | 'normal' | 'expressive') => settings.updateSetting('animationSpeed', v)} className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {[
              { value: 'none',       label: 'None',       desc: 'No motion' },
              { value: 'reduced',    label: 'Reduced',    desc: 'Subtle' },
              { value: 'normal',     label: 'Normal',     desc: 'Default' },
              { value: 'expressive', label: 'Expressive', desc: 'Bouncy' },
            ].map(({ value, label, desc }) => (
              <div key={value}>
                <RadioGroupItem value={value} id={`anim-${value}`} className="peer sr-only" />
                <Label htmlFor={`anim-${value}`} className="flex flex-col items-center gap-1 rounded-xl border-2 border-muted glass-surface p-3 hover:bg-accent/10 peer-data-[state=checked]:border-primary cursor-pointer transition-all text-center">
                  <span className="font-semibold text-sm">{label}</span>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>

          {/* ── Layout Tweaks ───────────────────────────────────────────────── */}
          <SectionDivider icon={Eye} title="Layout & Display" description="Toggle density and visibility options." />
          <div className="space-y-4 pt-1">
            {[
              { key: 'compactMode' as const, label: 'Compact Mode', desc: 'Reduces padding and spacing for a denser layout.' },
              { key: 'showAvatars' as const, label: 'Show Avatars', desc: 'Display user profile pictures throughout the app.' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">{label}</Label>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
                <Switch checked={settings[key] as boolean} onCheckedChange={(v) => settings.updateSetting(key, v)} />
              </div>
            ))}
          </div>

        </CardContent>
      </Card>

      <ImageCropperModal
        isOpen={cropConfig.isOpen}
        onClose={() => setCropConfig(prev => ({ ...prev, isOpen: false }))}
        imageUrl={cropConfig.imageUrl}
        aspectRatio={cropConfig.aspectRatio}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
