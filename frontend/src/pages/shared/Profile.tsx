// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { settingsService } from "@/services/settingsService";
import { MapPin, Briefcase, GraduationCap, Globe, Edit, Code2, Award, Camera } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState, useRef } from "react";
import { EditProfileModal } from "@/components/shared/EditProfileModal";
import { useParams, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { getImageUrl } from "@/lib/utils";
import { ImageCropperModal } from "@/components/shared/ImageCropperModal";
import { startupService } from "@/services/myStartupService";
import { HireTalentDialog } from "@/components/founder/HireTalentDialog";

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const { id } = useParams();
  const { user } = useAuthStore();
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [cropConfig, setCropConfig] = useState<{
    isOpen: boolean;
    imageUrl: string | null;
    aspectRatio: number;
    type: 'profile' | 'cover';
  }>({
    isOpen: false,
    imageUrl: null,
    aspectRatio: 1,
    type: 'profile',
  });

  const isPublicView = !!id;

  useEffect(() => {
    setLoading(true);
    if (isPublicView) {
      settingsService.getPublicProfile(id).then((data) => {
        setProfile(data);
        

      }).catch(() => {}).finally(() => setLoading(false));
    } else {
      settingsService.getProfile().then(setProfile).catch(() => {}).finally(() => setLoading(false));
    }
  }, [id, isPublicView]);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropConfig({
        isOpen: true,
        imageUrl: reader.result as string,
        aspectRatio: type === 'profile' ? 1 : 3, // 1:1 for profile, 3:1 for cover
        type,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset input
  };

  const handleCropComplete = async (croppedFile: File) => {
    setCropConfig(prev => ({ ...prev, isOpen: false }));
    const type = cropConfig.type;
    
    try {
      const loadingToast = toast.loading(`Uploading ${type} image...`);
      
      if (type === 'profile') {
        const response = await settingsService.uploadProfileImage(croppedFile);
        if (response && response.imageUrl) {
          const newImageUrl = `${response.imageUrl}?t=${new Date().getTime()}`;
          
          setProfile((prev: any) => {
            if (!prev) return prev;
            return { ...prev, user: { ...prev.user, profileImage: newImageUrl } };
          });
          
          useAuthStore.getState().updateUser({ profileImage: newImageUrl });
        }
      } else {
        const response = await settingsService.uploadCoverImage(croppedFile);
        if (response && response.coverImageUrl) {
          const newCoverUrl = `${response.coverImageUrl}?t=${new Date().getTime()}`;
          
          setProfile((prev: any) => {
            if (!prev) return prev;
            return { ...prev, profile: { ...prev.profile, coverImageUrl: newCoverUrl } };
          });
        }
      }
      
      toast.success(`${type === 'profile' ? 'Profile' : 'Cover'} image updated successfully!`, { id: loadingToast });
    } catch (error) {
      /* console.error removed */
      toast.error(`Failed to upload ${type} image.`);
    }
  };

  if (loading) return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="relative mb-16">
        <Skeleton className="w-full h-48 sm:h-64 rounded-2xl" />
        <div className="absolute -bottom-12 left-8">
          <Skeleton className="w-32 h-32 rounded-full border-4 border-background" />
        </div>
      </div>
      <div className="flex justify-between items-start pt-4 px-2">
        <div className="space-y-2">
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full max-w-72" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
    </div>
  );

  if (!profile) return <Navigate to="/404" replace />;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Cover & Header */}
      <div className="relative mb-16">
        <div 
          className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary/20 via-primary/10 to-background border h-48 sm:h-64 bg-cover bg-center"
          style={{ backgroundImage: profile.profile?.coverImageUrl ? `url(${getImageUrl(profile.profile.coverImageUrl)})` : undefined }}
        >
          {!isPublicView && (
            <>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => onFileSelect(e, 'cover')}
              />
              <Button onClick={() => fileInputRef.current?.click()} className="absolute top-4 right-4 z-10" variant="secondary" size="sm">
                <Edit className="w-4 h-4 mr-2" /> Edit Cover
              </Button>
            </>
          )}
        </div>

        <div className="absolute -bottom-12 left-8 flex items-end gap-6 group z-10">
          <div className="relative">
            <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
              <AvatarImage src={getImageUrl(profile.user?.profileImage)} className="object-cover" />
              <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                {profile.user?.fullName ? profile.user.fullName.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            {!isPublicView && (
              <div 
                className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
                onClick={() => profileImageInputRef.current?.click()}
              >
                <Camera className="w-8 h-8 text-white" />
              </div>
            )}
            {!isPublicView && (
              <input 
                type="file" 
                ref={profileImageInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => onFileSelect(e, 'profile')}
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 px-2">
        <div>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">{profile.user?.fullName || 'User Profile'}</h1>
              {profile.user?.role && (
                <Badge variant={profile.user.role === 'FOUNDER' ? 'default' : 'secondary'} className="uppercase text-xs px-2 py-0.5">
                  {profile.user.role}
                </Badge>
              )}
            </div>
            {profile.user?.username && (
              <p className="text-lg text-muted-foreground font-medium mt-1">@{profile.user.username}</p>
            )}
          </div>
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {profile.profile?.city || 'No City'}, {profile.profile?.country || 'No Country'}</span>
            <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> {profile.profile?.website || 'No Website'}</span>
          </div>
        </div>
        <div className="flex gap-3">

          {profile.profile?.linkedinUrl ? (
            <a href={profile.profile.linkedinUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon" title="LinkedIn Profile">
                <Linkedin className="w-4 h-4" />
              </Button>
            </a>
          ) : (
            <Button disabled variant="outline" size="icon" title="No LinkedIn URL added">
              <Linkedin className="w-4 h-4 opacity-50" />
            </Button>
          )}

          {profile.profile?.githubUrl ? (
            <a href={profile.profile.githubUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon" title="GitHub Profile">
                <Github className="w-4 h-4" />
              </Button>
            </a>
          ) : (
            <Button disabled variant="outline" size="icon" title="No GitHub URL added">
              <Github className="w-4 h-4 opacity-50" />
            </Button>
          )}

          {!isPublicView && (
            <Button onClick={() => setIsEditModalOpen(true)} className="rounded-full shadow-sm"><Edit className="w-4 h-4 mr-2" /> Edit Profile</Button>
          )}

          {isPublicView && user?.role === 'FOUNDER' && profile.user?.role === 'TALENT' && (
            <Button onClick={() => setIsHireModalOpen(true)} className="rounded-full shadow-sm bg-gradient-to-r from-primary to-blue-600">
              <Briefcase className="w-4 h-4 mr-2" /> Hire Talent
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 pt-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{profile.profile?.bio || 'No overview provided.'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary" /> Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile.profile?.experience?.map((exp: string, idx: number) => (
                <div key={idx} className="flex gap-4 relative">
                  {idx !== (profile.profile?.experience?.length || 0) - 1 && <div className="absolute left-6 top-10 bottom-0 w-px bg-border"></div>}
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 z-10 border bg-transparent">
                    <Briefcase className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">{exp}</h4>
                  </div>
                </div>
              ))}
              {(!profile.profile?.experience || profile.profile.experience.length === 0) && (
                <p className="text-white/80 text-sm">No experience listed.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Code2 className="w-5 h-5 text-primary" /> Projects & Portfolio</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              {profile.profile?.projects?.map((proj: string, idx: number) => (
                <div key={idx} className="p-4 bg-muted/30 rounded-xl border">
                  <h4 className="font-semibold">{proj}</h4>
                </div>
              ))}
              {(!profile.profile?.projects || profile.profile.projects.length === 0) && (
                <p className="text-white/80 text-sm col-span-2">No projects listed.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.profile?.skills?.map((s: string) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
                {(!profile.profile?.skills || profile.profile.skills.length === 0) && (
                  <p className="text-white/80 text-sm">No skills listed.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><GraduationCap className="w-5 h-5 text-primary" /> Education</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.profile?.education?.map((edu: string, idx: number) => (
                <div key={idx}>
                  <h4 className="font-semibold">{edu}</h4>
                </div>
              ))}
              {(!profile.profile?.education || profile.profile.education.length === 0) && (
                <p className="text-white/80 text-sm">No education listed.</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Award className="w-5 h-5 text-primary" /> Achievements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Award className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Hackathon Winner</h4>
                  <p className="text-xs text-muted-foreground">Global Tech 2023</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        profileData={profile}
        onSave={() => settingsService.getProfile().then(setProfile).catch(() => {})}
      />

      <ImageCropperModal
        isOpen={cropConfig.isOpen}
        onClose={() => setCropConfig(prev => ({ ...prev, isOpen: false }))}
        imageUrl={cropConfig.imageUrl}
        aspectRatio={cropConfig.aspectRatio}
        onCropComplete={handleCropComplete}
      />

      {isPublicView && (
        <HireTalentDialog
          isOpen={isHireModalOpen}
          onClose={() => setIsHireModalOpen(false)}
          talentUuid={profile.user?.uuid}
          talentName={profile.user?.fullName}
        />
      )}
    </div>
  );
}

const Github = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
    <path d="M9 18c-4.51 2-5-2-7-2"/>
  </svg>
)

const Linkedin = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
)
