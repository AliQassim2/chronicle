import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const MODELS = [
  "gemini-3.1-flash-lite",  // 500 RPD (free)
  "gemini-3.5-flash",       // 20 RPD (free)
];

const system = `أنت مساعد ذكي مرن يمتلك "وضعين" للتعامل مع الرسائل، وذلك لأن مستخدميك هم من المبرمجين والمطورين:

[1] الوضع الخاص (الأنماط الفكاهية العراقية):
إذا بدأت رسالة المستخدم بأحد الوسوم التالية حصراً [بحث]، [تحقيق]، [إثبات]، قم بتفعيل الأسلوب الفكاهي العراقي فوراً حسب القواعد التالية:
- وسم [بحث]: صغ السالفة على شكل "تقرير أكاديمي أو دراسة أنثروبولوجية فخمة" (يروي المكتشف، تشير الدراسات)، واختم بـ "توصيات بحثية" مضحكة.
- وسم [تحقيق]: صغ السالفة على شكل "سيناريو جريمة بوليسية أو تحقيق مخابراتي غامض" (رصد تحركات مشبوهة، الأدلة الجنائية، ساعة الصفر)، واختم بـ "قرار المحكمة".
- وسم [إثبات]: صغ السالفة على شكل "نظرية علمية أو معادلة فيزيائية معقدة فشلت مختبرياً" (معامل الطين، انكسار الضوء)، واختم بـ "النتيجة الرياضية النهائية" (مثال: الناتج = صفر أو الديلكو محترك).
* القواعد العامة للوضع الفكاهي: ادمج الفصحى الفخمة بالعامية العراقية القوية (انصدموا، الجامة وصخة، الظهرية، قشمر، تفصيخ) مع استخدام إيموجيات.

[2] الوضع الطبيعي (الافتراضي بدون وسم):
إذا أرسل المستخدم رسالة طبيعية، أو كوداً برمجياً، أو استفساراً تقنياً، أو برومبت خاصاً به دون كتابة أي وسم من الأوسمة الثلاثة أعلاه:
- التغ الصياغة الفكاهية والأسلوب العراقي تماماً.
- تعامل مع الرسالة كذكاء اصطناعي طبيعي، احترافي، ومساعد تقني للمبرمجين.
- قم بتحليل كلام المستخدم بدقة، وأجب عن سؤاله، أو أصلح كوده البرمجي، أو نفذ البرومبت الخاص به بالشكل الذي يتوقعه مبرمج محترف، وبنفس لغة رسالته (عربي أو إنجليزي).

هام جداً: استخدم وسوم HTML للتنسيق بدلاً من Markdown:
- <strong>نص مهم</strong> بدلاً من **نص مهم**
- <em>نص مائل</em> بدلاً من *نص مائل*
- <h3>العنوان</h3> للعناوين
- <ul><li>عنصر</li></ul> للقوائم غير المرقمة
- <ol><li>عنصر</li></ol> للقوائم المرقمة
- <br> للسطور الجديدة داخل النص
- <code>كود</code> للكود البرمجي
- <pre><code>للأكواد الطويلة</code></pre>
- لا تستخدم أبداً علامات markdown مثل ** * # \`
- الرد يكون بنفس لغة المستخدم (عربي أو إنجليزي)`;

export async function POST(req: Request) {
  const { messages, model: requestedModel } = await req.json();

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Messages array is required." }, { status: 400 });
  }

  const modelName = requestedModel && MODELS.includes(requestedModel) ? requestedModel : MODELS[0];
  const chatHistory = messages.slice(0, -1).map((m: any) => ({ role: m.role, parts: [{ text: m.text }] }));
  const lastMsg = messages[messages.length - 1]?.text || "";

  try {
    const result = await ai.models.generateContentStream({
      model: modelName,
      contents: [...chatHistory, { role: "user", parts: [{ text: lastMsg }] }],
      config: { systemInstruction: system },
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async pull(controller) {
        try {
          for await (const chunk of result) {
            const text = chunk.text;
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Model": modelName,
      },
    });
  } catch (err: unknown) {
    const statusCode = err && typeof err === "object" && "status" in err
      ? (err as any).status
      : (err && typeof err === "object" && "response" in err
        ? (err as any).response?.status
        : null);

    if (statusCode === 429) {
      return Response.json({
        error:
          `⚠️ نموذج ${modelName} استنفد حدّه اليومي (RPD). اختر نموذج آخر.<br><br>` +
          `⚠️ ${modelName} rate limit exceeded (RPD). Select another model.`,
      }, { status: 429, headers: { "Content-Type": "application/json" } });
    }

    if (statusCode === 404) {
      return Response.json({
        error:
          `⚠️ ${modelName} هذا الموديل غير موجود أو ملغي. اختر نموذج آخر.<br><br>` +
          `⚠️ ${modelName} model ID not found or deprecated. Select another model.`,
      }, { status: 404, headers: { "Content-Type": "application/json" } });
    }

    return Response.json({
      error:
        `⚠️ ${modelName} فشل (${statusCode || "unknown error"}). اختر نموذج آخر.<br><br>` +
        `⚠️ ${modelName} failed (${statusCode || "unknown error"}). Select another model.`,
    }, { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
