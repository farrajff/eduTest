import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON body parser for API requests
  app.use(express.json({ limit: '10mb' }));

  // API router to keep everything clean
  const apiRouter = express.Router();

  // Gemini API client initialization helper
  const getGeminiClient = () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured. Please add it in Settings > Secrets.");
    }
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  // Test standard connection endpoint
  apiRouter.get("/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY")
    });
  });

  // AI-powered Islamic Studies Questions Generator
  apiRouter.post("/gemini/generate-questions", async (req, res) => {
    try {
      const { subject, semester = "الفصل الدراسي الثاني", count = 3, difficulty = "متوسط", type = "mcq", types = [], topic = "" } = req.body;
      
      let typesToRequest: string[] = [];
      if (Array.isArray(types) && types.length > 0) {
        typesToRequest = types;
      } else if (typeof type === "string") {
        typesToRequest = [type];
      } else if (Array.isArray(type) && type.length > 0) {
        typesToRequest = type;
      } else {
        typesToRequest = ["mcq"];
      }

      const typesListStr = typesToRequest.join(", ");
      const ai = getGeminiClient();

      // Formulate detailed, culturally and academically precise prompt for Saudi Curriculum Islamic Studies
      const prompt = `أنت خبير ومعلم متخصص في مادة الدراسات الإسلامية للصف الثاني المتوسط في المملكة العربية السعودية ومطابق تماماً لمعايير وزارة التعليم.
قم بإنشاء عدد (${count}) أسئلة فريدة، احترافية، ومثالية لمادة الدراسات الإسلامية فرع (${subject || 'عام'}) لمنهج (${semester}).
مستوى الصعوبة المطلوب: (${difficulty})
الأنواع المطلوبة للأسئلة (يجب صياغتها وتوزيعها بالتساوي بين هذه الأنواع المحددة فقط): (${typesListStr})
ملاحظات وتفاصيل إضافية عن الدرس أو الموضوع المطلوب: (${topic || `مواضع عامة من منهج الصف الثاني المتوسط - ${semester}`}).

شروط هامة جداً لصياغة الأسئلة:
1. اللغة العربية الفصحى السليمة والخالية تماماً من الأخطاء الإملائية أو النحوية، مع ضبط الكلمات الهامة بالشكل إن وجد.
2. تطابق تام مع الثقافة الإسلامية والمصطلحات الشرعية الرسمية المعتمدة في المناهج وبصياغة راقية.
3. التنوع والالتزام بالنوع المختار من قائمة الأنواع المطلوبة (${typesListStr}):
   - في حال كان (mcq): وفر 4 خيارات حقيقية ومتوازنة وتجنب الخيارات المضللة والساخرة، وتفادى عبارة "كل ما سبق" أو "لا شيء مما سبق". حدد الخيار الصحيح بدقة في حقل correctAnswer ليرمز إلى الخيار الفائز تماماً.
   - في حال كان (true_false): يجب أن تكون الإجابة "صح" أو "خطأ" بدقة مطلقة في حقل correctAnswer مع شرح موجز.
   - في حال كان (fill_blank): ضع كلمة مفقودة أساسية في نص السؤال يسهل إكمالها، واجعل correctAnswer الكلمة المتممة الفصحى.
   - في حال كان (matching): املأ حقل matchingPairs بقائمة عناصر Column A و Column B المناظرة لها (مثلاً الركن ومثاله الشرعي).
   - في حال كان (ordering): املأ حقل orderedItems بعبارات ومفاهيم شرعية غير مرتبة (مثل خطوات صلاة الجنازة أو مراتب المسؤولية) بحيث تكون مرتبة ترتيباً صحيحاً من الأول للآخر في قائمة orderedItems والجواب الصحيح correctAnswer بالترتيب الصحيح.
   - في حال كان (essay): نص سؤال مقالي ذكي مثل "ما الحكمة من الحجاب" أو "علل كذا"، مع إجابة نموذجية ممتازة في correctAnswer.
   - في حال كان (verse_hadith): سؤال متعلق بآية من السور المقررة في (${semester}) أو حديث شريف، مثل تبيان مفهوم أو إكمال نقص أو تفسير كلمة. الإجابة الدقيقة في correctAnswer.
4. يجب ملء حقل (unit) باسم وحدة حقيقية من منهج الثاني المتوسط (${semester})، و (lesson) باسم درس حقيقي، و (learningOutcome) بناتج التعلم المتوقع.
5. حدد درجة (points) مناسبة للسؤال (مثلاً 2 للـ mcq، و 1 للـ true_false، و 3 أو 4 للـ matching والأسئلة الدقيقة).`;

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "A list of generated Islamic Studies questions matching the strict criteria.",
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "A unique short id generated for the question" },
                subject: { type: Type.STRING, description: "One of: 'توحيد' or 'تفسير' or 'حديث' or 'فقه'" },
                unit: { type: Type.STRING, description: "The unit name in Arabic" },
                lesson: { type: Type.STRING, description: "The lesson name in Arabic" },
                learningOutcome: { type: Type.STRING, description: "The learning outcome in Arabic" },
                type: { type: Type.STRING, description: `The question type, must match exactly one of requested types: ${typesListStr}` },
                difficulty: { type: Type.STRING, description: "The difficulty level, must match: سهل, متوسط, صعب" },
                points: { type: Type.INTEGER, description: "Question grade points, typically 1 to 4" },
                text: { type: Type.STRING, description: "The complete question text" },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "For MCQ only. Provide exactly 4 potential options."
                },
                correctAnswer: { type: Type.STRING, description: "The clear correct answer string. For mcq, must be exactly one of the options elements. For true_false, must be 'صح' or 'خطأ'." },
                matchingPairs: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      left: { type: Type.STRING, description: "The right option key A" },
                      right: { type: Type.STRING, description: "The matching option value B" }
                    },
                    required: ["id", "left", "right"]
                  },
                  description: "For matching type only."
                },
                orderedItems: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "For ordering type only. Sub-elements to be ordered in correct default sequence."
                }
              },
              required: ["id", "subject", "unit", "lesson", "learningOutcome", "type", "difficulty", "points", "text", "correctAnswer"]
            }
          }
        }
      });

      const responseText = response.text || "[]";
      let questions = JSON.parse(responseText);

      // Post-process to guarantee IDs and correct subject format etc.
      questions = questions.map((q: any, idx: number) => {
        const uniqueId = q.id || `ai-gen-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`;
        const resolvedType = (q.type && typesToRequest.includes(q.type)) ? q.type : typesToRequest[idx % typesToRequest.length];
        return {
          ...q,
          id: uniqueId,
          subject: (q.subject && ['توحيد', 'تفسير', 'حديث', 'فقه'].includes(q.subject)) ? q.subject : (subject || 'توحيد'),
          semester,
          type: resolvedType,
          difficulty: q.difficulty || difficulty,
          points: Number(q.points) || (resolvedType === "true_false" ? 1 : 2)
        };
      });

      res.json({ success: true, questions });
    } catch (error: any) {
      console.error("Gemini Generation Error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "حدث خطأ غير متوقع أثناء توليد الأسئلة بالذكاء الاصطناعي."
      });
    }
  });

  // Mount API endpoints under /api
  app.use("/api", apiRouter);

  // Vite development vs production asset serving setup
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode. Serving static files...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server successfully running on host 0.0.0.0, port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server boot up error: ", err);
});
