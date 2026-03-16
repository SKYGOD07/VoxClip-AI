import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Film, Mic, Scissors, Sparkles, Wand2, Zap, AudioLines, Code, Youtube, Twitter, Github } from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <motion.div 
    whileHover={{ scale: 1.05 }}
    className="relative p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-colors"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl -z-10" />
    <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </motion.div>
);

const StepCard = ({ number, title, description }: { number: string, title: string, description: string }) => (
  <div className="flex flex-col items-center text-center max-w-sm">
    <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground mb-4 shadow-[0_0_30px_rgba(var(--primary),0.5)]">
      {number}
    </div>
    <h4 className="text-lg font-bold mb-2">{title}</h4>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 border-b border-border/40 bg-background/60 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">VoxClip AI</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/SKYGOD07/VoxClip-AI" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <Github className="h-5 w-5" />
            </a>
            <Link href="/app">
              <Button size="sm" className="rounded-full shadow-[0_0_15px_rgba(var(--primary),0.3)]">Launch App</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-6 pt-32 pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              <span>The Future of Video Editing is Conversational</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 max-w-4xl leading-tight">
              Edit videos just by <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">talking to an AI</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mb-12 leading-relaxed">
              VoxClip AI is a real-time multimodal agent that replaces manual timeline scrubbing with voice commands. Extract highlights, remove silence, and create perfect clips instantly.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/app">
                <Button size="lg" className="rounded-full h-14 px-8 text-lg gap-2 shadow-[0_0_30px_rgba(var(--primary),0.4)] hover:shadow-[0_0_40px_rgba(var(--primary),0.6)] transition-shadow">
                  <Mic className="h-5 w-5" />
                  Try it Now
                </Button>
              </Link>
              <a href="https://github.com/SKYGOD07/VoxClip-AI" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-lg gap-2 border-border/50 hover:bg-accent/50">
                  <Code className="h-5 w-5" />
                  View the Code
                </Button>
              </a>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-black/40 border-y border-border/40">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Key Capabilities</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Transform your video editing from a tedious, timeline-based workflow into a natural conversational interface.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard 
                icon={Mic}
                title="Voice-Controlled Editing"
                description="Simply say 'Extract the highlight' or 'Cut the funny moment'. The agent understands and executes."
              />
              <FeatureCard 
                icon={Sparkles}
                title="Auto Highlight Detection"
                description="Our AI scores segments based on sentiment, intensity, and context to find the best moments."
              />
              <FeatureCard 
                icon={AudioLines}
                title="Silence & Filler Removal"
                description="Automatically detect and trim dead air, 'ums', and 'uhs' to keep your content engaging."
              />
              <FeatureCard 
                icon={Scissors}
                title="Smart Clip Extraction"
                description="Generates optimized, share-ready clips from long-form content in seconds."
              />
              <FeatureCard 
                icon={Wand2}
                title="Real-Time Interaction"
                description="Experience a responsive, conversational workflow that feels like working with a human editor."
              />
              <FeatureCard 
                icon={Zap}
                title="Multimodal Reasoning"
                description="Analyzes both audio transcripts and visual cues simultaneously for flawless context understanding."
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">A modern AI-driven architecture combining multimodal reasoning with robust video processing.</p>
            </div>
            
            <div className="relative">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-[4.5rem] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -z-10" />
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                <StepCard number="1" title="Upload & Speak" description="Upload a long video and give a natural voice command." />
                <StepCard number="2" title="Process & Transcribe" description="FFmpeg extracts audio, and the system generates a transcript." />
                <StepCard number="3" title="AI Analysis" description="Gemini processes the speech intent and scores highlights." />
                <StepCard number="4" title="Clips Generated" description="The system cuts the best moments and returns them instantly." />
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="py-24 bg-black/40 border-y border-border/40">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Built With</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Powered by a cutting-edge serverless and AI stack.</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
              {['TypeScript', 'Node.js', 'React', 'Vite', 'TailwindCSS', 'FFmpeg', 'Google Gemini API', 'Google GenAI SDK', 'Google Cloud Run', 'Google Cloud Storage'].map((tech) => (
                <div key={tech} className="px-6 py-3 rounded-full bg-card/80 border border-border/50 text-sm font-medium hover:bg-primary/10 hover:border-primary/30 transition-colors cursor-default">
                  {tech}
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Call to Action */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-50" />
          <div className="container mx-auto px-6 relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to revolutionize your workflow?</h2>
            <Link href="/app">
              <Button size="lg" className="rounded-full h-16 px-10 text-xl gap-2 shadow-[0_0_40px_rgba(var(--primary),0.5)]">
                Try VoxClip AI Now
                <Zap className="h-6 w-6 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/80 py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            <span className="font-semibold">VoxClip AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built for the Gemini Live Agent Hackathon.
          </p>
          <div className="flex gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="link" className="text-muted-foreground hover:text-foreground">Challenges & Learnings</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Challenges & Learnings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm mt-4">
                  <h4 className="font-bold text-lg">Ambiguous Commands</h4>
                  <p>Commands like "Find the interesting part" lack timestamps. We combined transcript sentiment, speech intensity, keyword detection, and contextual scoring to solve this.</p>
                  
                  <h4 className="font-bold text-lg">Accomplishments</h4>
                  <p>We built a working prototype where video editing becomes voice-driven, clips are generated automatically, and the agent responds conversationally.</p>
                  
                  <h4 className="font-bold text-lg">What we learned</h4>
                  <p>Multimodal AI agents can transform creative workflows, removing the traditional barriers of video production.</p>
                  
                  <h4 className="font-bold text-lg">What's Next</h4>
                  <p>Emotion detection from frames, automatic subtitle generation, social media formatting, multi-speaker highlight detection, and smarter workflows.</p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </footer>
    </div>
  );
}
