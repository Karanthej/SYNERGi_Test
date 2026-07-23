import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FounderNotifications() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Notifications</h2>
        <p className="text-white/80 mt-2">This feature is coming soon.</p>
      </div>
      <Card className="border-dashed shadow-none bg-muted/30">
        <CardHeader>
          <CardTitle className="text-muted-foreground font-medium">Under Construction</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We are currently building the foundation for this section. Check back later!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
