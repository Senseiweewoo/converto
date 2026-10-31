'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Check, 
  X, 
  ShieldCheck, 
  Zap, 
  Building2, 
  Sparkles, 
  HelpCircle, 
  ArrowRight,
  Cpu,
  Lock,
  Download
} from 'lucide-react';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = (plan: string) => {
    if (plan === 'Free') {
      window.location.href = '/';
      return;
    }
    setSelectedPlan(plan);
    setShowCheckoutModal(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium mb-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          Honest & Transparent Pricing &bull; No Surprise Watermarks
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
          Free Forever for Local Work. <br />
          <span className="text-emerald-600 dark:text-emerald-400">Power Up When You Need Cloud.</span>
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          All core PDF tools run 100% locally in your browser for free with zero telemetry and no account needed. Upgrade only for heavy cloud OCR, AI features, and team infrastructure.
        </p>

        {/* Billing Switcher */}
        <div className="mt-8 inline-flex items-center p-1 bg-muted rounded-xl border border-border">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              billingCycle === 'monthly'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              billingCycle === 'yearly'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Yearly Billing
            <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500 text-white rounded font-bold uppercase tracking-wider">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {/* Free Plan */}
        <div className="relative bg-card border border-border rounded-2xl p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Local-First
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-muted text-xs font-medium">Free Always</span>
            </div>
            <h3 className="text-2xl font-bold mb-1">Community Free</h3>
            <p className="text-xs text-muted-foreground mb-6">
              Complete offline-capable PDF toolkit running entirely in your browser.
            </p>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold">$0</span>
              <span className="text-xs text-muted-foreground">forever</span>
            </div>

            <ul className="space-y-3 text-xs text-muted-foreground mb-8">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong className="text-foreground">All 20+ local tools</strong> (Merge, Split, Compress, etc.)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong className="text-foreground">Zero watermarks</strong> or forced sign-ups</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Unlimited files up to browser RAM limits</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Client-side Tesseract.js OCR engine</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Live Privacy Network Auditor badge</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>WebCrypto AES-256 local profiles</span>
              </li>
              <li className="flex items-center gap-2 opacity-50">
                <X className="w-4 h-4 text-rose-500 shrink-0" />
                <span>High-accuracy Cloud GPU OCR</span>
              </li>
              <li className="flex items-center gap-2 opacity-50">
                <X className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Unlimited AI Assistant queries</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleSelectPlan('Free')}
            className="w-full py-2.5 px-4 rounded-xl border border-border bg-muted/40 hover:bg-muted font-medium text-xs transition-colors"
          >
            Start Free Now
          </button>
        </div>

        {/* Pro Plan */}
        <div className="relative bg-card border-2 border-emerald-600 dark:border-emerald-500 rounded-2xl p-7 shadow-lg flex flex-col justify-between">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-full uppercase tracking-wider shadow">
            Most Popular
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Power User
              </span>
              <span className="p-1 bg-emerald-500/10 text-emerald-600 rounded">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-1">Converto Pro</h3>
            <p className="text-xs text-muted-foreground mb-6">
              For professionals handling complex scans, large batches, and AI tasks.
            </p>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold">
                {billingCycle === 'monthly' ? '$10' : '$8'}
              </span>
              <span className="text-xs text-muted-foreground">/ month</span>
            </div>

            <ul className="space-y-3 text-xs text-muted-foreground mb-8">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong className="text-foreground">Everything in Free</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong className="text-foreground">High-Accuracy Cloud OCR</strong> (100+ languages, handwriting)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong className="text-foreground">AI Document Assistant</strong> (Chat with page citations)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Structured invoice & receipt data extraction (CSV/JSON)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Batch processing up to 200 files concurrently</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>30-Day tokenized secure share links</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Priority email support</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleSelectPlan('Pro')}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            Upgrade to Pro <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className="relative bg-card border border-border rounded-2xl p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Teams & Org
              </span>
              <span className="p-1 bg-muted text-muted-foreground rounded">
                <Building2 className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-1">Teams & Org</h3>
            <p className="text-xs text-muted-foreground mb-6">
              Self-hosted Docker runner, team shared workflows, and developer API keys.
            </p>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold">
                {billingCycle === 'monthly' ? '$29' : '$24'}
              </span>
              <span className="text-xs text-muted-foreground">/ seat / mo</span>
            </div>

            <ul className="space-y-3 text-xs text-muted-foreground mb-8">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong className="text-foreground">Everything in Pro</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong className="text-foreground">Self-Hosted Docker Runner</strong> (Air-gapped)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Developer REST API & CLI tokens (100k calls/mo)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Custom team branding & watermark policies</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>SAML SSO / Google Workspace directory sync</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>SOC2 Compliance reports & signed DPA</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleSelectPlan('Teams')}
            className="w-full py-2.5 px-4 rounded-xl border border-border bg-muted/40 hover:bg-muted font-medium text-xs transition-colors"
          >
            Contact Team Sales
          </button>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="mb-16">
        <h2 className="text-xl font-bold mb-6 text-center">Comprehensive Plan Comparison</h2>
        <div className="overflow-x-auto border border-border rounded-2xl bg-card">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="py-3 px-4 font-semibold text-foreground">Capability</th>
                <th className="py-3 px-4 font-semibold text-center text-foreground">Community Free</th>
                <th className="py-3 px-4 font-semibold text-center text-emerald-600">Pro Plan</th>
                <th className="py-3 px-4 font-semibold text-center text-foreground">Teams & Org</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr>
                <td className="py-3 px-4 font-medium">In-Browser PDF Processing Engine</td>
                <td className="py-3 px-4 text-center">Unlimited</td>
                <td className="py-3 px-4 text-center">Unlimited</td>
                <td className="py-3 px-4 text-center">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Watermark or Brand Stamping</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-semibold">Zero forced stamps</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-semibold">Zero forced stamps</td>
                <td className="py-3 px-4 text-center font-semibold">Custom brand stamp</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">IndexedDB Session Time Machine & Undo</td>
                <td className="py-3 px-4 text-center">Full support</td>
                <td className="py-3 px-4 text-center">Full support</td>
                <td className="py-3 px-4 text-center">Full support</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Visual Workflow Automation Pipelines</td>
                <td className="py-3 px-4 text-center">Local presets</td>
                <td className="py-3 px-4 text-center">Unlimited presets</td>
                <td className="py-3 px-4 text-center">Team-shared pipelines</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">AI Document Assistant (Chat & Citations)</td>
                <td className="py-3 px-4 text-center text-muted-foreground">3 docs / day</td>
                <td className="py-3 px-4 text-center font-semibold">Unlimited</td>
                <td className="py-3 px-4 text-center font-semibold">Unlimited + Custom LLM</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Deterministic PII Auto-Redaction (Luhn)</td>
                <td className="py-3 px-4 text-center">Full browser engine</td>
                <td className="py-3 px-4 text-center">Full browser engine</td>
                <td className="py-3 px-4 text-center">Full + API enforcement</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Developer CLI & REST API Access</td>
                <td className="py-3 px-4 text-center text-muted-foreground">Open-source CLI</td>
                <td className="py-3 px-4 text-center">5,000 requests / mo</td>
                <td className="py-3 px-4 text-center font-semibold">100,000+ requests / mo</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Self-Hosted Air-Gapped Deployment</td>
                <td className="py-3 px-4 text-center text-muted-foreground">-</td>
                <td className="py-3 px-4 text-center text-muted-foreground">-</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-semibold">Docker Image Included</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Honest Privacy FAQ */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="p-4 bg-card border border-border rounded-xl">
            <h4 className="font-semibold text-sm mb-1">How can Converto offer all core tools for free?</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Because all core tools (merge, split, compress, watermark, redact, sign) run in your browser via Web Workers and WebAssembly. We do not pay server compute or bandwidth bills for your files. We only incur costs when you choose cloud AI or GPU OCR, which is funded by Pro subscriptions.
            </p>
          </div>

          <div className="p-4 bg-card border border-border rounded-xl">
            <h4 className="font-semibold text-sm mb-1">Will my free documents ever be watermarked?</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Never. We hate dark patterns as much as you do. Converto will never inject an unexpected watermark or restrict page downloads after you finish your work.
            </p>
          </div>

          <div className="p-4 bg-card border border-border rounded-xl">
            <h4 className="font-semibold text-sm mb-1">What happens to files I upload for AI analysis?</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              AI features require explicit opt-in via an Upload Consent Gate. Document text chunks sent to LLMs are encrypted in transit via TLS 1.3 and strictly ephemeral. We do not train machine learning models on your private documents.
            </p>
          </div>

          <div className="p-4 bg-card border border-border rounded-xl">
            <h4 className="font-semibold text-sm mb-1">Can I cancel my Pro subscription at any time?</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Yes, in one click directly from your billing settings. You retain Pro features until the end of your billing cycle.
            </p>
          </div>
        </div>
      </div>

      {/* Checkout Modal Mock */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowCheckoutModal(false)}
              className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold">Converto {selectedPlan} Checkout</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Secure Stripe-powered checkout simulation.
            </p>
            <div className="p-3 bg-muted rounded-xl mb-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Selected Plan:</span>
                <span className="font-semibold">{selectedPlan} ({billingCycle})</span>
              </div>
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-bold text-emerald-600">
                  {selectedPlan === 'Pro' 
                    ? billingCycle === 'monthly' ? '$10.00 / mo' : '$96.00 / yr'
                    : '$29.00 / seat / mo'
                  }
                </span>
              </div>
            </div>
            <div className="p-3 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground mb-4">
              Stripe checkout element is mounted securely in production via Stripe Elements & Webhooks.
            </div>
            <button
              onClick={() => {
                alert(`Subscribed to Converto ${selectedPlan}! Pro features are now unlocked.`);
                setShowCheckoutModal(false);
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl transition-colors shadow"
            >
              Confirm Subscription
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
