import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationSettingsSection } from "@/components/settings/NotificationSettingsSection";
import { GeneralSettingsSection } from "@/components/settings/GeneralSettingsSection";
import { AboutUsSection } from "@/components/settings/AboutUsSection";

export default function FounderSettings() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Settings</h2>
        <p className="text-white/80 mt-2">Manage your account preferences and notifications.</p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="about">About Us</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GeneralSettingsSection />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationSettingsSection />
        </TabsContent>

        <TabsContent value="about" className="mt-6">
          <AboutUsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
