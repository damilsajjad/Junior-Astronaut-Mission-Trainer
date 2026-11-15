import { useRef, useState } from 'react';
import { Bot, Camera, MessageSquare, Send, Sparkles, Upload } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

export function RobotAvatarSvg({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="14" y="16" width="36" height="28" rx="12" fill="#DCE9F7" stroke="#37D6F4" strokeWidth="2.5" />
      <line x1="32" y1="7" x2="32" y2="16" stroke="#37D6F4" strokeWidth="2.5" />
      <circle cx="32" cy="6" r="3.5" fill="#37D6F4" />
      <rect x="20" y="23" width="24" height="14" rx="6" fill="#0B192C" />
      <circle cx="27" cy="30" r="2.6" fill="#37D6F4" />
      <circle cx="37" cy="30" r="2.6" fill="#37D6F4" />
      <path d="M28 34.5 Q32 37 36 34.5" stroke="#37D6F4" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <rect x="20" y="46" width="24" height="12" rx="6" fill="#B8CEE3" />
      <circle cx="32" cy="52" r="3" fill="#37D6F4" />
    </svg>
  );
}

export default function CapcomGuidePanel({ compact = false }: { compact?: boolean }) {
  const capcomMessage = useGameStore((s) => s.capcomMessage);
  const chatMessages = useGameStore((s) => s.chatMessages);
  const isChatLoading = useGameStore((s) => s.isChatLoading);
  const sendChatMessage = useGameStore((s) => s.sendChatMessage);
  const destination = useGameStore((s) => s.destination);
  const sol = useGameStore((s) => s.sol);

  const [tab, setTab] = useState<'guide' | 'chat' | 'scan'>('guide');
  const [input, setInput] = useState('');
  const [scanImage, setScanImage] = useState<{ dataUrl: string; mimeType: string; name: string } | null>(null);
  const [scanPrompt, setScanPrompt] = useState('');
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input;
    setInput('');
    await sendChatMessage(text, false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanError(null);
    setScanResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setScanImage({
          dataUrl: reader.result,
          mimeType: file.type || 'image/jpeg',
          name: file.name,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const runImageAnalysis = async () => {
    if (!scanImage) return;
    setScanning(true);
    setScanError(null);
    setScanResult(null);
    try {
      const resp = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: scanImage.dataUrl,
          mimeType: scanImage.mimeType,
          prompt: scanPrompt,
          gameContext: { destination, sol },
        }),
      });
      const data = (await resp.json()) as { analysis?: string; error?: string };
      if (!resp.ok || data.error) {
        setScanError(data.error || 'Could not analyze image.');
      } else {
        setScanResult(data.analysis || 'Scan complete.');
      }
    } catch {
      setScanError('Network error while contacting Science Scanner.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[#0D1B2A]/95 border border-white/15 p-3.5 flex flex-col gap-2.5 shadow-xl">
      {/* Header + Mode Switch */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-extrabold tracking-wider uppercase text-[#F4F7FB]">
          Mission Guide
        </span>
        <div className="flex items-center gap-1 bg-[#07111F] p-0.5 rounded-lg border border-white/10">
          <button
            onClick={() => setTab('guide')}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
              tab === 'guide' ? 'bg-[#152A3E] text-[#37D6F4]' : 'text-[#AAB8C8] hover:text-white'
            }`}
          >
            <Bot className="w-3 h-3" />
            <span>Tip</span>
          </button>
          <button
            onClick={() => setTab('chat')}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
              tab === 'chat' ? 'bg-[#152A3E] text-[#37D6F4]' : 'text-[#AAB8C8] hover:text-white'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Ask AI</span>
          </button>
          <button
            onClick={() => setTab('scan')}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
              tab === 'scan' ? 'bg-[#152A3E] text-[#37D6F4]' : 'text-[#AAB8C8] hover:text-white'
            }`}
          >
            <Camera className="w-3 h-3" />
            <span>Scan</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Rule-Based CAPCOM Companion Tip */}
      {tab === 'guide' && (
        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5">
            <RobotAvatarSvg className="w-12 h-12 shrink-0" />
            <div className="rounded-xl bg-[#DCE9F7] text-[#0D1B2A] px-3 py-2 text-xs font-semibold leading-snug shadow-sm">
              {capcomMessage}
            </div>
          </div>
          {!compact && (
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  setTab('chat');
                  sendChatMessage('What should I prioritize right now?', true);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#152A3E] border border-[#37D6F4]/30 text-[11px] font-semibold text-[#37D6F4] hover:bg-[#1b3650] cursor-pointer"
              >
                Quick Hint
              </button>
              <button
                onClick={() => setTab('scan')}
                className="px-2.5 py-1 rounded-lg bg-[#152A3E] border border-white/15 text-[11px] font-semibold text-[#F4F7FB] hover:border-[#37D6F4] cursor-pointer"
              >
                Analyze Photo
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Multi-Turn Gemini Chat */}
      {tab === 'chat' && (
        <div className="flex flex-col gap-2">
          <div className="h-36 overflow-y-auto space-y-2 pr-1 rounded-xl bg-[#07111F] border border-white/10 p-2.5">
            {chatMessages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-xl px-2.5 py-1.5 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#37D6F4]/20 border border-[#37D6F4]/40 text-[#F4F7FB]'
                      : 'bg-[#152A3E] border border-white/10 text-[#E2E8F0]'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="text-[11px] text-[#37D6F4] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                <span>CAPCOM is thinking...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-1.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask CAPCOM about O₂, CO₂, or plans..."
              className="flex-1 min-w-0 rounded-lg bg-[#07111F] border border-white/15 px-2.5 py-1.5 text-xs text-white placeholder:text-[#AAB8C8]/60 focus:outline-none focus:border-[#37D6F4]"
            />
            <button
              type="submit"
              disabled={isChatLoading || !input.trim()}
              aria-label="Send message"
              className="h-8 w-8 rounded-lg bg-[#37D6F4] text-[#07111F] flex items-center justify-center hover:bg-[#5ce1f8] disabled:opacity-40 cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Gemini Photo & Diagram Analyzer */}
      {tab === 'scan' && (
        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-2 px-3 rounded-xl bg-[#07111F] border border-dashed border-[#37D6F4]/50 text-xs font-semibold text-[#37D6F4] hover:bg-[#152A3E] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{scanImage ? scanImage.name : 'Upload Space Photo or Sketch'}</span>
          </button>

          {scanImage && (
            <div className="space-y-2">
              <img
                src={scanImage.dataUrl}
                alt="Uploaded science scan preview"
                className="w-full h-24 object-cover rounded-xl border border-white/15"
              />
              <input
                type="text"
                value={scanPrompt}
                onChange={(e) => setScanPrompt(e.target.value)}
                placeholder="Optional question (e.g. What spacecraft part is this?)"
                className="w-full rounded-lg bg-[#07111F] border border-white/15 px-2.5 py-1.5 text-xs text-white placeholder:text-[#AAB8C8]/60 focus:outline-none focus:border-[#37D6F4]"
              />
              <button
                onClick={runImageAnalysis}
                disabled={scanning}
                className="w-full py-1.5 rounded-lg bg-[#FF7A3D] hover:bg-[#ff8f59] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {scanning ? 'Scanning Image...' : 'Analyze with CAPCOM Scanner'}
              </button>
            </div>
          )}

          {scanError && (
            <p className="text-[11px] text-[#FF5B68] bg-[#FF5B68]/10 border border-[#FF5B68]/30 rounded-lg p-2">
              {scanError}
            </p>
          )}
          {scanResult && (
            <div className="max-h-28 overflow-y-auto text-xs text-[#F4F7FB] bg-[#07111F] border border-[#37D67A]/40 rounded-lg p-2.5 leading-relaxed">
              {scanResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
