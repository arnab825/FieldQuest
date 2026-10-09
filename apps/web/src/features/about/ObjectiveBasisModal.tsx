import React from 'react';
import {
  X,
  Target,
  Brain,
  ShieldCheck,
  Cpu,
  Compass,
  CheckCircle2,
} from 'lucide-react';

interface ObjectiveBasisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ObjectiveBasisModal: React.FC<ObjectiveBasisModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-forest-dark/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-paper-white rounded-3xl border border-border-subtle p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-text-muted hover:text-forest-deep transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 border-b border-border-subtle pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-deep/10 text-forest-deep text-xs font-semibold uppercase tracking-wider mb-2">
            <Target className="w-3.5 h-3.5 text-moss-green" />
            <span>Product Mission & Judges Guide</span>
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-forest-deep">
            Objective Basis & Purpose of FieldQuest
          </h2>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Why this project exists, the scientific and educational foundation, and how it is evaluated.
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-forest-deep/90 leading-relaxed">
          {/* 1. Core Problem & Product Purpose */}
          <section className="bg-parchment-warm/60 rounded-2xl p-4 sm:p-5 border border-border-subtle">
            <h3 className="font-editorial text-base font-bold text-forest-deep flex items-center gap-2 mb-2">
              <Compass className="w-4 h-4 text-moss-green" />
              1. The Fundamental Purpose
            </h3>
            <p className="text-forest-deep/80 mb-2">
              Modern digital apps are engineered for screen capture, converting outdoor walks into notification checks or endless camera filter feeds.
            </p>
            <p className="font-medium text-forest-deep">
              <strong>FieldQuest’s purpose:</strong> Reclaim human attention by using open-weight AI to generate structured, tactile, sensory observation quests that demand <em>putting the screen away</em> and observing living ecosystems.
            </p>
          </section>

          {/* 2. Scientific & Educational Objective Basis */}
          <section className="space-y-3">
            <h3 className="font-editorial text-base font-bold text-forest-deep flex items-center gap-2">
              <Brain className="w-4 h-4 text-moss-green" />
              2. Scientific & Ecological Objective Basis
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-border-subtle bg-paper-white space-y-1">
                <span className="font-bold text-forest-deep block">Attention Restoration Theory (ART)</span>
                <p className="text-xs text-text-muted">
                  Rooted in Kaplan & Kaplan’s cognitive psychology: involuntary natural sensory engagement ("soft fascination") restores executive mental fatigue caused by screen overstimulation.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border-subtle bg-paper-white space-y-1">
                <span className="font-bold text-forest-deep block">Botanical Functional Morphology</span>
                <p className="text-xs text-text-muted">
                  Missions ground explorers in real biological principles: venation architecture, bark moisture gradients, and lichen as symbiotic bio-indicators of air quality.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border-subtle bg-paper-white space-y-1">
                <span className="font-bold text-forest-deep block">Acoustic Ecology & Sound Mapping</span>
                <p className="text-xs text-text-muted">
                  Separating artificial anthropogenic background noise from natural avian and wind frequencies trains selective auditory attention.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border-subtle bg-paper-white space-y-1">
                <span className="font-bold text-forest-deep block">Spontaneous Urban Biodiversity</span>
                <p className="text-xs text-text-muted">
                  Focuses on micro-habitats in human-built masonry and sidewalks, proving that nature is everywhere—not just in distant national parks.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Why It's Not Just Another AI Wrapper */}
          <section className="bg-forest-deep/5 rounded-2xl p-4 sm:p-5 border border-forest-deep/15 space-y-2">
            <h3 className="font-editorial text-base font-bold text-forest-deep flex items-center gap-2">
              <Cpu className="w-4 h-4 text-moss-green" />
              3. The Technical Innovation: Anti-Chatbot Architecture
            </h3>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span><strong>Action-Oriented Prompts:</strong> Rather than conversational chat, the AI generates typed, schema-validated mission objectives with strict safety rules.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span><strong>Local & Sovereign AI:</strong> Powered by Ollama running open-weight <code className="bg-parchment-warm px-1 py-0.5 rounded text-forest-deep font-mono">qwen3:4b</code> or Google Gemma. No user prompts or journals are transmitted to commercial cloud AI vendors.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span><strong>Screen-Down Mode:</strong> The interface dims to low-power dark green and reminds explorers to keep the phone in their pocket while listening and looking.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span><strong>Zero-Account Local-First IndexedDB:</strong> Field notes, reflections, and photos remain durable on device even on remote trails without internet access.</span>
              </li>
            </ul>
          </section>

          {/* 4. Judges Evaluation Checklist */}
          <section className="border border-border-subtle rounded-2xl p-4 sm:p-5 bg-paper-white space-y-2">
            <h3 className="font-editorial text-base font-bold text-forest-deep flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              4. Quick Guide for Judges
            </h3>
            <div className="space-y-1.5 text-xs text-forest-deep/80">
              <p>• <strong>Immediate Demo Mode:</strong> Test full adventure flows instantly without setting up local GPU daemons.</p>
              <p>• <strong>Real Local AI:</strong> Spin up Ollama with <code className="font-mono text-forest-deep">qwen3:4b</code> to observe real inference with strict Zod parsing.</p>
              <p>• <strong>Safety Protocols:</strong> Prompts enforce leave-no-trace ethics and prohibit consuming wild flora or touching wildlife.</p>
              <p>• <strong>PWA Readiness:</strong> Service workers cache static assets for offline capability.</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-border-subtle flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-forest-deep text-paper-white text-xs font-semibold hover:bg-forest-dark transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
