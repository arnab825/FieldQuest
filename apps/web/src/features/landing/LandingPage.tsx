import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  Shield,
  Eye,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  Brain,
  Volume2,
  TreePine,
} from 'lucide-react';

interface LandingPageProps {
  onOpenObjectiveBasis: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenObjectiveBasis }) => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-16 sm:pb-24 border-b border-border-subtle bg-gradient-to-b from-parchment-warm via-paper-white to-parchment-warm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-forest-deep/10 text-forest-deep text-[11px] sm:text-xs font-semibold tracking-wide uppercase mb-4 sm:mb-6">
            <span className="w-2 h-2 rounded-full bg-leaf-accent animate-pulse shrink-0" />
            <span>AI-Guided Nature Exploration PWA</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-editorial text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-forest-deep leading-[1.12] sm:leading-[1.08] mb-4 sm:mb-6 max-w-4xl mx-auto break-words">
            Your neighbourhood is <br className="hidden sm:inline" />
            <span className="italic font-normal text-moss-green">more interesting</span> than your feed.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg md:text-xl text-forest-deep/80 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 font-normal px-1">
            Exchange notification fatigue for living biodiversity. FieldQuest generates sensory observation quests tailored to your time, street, and local flora—powered by private, open-weight AI.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto mb-8 sm:mb-10 w-full">
            <Link
              to="/setup"
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-forest-deep text-paper-white font-medium text-sm sm:text-base shadow-md hover:bg-forest-dark hover:shadow-lg transition-all flex items-center justify-center gap-2.5 group cursor-pointer"
            >
              <Compass className="w-5 h-5 text-leaf-accent group-hover:rotate-45 transition-transform shrink-0" />
              <span>Begin An Adventure</span>
              <ArrowRight className="w-4 h-4 text-leaf-accent animate-pulse-arrow group-hover:translate-x-1.5 transition-transform shrink-0" />
            </Link>

            <button
              onClick={onOpenObjectiveBasis}
              className="w-full sm:w-auto px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl bg-paper-white border border-border-subtle text-forest-deep font-semibold text-xs sm:text-sm hover:bg-parchment-warm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Compass className="w-4 h-4 text-moss-green shrink-0" />
              <span>Our Philosophy</span>
            </button>
          </div>

          {/* Botanical Hero Image Showcase */}
          <div className="max-w-4xl mx-auto rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-border-subtle shadow-xl bg-paper-white p-2.5 sm:p-4 mb-8 sm:mb-10">
            <img
              src="/botanical_hero.jpg"
              alt="Botanical field journal with pressed leaves, specimen sketches, and magnifying glass"
              className="w-full h-auto rounded-xl sm:rounded-2xl object-cover max-h-[260px] sm:max-h-[380px] md:max-h-[440px]"
            />
            <div className="pt-2 sm:pt-3 px-1 sm:px-2 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] sm:text-xs text-text-muted gap-1 text-center sm:text-left">
              <span className="font-editorial italic">Forest Atelier: Botanical Field Observations & Specimen Study</span>
              <span className="font-medium text-forest-deep">Real biological observation over screen scrolling</span>
            </div>
          </div>

          {/* Quick Value Props */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-10 text-[11px] sm:text-xs text-forest-deep/75">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>No Accounts Required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>100% Offline Capable</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Screen-Down Friendly</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Botanical Exploration Pair (Canopy & Micro-Habitat) */}
      <section className="py-16 sm:py-20 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-moss-green mb-2">
            Multimodal Field Studies
          </p>
          <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-forest-deep">
            Grounded in ecological science & sensory presence
          </h2>
          <p className="text-sm text-text-muted max-w-xl mx-auto mt-2">
            Every quest generated by FieldQuest trains real observational competencies rather than passive chatbot consumption.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 mb-8 sm:mb-12">
          {/* Study 1: Canopy & Acoustic Ecology */}
          <div className="bg-paper-white rounded-3xl border border-border-subtle overflow-hidden shadow-xs p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="rounded-2xl overflow-hidden mb-4 border border-border-subtle">
                <img
                  src="/canopy_acoustic.jpg"
                  alt="Sunlit forest canopy with perching robin and dappled light"
                  className="w-full h-44 sm:h-56 object-cover"
                />
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-moss-green mb-1.5">
                <Volume2 className="w-4 h-4" />
                <span>Acoustic Canopy Ecology</span>
              </div>
              <h3 className="font-editorial text-lg sm:text-xl font-bold text-forest-deep mb-2">
                Auditory Isolation & Layering
              </h3>
              <p className="text-xs text-forest-deep/80 leading-relaxed mb-4">
                Separates artificial urban engine rumble from natural high-pitch warblers and leaf rustle. Trains selective sensory attention to perceive local bird territories.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-parchment-warm/70 border border-border-subtle text-[11px] text-forest-deep/80">
              <strong>Objective Basis:</strong> Attention Restoration Theory (Kaplan & Kaplan) — natural acoustic cues induce involuntary soft fascination, reducing mental fatigue.
            </div>
          </div>

          {/* Study 2: Urban Micro-Habitats & Lichen Bio-Indicators */}
          <div className="bg-paper-white rounded-3xl border border-border-subtle overflow-hidden shadow-xs p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="rounded-2xl overflow-hidden mb-4 border border-border-subtle">
                <img
                  src="/urban_microhabitat.jpg"
                  alt="Macro shot of weathered mossy stone and oak bark covered with green and golden lichens"
                  className="w-full h-44 sm:h-56 object-cover"
                />
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-moss-green mb-1.5">
                <TreePine className="w-4 h-4" />
                <span>Micro-Habitat Botany</span>
              </div>
              <h3 className="font-editorial text-lg sm:text-xl font-bold text-forest-deep mb-2">
                Bark Fissures & Lichen Census
              </h3>
              <p className="text-xs text-forest-deep/80 leading-relaxed mb-4">
                Inspects moisture gradients on north/south tree trunks and pioneer flora colonizing concrete seams. Reveals the resilience of spontaneous urban biodiversity.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-parchment-warm/70 border border-border-subtle text-[11px] text-forest-deep/80">
              <strong>Objective Basis:</strong> Lichens are symbiotic algae-fungi organisms that act as sensitive bio-indicators of atmospheric sulfur dioxide and urban micro-climate.
            </div>
          </div>
        </div>

        {/* Actionable link to setup */}
        <div className="text-center">
          <Link
            to="/setup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-forest-deep text-paper-white text-xs sm:text-sm font-semibold hover:bg-forest-dark transition-colors shadow-sm cursor-pointer"
          >
            <span>Configure a 15-Minute Micro-Quest</span>
            <ArrowRight className="w-3.5 h-3.5 text-leaf-accent" />
          </Link>
        </div>
      </section>

      {/* The Three Pillars Section */}
      <section className="py-12 sm:py-20 border-t border-border-subtle bg-paper-white/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <h2 className="font-editorial text-2xl sm:text-4xl font-bold text-forest-deep mb-2 sm:mb-3">
              Designed for the living world
            </h2>
            <p className="text-xs sm:text-base text-forest-deep/75">
              Built with principles that encourage sensory presence rather than prolonged screen time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
            {/* Pillar 1 */}
            <div className="p-5 sm:p-6 rounded-2xl bg-paper-white border border-border-subtle hover:border-moss-green/40 transition-colors">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-forest-deep text-leaf-accent flex items-center justify-center mb-4 sm:mb-5">
                <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-editorial text-lg sm:text-xl font-bold text-forest-deep mb-2">
                Screen-Down Exploration
              </h3>
              <p className="text-xs sm:text-sm text-forest-deep/80 leading-relaxed">
                Start a quest, read the prompt, and slip your phone into your pocket. Low-distraction screen-down mode preserves your focus on the surroundings.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-5 sm:p-6 rounded-2xl bg-paper-white border border-border-subtle hover:border-moss-green/40 transition-colors">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-forest-deep text-leaf-accent flex items-center justify-center mb-4 sm:mb-5">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-editorial text-lg sm:text-xl font-bold text-forest-deep mb-2">
                Open-Weight Local AI
              </h3>
              <p className="text-xs sm:text-sm text-forest-deep/80 leading-relaxed">
                Mission prompts are generated by local open-weight models (Ollama with Qwen or Gemma) or our zero-dependency deterministic fallback engine.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-5 sm:p-6 rounded-2xl bg-paper-white border border-border-subtle hover:border-moss-green/40 transition-colors">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-forest-deep text-leaf-accent flex items-center justify-center mb-4 sm:mb-5">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-editorial text-lg sm:text-xl font-bold text-forest-deep mb-2">
                Offline-First & Private
              </h3>
              <p className="text-xs sm:text-sm text-forest-deep/80 leading-relaxed">
                No tracking, no invasive GPS logging. All field notes and photos remain securely stored in your local browser IndexedDB.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-forest-deep text-center mb-8 sm:mb-12">
          How FieldQuest Works
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
          {/* Step 1 */}
          <div className="text-center space-y-2.5 sm:space-y-3 relative p-4 sm:p-5 rounded-2xl bg-paper-white/70 border border-border-subtle/80 shadow-xs hover:border-moss-green/50 hover:shadow-sm transition-all">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-parchment-warm border-2 border-forest-deep text-forest-deep font-editorial font-bold flex items-center justify-center mx-auto text-base sm:text-lg shadow-xs">
              1
            </div>
            <h4 className="font-editorial text-base sm:text-lg font-bold text-forest-deep">
              Set Your Scope
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Choose 15, 30, or 60 minutes and select your environment (park, street, balcony, garden).
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center space-y-2.5 sm:space-y-3 relative p-4 sm:p-5 rounded-2xl bg-paper-white/70 border border-border-subtle/80 shadow-xs hover:border-moss-green/50 hover:shadow-sm transition-all">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-parchment-warm border-2 border-forest-deep text-forest-deep font-editorial font-bold flex items-center justify-center mx-auto text-base sm:text-lg shadow-xs">
              2
            </div>
            <h4 className="font-editorial text-base sm:text-lg font-bold text-forest-deep">
              Observe In The Field
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Engage with one observation quest at a time with screen-down pauses and mindful sensory checks.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center space-y-2.5 sm:space-y-3 relative p-4 sm:p-5 rounded-2xl bg-paper-white/70 border border-border-subtle/80 shadow-xs hover:border-moss-green/50 hover:shadow-sm transition-all">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-parchment-warm border-2 border-forest-deep text-forest-deep font-editorial font-bold flex items-center justify-center mx-auto text-base sm:text-lg shadow-xs">
              3
            </div>
            <h4 className="font-editorial text-base sm:text-lg font-bold text-forest-deep">
              Journal & Reflect
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Capture reflections and photos in your private, offline nature journal stored locally in IndexedDB.
            </p>
          </div>
        </div>

        <div className="mt-10 sm:mt-14 text-center flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full">
          <Link
            to="/setup"
            className="w-full sm:w-auto group inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 rounded-xl bg-forest-deep text-paper-white text-xs sm:text-sm font-medium hover:bg-forest-dark transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <Eye className="w-4 h-4 text-leaf-accent group-hover:scale-110 transition-transform shrink-0" />
            <span>Create Your First Quest</span>
            <ArrowRight className="w-4 h-4 text-leaf-accent animate-pulse-arrow group-hover:translate-x-2 transition-transform shrink-0" />
          </Link>

          <button
            onClick={onOpenObjectiveBasis}
            className="w-full sm:w-auto px-5 sm:px-6 py-3.5 rounded-xl border border-border-subtle bg-paper-white text-forest-deep font-semibold text-xs hover:bg-parchment-warm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Brain className="w-4 h-4 text-moss-green shrink-0" />
            <span>Philosophy & Science</span>
          </button>
        </div>
      </section>
    </div>
  );
};
