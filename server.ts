import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface ChatHistoryEntry {
  role: 'user' | 'model';
  text: string;
}

interface GameContextPayload {
  destination?: string;
  sol?: number;
  difficulty?: string;
  resources?: Record<string, number>;
  activeEmergency?: {
    title?: string;
    problem?: string;
    selectedPlan?: string | null;
  } | null;
}

function buildRuleBasedFallback(message: string, ctx?: GameContextPayload): string {
  const q = message.toLowerCase();
  const dest = ctx?.destination === 'moon' ? 'the Moon' : 'Mars';
  if (ctx?.activeEmergency?.title) {
    if (q.includes('plan') || q.includes('help') || q.includes('what')) {
      return `Cadet, we have an active alert: ${ctx.activeEmergency.title}. ${ctx.activeEmergency.problem || ''} Open the Repair Manual (press M) or choose Plan A, B, or C in the alert panel!`;
    }
  }
  if (q.includes('co2') || q.includes('scrubber') || q.includes('air')) {
    return `Great question! Our CO₂ Scrubber cleans carbon dioxide out of cabin air so we can breathe safely. Remember: it removes CO₂—it does NOT turn CO₂ into oxygen. The Water Electrolysis Oxygen Generator makes fresh oxygen from water using electricity!`;
  }
  if (q.includes('oxygen') || q.includes('o2') || q.includes('water')) {
    return `The Oxygen Generator splits water using electricity (electrolysis) to produce breathable oxygen. Keep an eye on Battery Reserve and Water Reserve in Power & Life Support!`;
  }
  if (q.includes('radiation') || q.includes('flare') || q.includes('shelter') || q.includes('block')) {
    return `Water-barrier blocks and shielding panels are awesome against solar radiation! Move the crew and reinforce the Radiation Shelter on the left side of the module when a Solar Flare alert appears.`;
  }
  if (q.includes('power') || q.includes('battery') || q.includes('solar') || q.includes('dust')) {
    return `On ${dest}, solar power feeds our batteries. If power runs low, pause the Greenhouse first so critical Oxygen and CO₂ Scrubber systems stay online!`;
  }
  return `Copy that, Cadet! Right now you are on Sol ${ctx?.sol ?? 1} on ${dest}. Keep Oxygen, Water, Battery, and Food balanced, and press E near any workstation inside the module to inspect or repair it.`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, hasApiKey: Boolean(getGeminiClient()) });
  });

  app.post('/api/chat', async (req, res) => {
    const { history = [], message = '', gameContext, mode = 'standard' } = req.body as {
      history?: ChatHistoryEntry[];
      message?: string;
      gameContext?: GameContextPayload;
      mode?: 'standard' | 'quick-hint';
    };

    if (!message.trim()) {
      res.status(400).json({ error: 'Message cannot be empty.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.json({
        reply: buildRuleBasedFallback(message, gameContext),
        source: 'capcom-local',
      });
      return;
    }

    const model = mode === 'quick-hint' ? 'gemini-3.1-flash-lite' : 'gemini-4-hydrogen';
    const systemInstruction = `You are CAPCOM, the friendly Junior Flight Director robot companion in the child-friendly STEM space survival game "ORBITAL SURVIVAL: Astro-Cadet Mission Control".
Target audience: children ages 7-12 and young learners. Keep answers short (2-4 clear sentences), encouraging, accurate, and easy to read.
Scientific rules you MUST follow:
1. Water Electrolysis Oxygen Generator uses electricity to split water into oxygen and hydrogen.
2. CO2 Scrubber removes carbon dioxide from cabin air—NEVER claim a CO2 scrubber converts CO2 into oxygen.
3. Water-barrier blocks and radiation shelters absorb harmful solar flare particles.
4. Power priority: keep Oxygen Generator & CO2 Scrubber running before optional Greenhouse lights when solar generation drops.
5. Never invent fake NASA specifications; if referring to game percentages, call them mission game levels.

Current Mission Context:
- Destination: ${gameContext?.destination ?? 'mars'}
- Mission Day (Sol): ${gameContext?.sol ?? 1}
- Difficulty: ${gameContext?.difficulty ?? 'cadet'}
- Resources: ${JSON.stringify(gameContext?.resources ?? {})}
- Active Emergency: ${gameContext?.activeEmergency ? `${gameContext.activeEmergency.title} (${gameContext.activeEmergency.problem})` : 'None'}`;

    try {
      const formattedHistory = history.slice(-12).map((entry) => ({
        role: entry.role,
        parts: [{ text: entry.text }],
      }));

      const chat = ai.chats.create({
        model,
        config: { systemInstruction },
        history: formattedHistory,
      });

      const response = await chat.sendMessage({ message });
      const replyText = response.text?.trim() || buildRuleBasedFallback(message, gameContext);
      res.json({ reply: replyText, source: model });
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Unknown Gemini API error';
      console.error('Gemini /api/chat error:', errMessage);
      res.json({
        reply: buildRuleBasedFallback(message, gameContext),
        source: 'capcom-local-fallback',
        warning: errMessage,
      });
    }
  });

  app.post('/api/analyze-image', async (req, res) => {
    const { imageBase64, mimeType, prompt, gameContext } = req.body as {
      imageBase64?: string;
      mimeType?: string;
      prompt?: string;
      gameContext?: GameContextPayload;
    };

    if (!imageBase64 || !mimeType) {
      res.status(400).json({ error: 'Please select an image file to analyze.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini image scanner is offline because no GEMINI_API_KEY is configured in environment secrets.',
      });
      return;
    }

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const userPrompt =
      prompt?.trim() ||
      'Inspect this photo or diagram as CAPCOM Junior Flight Director for an Astro-Cadet on the Moon or Mars. Explain what you see in 3-4 kid-friendly sentences and connect it to spacecraft engineering, life support, power, or radiation safety.';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            {
              text: `${userPrompt}\n\nMission Context: Destination=${gameContext?.destination ?? 'mars'}, Sol=${gameContext?.sol ?? 1}. Keep language child-friendly (ages 7-12) and scientifically accurate.`,
            },
          ],
        },
        config: {
          systemInstruction:
            'You are CAPCOM Science Scanner in ORBITAL SURVIVAL. Analyze uploaded photos, space sketches, circuits, or habitat screenshots clearly for young learners in 3-5 concise sentences. Never describe a CO2 scrubber as making oxygen.',
        },
      });

      res.json({
        analysis: response.text?.trim() || 'Scan complete! No recognizable spacecraft anomalies detected.',
        model: 'gemini-4-hydrogen',
      });
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Failed to analyze image';
      console.error('Gemini /api/analyze-image error:', errMessage);
      res.status(500).json({ error: errMessage });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ORBITAL SURVIVAL server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
