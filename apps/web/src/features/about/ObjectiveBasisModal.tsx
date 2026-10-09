import React, { useState } from 'react';
import {
  X,
  Compass,
  Brain,
  ShieldCheck,
  Cpu,
  Eye,
  Leaf,
  Volume2,
  Sprout,
  Smartphone,
  BookOpen,
  Sparkles,
  Info,
} from 'lucide-react';

interface ObjectiveBasisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'philosophy' | 'science' | 'technology';

export const ObjectiveBasisModal: React.FC<ObjectiveBasisModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('philosophy');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-forest-dark/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-paper-white rounded-3xl border border-border-subtle p-5 sm:p-8 max-w-2xl w-full shadow-2xl relative max-h-[92vh] flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-xl text-text-muted hover:text-forest-deep hover:bg-parchment-warm transition-colors cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4 sm:mb-5 pb-4 border-b border-border-subtle pr-8 sm:pr-0 shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-deep/10 text-forest-deep text-xs font-semibold uppercase tracking-wider mb-2">
            <Leaf className="w-3.5 h-3.5 text-moss-green" />
            <span>Field Philosophy & Science</span>
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-forest-deep">
            The Story & Science of FieldQuest
          </h2>
          <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
            How sensory nature quests restore attention and reconnect us with local biodiversity.
          </p>

          {/* Interactive Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-parchment-warm/80 rounded-xl border border-border-subtle mt-4">
            {[
              { id: 'philosophy', label: '🌿 Our Philosophy', icon: Compass },
              { id: 'science', label: '🔬 Ecological Science', icon: Brain },
              { id: 'technology', label: '🛡️ Privacy & Tech', icon: Cpu },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-paper-white text-forest-deep shadow-2xs font-bold'
                    : 'text-text-muted hover:text-forest-deep hover:bg-paper-white/50'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="space-y-4 text-xs sm:text-sm text-forest-deep/90 leading-relaxed overflow-y-auto pr-1">
          {/* TAB 1: PHILOSOPHY & MISSION */}
          {activeTab === 'philosophy' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <section className="bg-parchment-warm/60 rounded-2xl p-4 sm:p-5 border border-border-subtle space-y-2.5">
                <div className="flex items-center gap-2 text-forest-deep font-bold font-editorial text-sm sm:text-base">
                  <div className="w-6 h-6 rounded-lg bg-forest-deep/10 flex items-center justify-center shrink-0">
                    <Compass className="w-3.5 h-3.5 text-moss-green" />
                  </div>
                  <span>The Fundamental Purpose: Reclaiming Human Attention</span>
                </div>
                <p className="text-forest-deep/80 leading-relaxed">
                  Most modern apps are engineered to capture your gaze and keep your eyes glued to a glass screen. Even walking in a park often turns into checking notifications, taking disposable selfies, or browsing social feeds.
                </p>
                <div className="p-3 rounded-xl bg-paper-white/80 border border-border-subtle/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-forest-deep font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-moss-green" />
                    <span>The FieldQuest Pledge:</span>
                  </div>
                  <p className="text-xs text-forest-deep/80 leading-relaxed">
                    We use AI not to keep you on the phone, but to give you a single thoughtful prompt—and then encourage you to <strong>put the device away</strong>, look up, touch bark, listen to wind tiers, and notice the living world around you.
                  </p>
                </div>
              </section>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-border-subtle bg-paper-white space-y-1.5">
                  <div className="flex items-center gap-2 text-forest-deep font-bold text-xs">
                    <div className="w-6 h-6 rounded-lg bg-forest-deep/10 flex items-center justify-center shrink-0">
                      <Eye className="w-3.5 h-3.5 text-moss-green" />
                    </div>
                    <span>Everyday Wonder</span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    You don't need a national park to experience nature. A single brick wall covered in moss or a dandelion cracking through urban asphalt holds an entire living ecosystem.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-border-subtle bg-paper-white space-y-1.5">
                  <div className="flex items-center gap-2 text-forest-deep font-bold text-xs">
                    <div className="w-6 h-6 rounded-lg bg-forest-deep/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-3.5 h-3.5 text-moss-green" />
                    </div>
                    <span>Tactile Naturalist Journaling</span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Inspiring explorers with authentic vintage botanical plates, sensory field notes, and artistic sketches that celebrate curiosity rather than gamified screen time.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ECOLOGICAL SCIENCE */}
          {activeTab === 'science' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <section className="bg-forest-deep/5 rounded-2xl p-4 border border-forest-deep/15 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-moss-green shrink-0" />
                  <span className="font-editorial font-bold text-forest-deep text-sm block">
                    Grounding Quests in Real Cognitive & Biological Research
                  </span>
                </div>
                <p className="text-xs text-forest-deep/80 pl-6">
                  Every observational mission generated by FieldQuest is informed by empirical psychological and ecological foundations:
                </p>
              </section>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Attention Restoration Theory */}
                <div className="p-3.5 rounded-xl border border-border-subtle bg-paper-white space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-forest-deep/10 flex items-center justify-center shrink-0">
                      <Brain className="w-4 h-4 text-moss-green" />
                    </div>
                    <span className="font-bold text-forest-deep text-xs">
                      Attention Restoration Theory (ART)
                    </span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Formulated by Kaplan & Kaplan: natural sensory stimuli engage effortless "soft fascination", allowing the brain's prefrontal cortex to recover from screen-induced cognitive fatigue.
                  </p>
                </div>

                {/* 2. Botanical Morphology */}
                <div className="p-3.5 rounded-xl border border-border-subtle bg-paper-white space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center shrink-0">
                      <Leaf className="w-4 h-4 text-emerald-700" />
                    </div>
                    <span className="font-bold text-forest-deep text-xs">
                      Botanical Morphology
                    </span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Missions guide explorers through venation architecture, cuticle waxiness, and bilateral symmetry—teaching the functional reasons plants have adapted to their local microclimate.
                  </p>
                </div>

                {/* 3. Acoustic Ecology */}
                <div className="p-3.5 rounded-xl border border-border-subtle bg-paper-white space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200/60 flex items-center justify-center shrink-0">
                      <Volume2 className="w-4 h-4 text-sky-700" />
                    </div>
                    <span className="font-bold text-forest-deep text-xs">
                      Acoustic Ecology
                    </span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Training selective auditory attention to distinguish low-frequency anthropogenic background hum from layered avian signals and wind rustling through distinct canopy tiers.
                  </p>
                </div>

                {/* 4. Urban Biodiversity */}
                <div className="p-3.5 rounded-xl border border-border-subtle bg-paper-white space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0">
                      <Sprout className="w-4 h-4 text-amber-700" />
                    </div>
                    <span className="font-bold text-forest-deep text-xs">
                      Urban Biodiversity
                    </span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Spotlighting pioneer lichens and sidewalk flora as air-quality bio-indicators, proving that biodiversity thrives right outside your front doorstep.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY & TECHNOLOGY */}
          {activeTab === 'technology' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <section className="bg-paper-white rounded-2xl p-4 sm:p-5 border border-border-subtle space-y-3">
                <div className="flex items-center gap-2 text-forest-deep font-bold font-editorial text-sm sm:text-base">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Sovereign, Private & Anti-Chatbot Architecture</span>
                </div>
                <ul className="space-y-2.5 text-xs">
                  <li className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    </div>
                    <span><strong>100% On-Device Data:</strong> Your journals, personal notes, and specimen sketches live in browser IndexedDB. Nothing is ever sent to commercial tracking servers.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-forest-deep/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Cpu className="w-3.5 h-3.5 text-forest-deep" />
                    </div>
                    <span><strong>Anti-Chatbot Design:</strong> AI delivers structured, typed mission objectives instead of conversational chat threads designed to hold your attention hostage.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                      <Smartphone className="w-3.5 h-3.5 text-amber-700" />
                    </div>
                    <span><strong>Screen-Down Mode:</strong> Low-power sensory dimmer gently reminds you to pocket the device while walking and observing.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                      <Leaf className="w-3.5 h-3.5 text-emerald-700" />
                    </div>
                    <span><strong>Ethical Nature Safety:</strong> Built-in leave-no-trace protocols forbid foraging wild edible plants, disturbing nests, or handling fauna.</span>
                  </li>
                </ul>
              </section>

              <div className="p-3.5 rounded-xl bg-forest-deep/5 border border-forest-deep/15 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-moss-green shrink-0 mt-0.5" />
                <p className="text-xs text-forest-deep/80 leading-relaxed">
                  <strong>Evaluator & Hackathon Note:</strong> You can test with instant curated Demo Mode or connect to a local Ollama daemon (<code className="font-mono text-forest-deep bg-paper-white px-1 py-0.5 rounded">qwen2.5:3b</code>). Works offline with full Progressive Web App (PWA) caching.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between shrink-0">
          <span className="text-[11px] text-text-muted">
            FieldQuest • Built for human curiosity & screen-free connection
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-forest-deep text-paper-white text-xs font-semibold hover:bg-forest-dark transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
