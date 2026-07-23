import { Mail, AtSign, Rocket, Target, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AboutUsSection() {
  return (
    <div className="space-y-12 pb-12">
      {/* Founders Section */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">Meet the Founders</h3>
          <p className="text-muted-foreground">The visionaries behind SYNERGi. Designed and Developed by both.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Founder 1 */}
          <div className="glass-card rounded-2xl p-8 border flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all duration-300">
            <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-background shadow-lg overflow-hidden mb-6 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">VK</span>
            </div>
            <h4 className="text-xl font-bold text-foreground mb-1">VEMULA KARANTHEJ</h4>
            <p className="text-sm text-primary font-medium mb-4">Founder</p>
            <p className="text-sm text-muted-foreground">
              Driving the architectural vision and engineering excellence of SYNERGi.
            </p>
          </div>

          {/* Founder 2 */}
          <div className="glass-card rounded-2xl p-8 border flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all duration-300">
            <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-background shadow-lg overflow-hidden mb-6 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">AA</span>
            </div>
            <h4 className="text-xl font-bold text-foreground mb-1">ANKUNCHE ADITHYA</h4>
            <p className="text-sm text-primary font-medium mb-4">Founder</p>
            <p className="text-sm text-muted-foreground">
              Spearheading product strategy and shaping the ultimate user experience.
            </p>
          </div>
        </div>
      </section>

      {/* About SYNERGi Section */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">About SYNERGi</h3>
        </div>
        <div className="glass-surface rounded-2xl p-8 border shadow-sm space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Rocket className="w-6 h-6 text-primary" />
              </div>
              <h4 className="text-lg font-bold text-foreground">What is SYNERGi?</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                SYNERGi is a next-generation platform designed to bridge the gap between visionary founders and exceptional talent. It is a unified ecosystem where ideas meet execution.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h4 className="text-lg font-bold text-foreground">Our Mission</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                To democratize startup creation by removing the friction of team building. We empower innovators to find their perfect co-founders and early-stage team members.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h4 className="text-lg font-bold text-foreground">Our Purpose</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We believe that the best startups are built by diverse, connected teams. SYNERGi exists to cultivate collaboration and help you build the future together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us & Connect With Us Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Us */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight text-foreground">Contact Us</h3>
          </div>
          <div className="glass-card rounded-2xl p-8 border flex flex-col items-center justify-center text-center h-[280px]">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">Have feedback, bug reports, or feature requests?</p>
            <p className="text-base font-medium text-foreground mb-6">synergiofficial2026@gmail.com</p>
            <Button 
              onClick={() => window.location.href = 'mailto:synergiofficial2026@gmail.com'}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:scale-105 transition-all w-full sm:w-auto"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email Us
            </Button>
          </div>
        </section>

        {/* Connect With Us */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight text-foreground">Connect With Us</h3>
          </div>
          <div className="glass-card rounded-2xl p-8 border flex flex-col justify-center h-[280px] space-y-4">
            <a 
              href="https://instagram.com/synergi_official_ig" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-black/10 dark:hover:border-white/10 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </div>
              <div>
                <h4 className="font-bold text-foreground">Instagram</h4>
                <p className="text-sm text-muted-foreground">@synergi_official_ig</p>
              </div>
            </a>

            <a 
              href="https://threads.net/@synergi_official_threads" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-black/10 dark:hover:border-white/10 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center text-background shadow-md group-hover:scale-110 transition-transform">
                <AtSign className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">Threads</h4>
                <p className="text-sm text-muted-foreground">@synergi_official_threads</p>
              </div>
            </a>
          </div>
        </section>
      </div>

      {/* Copyrights */}
      <div className="pt-12 flex flex-col items-center justify-center text-center">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} SYNERGi. All rights reserved.
        </p>
      </div>
    </div>
  );
}
