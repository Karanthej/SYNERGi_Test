// @ts-nocheck
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, Briefcase, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuth } from "@clerk/clerk-react";

export default function RoleSelection() {
  const navigate = useNavigate();
  const { updateUser, clearAuth } = useAuthStore();
  const { signOut } = useAuth();

  return (
    <div className="min-h-[100dvh] bg-transparent flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Welcome to SYNERGI</h1>
          <p className="text-xl text-muted-foreground">Choose how you want to get started</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="h-full border-2 hover:border-primary transition-colors cursor-pointer group flex flex-col">
              <CardHeader className="text-center pt-8">
                <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Rocket className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-2xl">Use as Startup</CardTitle>
                <CardDescription className="text-base mt-2">
                  Create your startup, build your team and bring your ideas to life.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pb-8">
                <Button 
                  size="lg" 
                  className="w-full text-lg" 
                  onClick={() => {
                    updateUser({ role: "FOUNDER" });
                    navigate("/onboarding/founder");
                  }}
                >
                  Continue as Startup
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full border-2 hover:border-primary transition-colors cursor-pointer group flex flex-col">
              <CardHeader className="text-center pt-8">
                <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-2xl">Use as Role in Startup</CardTitle>
                <CardDescription className="text-base mt-2">
                  Join exciting startups and work on amazing ideas.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pb-8">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full text-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors" 
                  onClick={() => {
                    updateUser({ role: "TALENT" });
                    navigate("/onboarding/talent");
                  }}
                >
                  Continue as Talent
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="pt-8"
        >
          <Button 
            variant="ghost" 
            onClick={() => {
              signOut().then(() => {
                clearAuth();
                navigate("/login");
              });
            }}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
