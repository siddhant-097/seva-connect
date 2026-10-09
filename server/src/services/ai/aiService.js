import { GoogleGenAI } from '@google/genai';
import Conversation from '../../models/Conversation.js';
import Scheme from '../../models/Scheme.js';
import { seedSchemes } from '../../seed/schemes.js';
import { isDBConnected } from '../../config/db.js';
import { evaluateEligibility, evaluateMultipleSchemes } from '../eligibility/eligibilityEngine.js';
import env from '../../config/env.js';
import logger from '../../utils/logger.js';

/**
 * SevaConnect AI Service
 *
 * Supported Providers:
 *  1. Ollama (Local open-source models — no API key required)
 *  2. Groq (Open Source models with a free API key)
 *  3. Google Gemini (Free API key)
 *  4. OpenAI (Optional GPT models)
 *  5. Built-in Open-Source Knowledge & Eligibility Engine (Offline fallback)
 */

// In-memory conversation store when MongoDB is offline
const inMemoryConversations = new Map();

// ── System Prompt per SevaConnect Architecture ────────────────────
const SYSTEM_PROMPT = `You are SevaConnect AI — an empathetic, trustworthy, and expert Government Benefits Assistant for Indian citizens.

YOUR MISSION:
- Help citizens discover and understand central and state government schemes (e.g., PM-KISAN, Ayushman Bharat PM-JAY, PMAY-G, NSP Scholarships, PM Ujjwala, PM Mudra, Atal Pension Yojana, PM Surya Ghar, Sukanya Samriddhi, PM Vishwakarma).
- Explain complex government criteria and legal terms in simple, clear, citizen-friendly language.
- Guide citizens on exact required documents, how to obtain them, and step-by-step application routes.
- Fully support English, Hindi (हिन्दी), and Hinglish (mixed Hindi-English in Roman script).

STRICT CITIZEN-SAFETY RULES:
1. NEVER declare a citizen is "definitely eligible" or "guaranteed" to receive benefits.
2. ALWAYS use phrases like "You appear potentially eligible" or "You may qualify based on these criteria".
3. Use ONLY the scheme facts and eligibility rules provided in the context — DO NOT hallucinate nonexistent schemes or conditions.
4. When listing eligibility, clearly separate:
   - ✓ Matched criteria
   - ✗ Criteria not currently met
   - ⚠ Items needing official verification / missing documents
5. ALWAYS cite the official government portal URL so the citizen knows where to verify and apply.
6. End all scheme answers with the disclaimer: "Final eligibility and benefit approval is determined solely by the relevant government authority."`;

// ── Schemes & Profile Context Helpers ─────────────────────────────

async function getAvailableSchemes() {
    if (isDBConnected) {
        try {
            const schemes = await Scheme.find({ isActive: true });
            if (schemes && schemes.length > 0) return schemes;
        } catch {
            // Fall through to seedSchemes
        }
    }
    return seedSchemes.filter((s) => s.isActive !== false);
}

function buildUserProfileContext(user) {
    if (!user || !user.profile) return 'Citizen profile has not been filled yet.';

    const p = user.profile.toObject ? user.profile.toObject() : user.profile;
    const parts = [];

    if (p.age) {
        parts.push(`Age: ${p.age}`);
    } else if (p.dateOfBirth) {
        const dob = new Date(p.dateOfBirth);
        const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        parts.push(`Age: ${age} years`);
    }

    if (p.gender) parts.push(`Gender: ${p.gender}`);
    if (p.state) parts.push(`State: ${p.state}`);
    if (p.district) parts.push(`District: ${p.district}`);
    if (p.residenceType) parts.push(`Residence Type: ${p.residenceType}`);
    if (p.annualFamilyIncome !== undefined && p.annualFamilyIncome !== null) {
        parts.push(`Annual Family Income: ₹${Number(p.annualFamilyIncome).toLocaleString('en-IN')}`);
    }
    if (p.occupation) parts.push(`Occupation: ${p.occupation}`);
    if (p.category) parts.push(`Category: ${p.category}`);
    if (p.isStudent) parts.push('Is a student: Yes');
    if (p.isFarmer) parts.push('Is a farmer: Yes');

    return parts.length > 0 ? parts.join('\n') : 'Profile contains minimal details.';
}

function buildSchemeContext(schemes, max = 8) {
    if (!schemes || schemes.length === 0) return 'No scheme information available.';

    return schemes.slice(0, max).map((s) => {
        const docs = (s.requiredDocuments || [])
            .map((d) => `  - ${d.name}${d.mandatory ? ' (Mandatory)' : ' (Optional)'}: ${d.description || ''}`)
            .join('\n');

        return `=== SCHEME: ${s.name} ===
Category: ${s.category}
Department: ${s.department || 'Government of India'}
State: ${s.state || 'ALL (National)'}
Description: ${s.description}
Benefits: ${s.benefits || 'See scheme overview'}
Application Process: ${s.applicationProcess || 'Apply online or at nearest CSC centre'}
Official Website: ${s.officialUrl || 'N/A'}
Required Documents:
${docs || '  - Identity proof (Aadhaar)'}`;
    }).join('\n\n');
}

function buildEligibilityContext(recommendations) {
    if (!recommendations || recommendations.length === 0) return 'No eligibility recommendations computed.';

    return recommendations.slice(0, 6).map((r) => {
        const matched = r.matchedCriteria?.length > 0 ? `Matched: ${r.matchedCriteria.join(', ')}` : 'None';
        const failed = r.failedCriteria?.length > 0 ? `Failed: ${r.failedCriteria.join(', ')}` : 'None';
        const needs = r.needsVerification?.length > 0 ? `Needs Verification: ${r.needsVerification.join(', ')}` : 'None';
        return `${r.schemeName}: Status=${r.status} (Match Score: ${Math.round(r.score * 100)}%) | ${matched} | ${failed} | ${needs}`;
    }).join('\n');
}

// ── Provider 1: Groq Cloud (Free Open Source Models) ───────────────
async function callGroq({ systemPrompt, messages, temperature = 0.3 }) {
    const apiKey = env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY_NOT_CONFIGURED');

    const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content || m.text,
        })),
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            messages: formattedMessages,
            temperature,
            max_tokens: 1500,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response from Groq API');

    return {
        text,
        model: `Groq (${env.GROQ_MODEL || 'llama-3.3-70b-versatile'}) [Open Source]`,
        provider: 'groq',
    };
}

// ── Provider 2: Ollama Cloud or compatible endpoint ───────────────
async function callOllama({ systemPrompt, messages, temperature = 0.3 }) {
    const baseUrl = env.OLLAMA_BASE_URL.replace(/\/$/, '');
    const endpoint = baseUrl.endsWith('/api') ? `${baseUrl}/chat` : `${baseUrl}/api/chat`;
    const headers = { 'Content-Type': 'application/json' };
    if (env.OLLAMA_API_KEY) headers.Authorization = `Bearer ${env.OLLAMA_API_KEY}`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        signal: AbortSignal.timeout(30000),
        body: JSON.stringify({
            model: env.OLLAMA_MODEL,
            stream: false,
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages.map((m) => ({
                    role: m.role === 'assistant' ? 'assistant' : 'user',
                    content: m.content || m.text,
                })),
            ],
            options: { temperature },
        }),
    });

    if (!response.ok) {
        throw new Error(`Ollama API returned ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const text = data.message?.content;
    if (!text) throw new Error('Empty response from Ollama');

    return {
        text,
        model: `Ollama (${env.OLLAMA_MODEL}) [Open Source]`,
        provider: 'ollama',
    };
}

// ── Provider 3: Google Gemini (Free Tier) ─────────────────────────
async function callGemini({ systemPrompt, messages }) {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');

    const aiClient = new GoogleGenAI({ apiKey });

    const history = messages.slice(0, -1).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content || m.text }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = aiClient.chats.create({
        model: env.GEMINI_MODEL || 'gemini-2.0-flash',
        config: {
            systemInstruction: systemPrompt,
        },
        history,
    });

    const res = await chat.sendMessage({ message: lastMessage.content || lastMessage.text });
    const text = res.text;
    if (!text) throw new Error('Empty response from Gemini');

    return {
        text,
        model: `Google Gemini (${env.GEMINI_MODEL || 'gemini-2.0-flash'})`,
        provider: 'gemini',
    };
}

// ── Provider 4: OpenAI (Optional) ─────────────────────────────────
async function callOpenAI({ systemPrompt, messages }) {
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY_NOT_CONFIGURED');

    const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content || m.text,
        })),
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: formattedMessages,
            temperature: 0.3,
            max_tokens: 1500,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return {
        text: data.choices?.[0]?.message?.content || '',
        model: 'OpenAI (gpt-4o-mini)',
        provider: 'openai',
    };
}

// ── Provider 5: Built-in Open-Source Knowledge & Eligibility Engine ──
// Zero-Key Autonomous Fallback: Ensures the assistant works 100% out of the box!
function generateBuiltInResponse({ message, language, user, schemes, recommendations, intent }) {
    const isHi = language === 'hi';
    const isHinglish = language === 'hinglish';
    const lowerMsg = message.toLowerCase();

    // Find most relevant schemes based on query keywords
    const matchedSchemes = schemes.filter((s) => {
        const sName = s.name.toLowerCase();
        const sDesc = (s.description || '').toLowerCase();
        const sCat = (s.category || '').toLowerCase();

        // Check specific schemes
        if (lowerMsg.includes('kisan') || lowerMsg.includes('farmer') || lowerMsg.includes('kheti')) {
            return sName.includes('kisan');
        }
        if (lowerMsg.includes('ayushman') || lowerMsg.includes('health') || lowerMsg.includes('ilaj') || lowerMsg.includes('swasthya')) {
            return sName.includes('ayushman') || sCat.includes('health');
        }
        if (lowerMsg.includes('awas') || lowerMsg.includes('housing') || lowerMsg.includes('ghar') || lowerMsg.includes('makan')) {
            return sName.includes('awas') || sCat.includes('housing');
        }
        if (lowerMsg.includes('scholarship') || lowerMsg.includes('student') || lowerMsg.includes('padhai') || lowerMsg.includes('shiksha')) {
            return sName.includes('scholarship') || sCat.includes('education');
        }
        if (lowerMsg.includes('ujjwala') || lowerMsg.includes('gas') || lowerMsg.includes('cylinder') || lowerMsg.includes('lpg')) {
            return sName.includes('ujjwala');
        }
        if (lowerMsg.includes('mudra') || lowerMsg.includes('loan') || lowerMsg.includes('business') || lowerMsg.includes('vyapar')) {
            return sName.includes('mudra');
        }
        if (lowerMsg.includes('surya') || lowerMsg.includes('solar') || lowerMsg.includes('bijli') || lowerMsg.includes('electricity')) {
            return sName.includes('surya');
        }
        if (lowerMsg.includes('pension') || lowerMsg.includes('atal') || lowerMsg.includes('vriddha')) {
            return sName.includes('atal') || sName.includes('pension');
        }
        if (lowerMsg.includes('sukanya') || lowerMsg.includes('beti') || lowerMsg.includes('girl')) {
            return sName.includes('sukanya');
        }
        if (lowerMsg.includes('vishwakarma') || lowerMsg.includes('artisan') || lowerMsg.includes('craftsman')) {
            return sName.includes('vishwakarma');
        }

        return sName.includes(lowerMsg) || sDesc.includes(lowerMsg) || sCat.includes(lowerMsg);
    });

    const selected = matchedSchemes.length > 0 ? matchedSchemes : schemes.slice(0, 3);
    const primaryScheme = selected[0];

    // Specific Response Builders
    if (intent === 'DOCUMENT_EXPLANATION' || lowerMsg.includes('document') || lowerMsg.includes('dastavez') || lowerMsg.includes('kagaz')) {
        if (isHi) {
            return `### आवश्यक दस्तावेज़ (Required Documents)\n\n**${primaryScheme.name}** के लिए आवश्यक दस्तावेज़:\n\n${primaryScheme.requiredDocuments.map((d) => `• **${d.name}** (${d.mandatory ? 'अनिवार्य' : 'वैकल्पिक'}): ${d.description}`).join('\n')}\n\n📌 **दस्तावेज़ कैसे प्राप्त करें:**\n• **आधार कार्ड:** नजदीकी आधार सेवा केंद्र या UIDAI पोर्टल से।\n• **आय प्रमाण पत्र (Income Certificate):** अपने तहसील कार्यालय या राज्य के ई-डिस्ट्रिक्ट पोर्टल से।\n• **बैंक खाता:** किसी भी राष्ट्रीयकृत बैंक या डाकघर में जन धन खाता।\n\n🔗 आधिकारिक पोर्टल: [${primaryScheme.name} Official Portal](${primaryScheme.officialUrl})\n\n*(नोट: अंतिम पात्रता एवं दस्तावेज़ सत्यापन संबंधित सरकारी विभाग द्वारा किया जाता है।)*`;
        }
        if (isHinglish) {
            return `### Zaruri Documents (Required Documents)\n\n**${primaryScheme.name}** ke liye yeh documents chahiye honge:\n\n${primaryScheme.requiredDocuments.map((d) => `• **${d.name}** (${d.mandatory ? 'Mandatory' : 'Optional'}): ${d.description}`).join('\n')}\n\n📌 **Kaise banwayen:**\n• **Aadhaar Card:** Nearest Aadhaar Seva Kendra ya uidai.gov.in se update karwayen.\n• **Income Certificate:** Apne Tehsil office ya State e-District portal se apply karein.\n• **Bank Account:** Active Jan Dhan ya Savings account jo Aadhaar se linked ho.\n\n🔗 Official Website: [${primaryScheme.name} Portal](${primaryScheme.officialUrl})\n\n*(Note: Final eligibility aur document verification official authorities karte hain.)*`;
        }
        return `### Required Documents Checklist\n\nFor **${primaryScheme.name}**, you will generally need:\n\n${primaryScheme.requiredDocuments.map((d) => `• **${d.name}** (${d.mandatory ? 'Mandatory' : 'Optional'}): ${d.description}`).join('\n')}\n\n📌 **How to Obtain Them:**\n• **Aadhaar Card:** Visit an Aadhaar Enrollment Center or uidai.gov.in.\n• **Income Certificate:** Issued by your local Tehsildar / Revenue Department or State e-District Portal.\n• **Bank Passbook:** Active Aadhaar-seeded bank account with IFSC code.\n\n🔗 Official Link: [${primaryScheme.name} Portal](${primaryScheme.officialUrl})\n\n*(Disclaimer: Official authorities verify and determine final eligibility.)*`;
    }

    if (intent === 'APPLICATION_GUIDANCE' || lowerMsg.includes('apply') || lowerMsg.includes('process') || lowerMsg.includes('avedan') || lowerMsg.includes('kaise')) {
        if (isHi) {
            return `### आवेदन प्रक्रिया (How to Apply)\n\n**${primaryScheme.name}** के लिए आवेदन करने का तरीका:\n\n1. **पात्रता जांचें:** आवश्यक आयु एवं आय प्रमाण सुनिश्चित करें।\n2. **दस्तावेज़ तैयार रखें:** आधार कार्ड, बैंक पासबुक और संबंधित प्रमाण पत्र।\n3. **आवेदन का माध्यम:**\n   • **ऑनलाइन:** आधिकारिक पोर्टल [${primaryScheme.officialUrl}](${primaryScheme.officialUrl}) पर जाएं।\n   • **ऑफ़लाइन:** नजदीकी सामान्य सेवा केंद्र (CSC) या संबंधित ब्लॉक/तहसील कार्यालय में संपर्क करें।\n4. **स्थिति ट्रैक करें:** आवेदन संख्या (Application ID) संभाल कर रखें।\n\n🔗 आधिकारिक वेबसाइट: [${primaryScheme.name}](${primaryScheme.officialUrl})\n\n*(नोट: हमेशा केवल आधिकारिक सरकारी पोर्टल पर ही आवेदन करें।)*`;
        }
        if (isHinglish) {
            return `### Apply Karne Ka Tarika (Application Process)\n\n**${primaryScheme.name}** mein apply karne ke basic steps:\n\n1. **Eligibility check karein:** Zaruri criteria aur rules confirm karein.\n2. **Documents ready rakhein:** Aadhaar card, Bank details aur Income proof.\n3. **Application Mode:**\n   • **Online:** Official portal [${primaryScheme.officialUrl}](${primaryScheme.officialUrl}) par jaakar apply karein.\n   • **Offline:** Nearest Common Service Centre (CSC) ya Block Development Office jaayein.\n4. **Tracking:** Application reference number note kar lein for status tracking.\n\n🔗 Official Website: [${primaryScheme.name}](${primaryScheme.officialUrl})\n\n*(Note: Kabhi kisi unauthorized agent ko paise na dein; sarkari portals par apply karein.)*`;
        }
        return `### Application Process Guide\n\nHere is how to apply for **${primaryScheme.name}**:\n\n1. **Verify Eligibility:** Confirm you meet age, income, and category criteria.\n2. **Prepare Documents:** Keep Aadhaar, bank account details, and relevant income/caste certificates ready.\n3. **Submit Application:**\n   • **Online Route:** Visit the official portal [${primaryScheme.officialUrl}](${primaryScheme.officialUrl}) and fill out the citizen registration form.\n   • **Offline Route:** Visit your nearest Common Service Centre (CSC) or local administrative office.\n4. **Track Status:** Keep your application reference number for verification updates.\n\n🔗 Official Website: [${primaryScheme.name}](${primaryScheme.officialUrl})\n\n*(Disclaimer: Final eligibility and application processing is conducted by government departments.)*`;
    }

    // General Scheme & Eligibility Breakdown
    if (isHi) {
        const list = selected.map((s) => `### 🏛️ ${s.name}\n• **श्रेणी:** ${s.category}\n• **लाभ:** ${s.benefits}\n• **पात्रता मानदंड:** ${s.description}\n• **आवश्यक दस्तावेज़:** ${(s.requiredDocuments || []).map((d) => d.name).slice(0, 3).join(', ')}\n• **आधिकारिक लिंक:** [यहाँ क्लिक करें](${s.officialUrl})`).join('\n\n');

        return `नमस्ते! आपके प्रश्न के आधार पर हमने सत्यापित सरकारी योजनाओं की जानकारी तैयार की है:\n\n${list}\n\n💡 **अगला कदम:** आप किस विशेष योजना के बारे में विस्तार से जानना चाहते हैं? आप दस्तावेज़ या आवेदन प्रक्रिया के बारे में भी पूछ सकते हैं।\n\n*(नोट: SevaConnect सूचना मार्गदर्शन प्रदान करता है; अंतिम स्वीकृति सरकारी विभाग द्वारा निर्धारित होती है।)*`;
    }

    if (isHinglish) {
        const list = selected.map((s) => `### 🏛️ ${s.name}\n• **Category:** ${s.category}\n• **Benefits:** ${s.benefits}\n• **Eligibility Summary:** ${s.description}\n• **Key Documents:** ${(s.requiredDocuments || []).map((d) => d.name).slice(0, 3).join(', ')}\n• **Official Link:** [Visit Portal](${s.officialUrl})`).join('\n\n');

        return `Namaste! Aapke question ke mutabiq yeh schemes aapke liye relevant ho sakti hain:\n\n${list}\n\n💡 **Next Step:** Kya aap inme se kisi scheme ke documents ya online apply karne ka process detail mein jaanna chahte hain?\n\n*(Disclaimer: SevaConnect guidance provide karta hai; final eligibility government authorities decide karti hain.)*`;
    }

    // Default English
    const list = selected.map((s) => `### 🏛️ ${s.name}\n• **Category:** ${s.category}\n• **Benefits:** ${s.benefits}\n• **Eligibility Overview:** ${s.description}\n• **Key Documents:** ${(s.requiredDocuments || []).map((d) => d.name).slice(0, 3).join(', ')}\n• **Official Source:** [Visit Portal](${s.officialUrl})`).join('\n\n');

    return `Hello! Based on your query, here is verified information from our government schemes directory:\n\n${list}\n\n💡 **Recommended Next Steps:**\n• Ensure your profile details (age, state, income, occupation) are filled in to receive personal eligibility matching.\n• Gather the mandatory documents listed above before beginning your application.\n• Visit the verified official portals to submit your official forms.\n\n*(Disclaimer: Information provided is for citizen guidance. Final eligibility is determined by the relevant government authority.)*`;
}

// ── Intent Detection (Fast Regex Pattern Matching) ────────────────
function detectIntent(message) {
    const lower = message.toLowerCase();

    const patterns = {
        ELIGIBILITY: ['eligible', 'eligibility', 'qualify', 'am i eligible', 'match', 'criteria', 'patra', 'yogya', 'mil sakta'],
        DOCUMENT_EXPLANATION: ['document', 'documents', 'certificate', 'proof', 'paper', 'dastavez', 'kagaz', 'kya chahiye', 'aadhaar', 'passbook'],
        APPLICATION_GUIDANCE: ['apply', 'application', 'how to apply', 'process', 'steps', 'avedan', 'kaise apply', 'form'],
        SCHEME_EXPLANATION: ['explain', 'what is', 'tell me about', 'details', 'kya hai', 'batao', 'samjhao', 'overview'],
        SCHEME_DISCOVERY: ['find', 'search', 'list', 'all schemes', 'benefit', 'benefits', 'yojana', 'sarkari', 'student', 'farmer', 'solar', 'housing'],
    };

    for (const [intent, keywords] of Object.entries(patterns)) {
        if (keywords.some((kw) => lower.includes(kw))) {
            return intent;
        }
    }
    return 'GENERAL_HELP';
}

// ── In-Memory Conversation Management Helper ──────────────────────
function getOrCreateInMemoryConversation(conversationId, language, initialMessage) {
    let conv = inMemoryConversations.get(conversationId);
    if (!conv) {
        const id = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        conv = {
            _id: id,
            title: initialMessage.slice(0, 45),
            language,
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        inMemoryConversations.set(id, conv);
    }
    return conv;
}

// ── Main Process Chat Function ────────────────────────────────────
export async function processChat({ user = null, conversationId = null, message, language = 'en', profile = null }) {
    if (!message || message.trim().length === 0) {
        throw new Error('Message cannot be empty.');
    }

    const cleanMessage = message.trim();
    const intent = detectIntent(cleanMessage);
    let responseContent = '';
    let activeModel = 'SevaConnect Intelligent Engine (Open Source)';
    let activeProvider = 'builtin';
    let recommendations = [];
    let sources = [];

    // 1. Fetch available schemes
    const schemes = await getAvailableSchemes();

    // 2. Synthesize user profile data
    const effectiveProfile = (user && user.profile)
        ? (user.profile.toObject ? user.profile.toObject() : user.profile)
        : (profile || {});

    // 3. Evaluate eligibility deterministically
    if (Object.keys(effectiveProfile).length > 0) {
        try {
            recommendations = evaluateMultipleSchemes(effectiveProfile, schemes);
        } catch (err) {
            logger.warn('Eligibility evaluation error', { error: err.message });
        }
    }

    // 4. Determine relevant schemes for RAG grounding
    const matchedSchemeIds = new Set(
        recommendations
            .filter((r) => r.status !== 'NOT_CURRENTLY_MATCHED')
            .map((r) => String(r.schemeId))
    );

    let relevantSchemes = schemes.filter((s) => matchedSchemeIds.has(String(s._id)));
    if (relevantSchemes.length === 0) {
        // If no profile matches, select based on text relevance
        const lower = cleanMessage.toLowerCase();
        const keywordMatches = schemes.filter((s) =>
            s.name.toLowerCase().includes(lower) ||
            (s.category && s.category.toLowerCase().includes(lower))
        );
        relevantSchemes = keywordMatches.length > 0 ? keywordMatches : schemes.slice(0, 5);
    }

    sources = relevantSchemes.slice(0, 4).map((s) => ({
        title: s.name,
        schemeId: String(s._id),
        sourceType: s.sourceType || 'OFFICIAL',
        url: s.officialUrl || '',
    }));

    // 5. Build RAG Prompt
    const userContext = buildUserProfileContext({ profile: effectiveProfile });
    const schemeContext = buildSchemeContext(relevantSchemes);
    const eligibilityContext = buildEligibilityContext(recommendations);

    const langInstruction = language === 'hi'
        ? 'Respond in clear Hindi (Devanagari script). Preserve official scheme names in English/Hindi.'
        : language === 'hinglish'
            ? 'Respond in friendly Hinglish (mixed Hindi-English in Roman script). Preserve official scheme names.'
            : 'Respond in clear, professional English.';

    const groundedPrompt = `${langInstruction}

CITIZEN PROFILE:
${userContext}

DETERMINISTIC ELIGIBILITY RESULTS (Authoritative — do not contradict):
${eligibilityContext}

VERIFIED SCHEME INFORMATION (Use ONLY these facts):
${schemeContext}

CITIZEN'S QUESTION:
${cleanMessage}`;

    // 6. Execute Provider Strategy: Ollama -> Groq -> Gemini -> OpenAI -> Built-in
    const requestedProvider = env.AI_PROVIDER; // 'auto', 'ollama', 'groq', 'gemini', 'openai', 'builtin'
    let llmSuccess = false;

    if (!llmSuccess && (requestedProvider === 'ollama' || (requestedProvider === 'auto' && (env.OLLAMA_ENABLED || env.OLLAMA_API_KEY)))) {
        try {
            const res = await callOllama({
                systemPrompt: SYSTEM_PROMPT,
                messages: [{ role: 'user', content: groundedPrompt }],
            });
            responseContent = res.text;
            activeModel = res.model;
            activeProvider = res.provider;
            llmSuccess = true;
        } catch (err) {
            logger.warn('Ollama call failed, attempting fallback', { error: err.message });
        }
    }

    // Try Groq (Open Source models with free API key)
    if (!llmSuccess && (requestedProvider === 'groq' || requestedProvider === 'auto') && env.GROQ_API_KEY) {
        try {
            const res = await callGroq({
                systemPrompt: SYSTEM_PROMPT,
                messages: [{ role: 'user', content: groundedPrompt }],
            });
            responseContent = res.text;
            activeModel = res.model;
            activeProvider = res.provider;
            llmSuccess = true;
        } catch (err) {
            logger.warn('Groq call failed, attempting fallback', { error: err.message });
        }
    }

    // Try Gemini (Free API key)
    if (!llmSuccess && (requestedProvider === 'gemini' || requestedProvider === 'auto') && env.GEMINI_API_KEY) {
        try {
            const res = await callGemini({
                systemPrompt: SYSTEM_PROMPT,
                messages: [{ role: 'user', content: groundedPrompt }],
            });
            responseContent = res.text;
            activeModel = res.model;
            activeProvider = res.provider;
            llmSuccess = true;
        } catch (err) {
            logger.warn('Gemini call failed, attempting fallback', { error: err.message });
        }
    }

    // Try OpenAI if configured
    if (!llmSuccess && (requestedProvider === 'openai' || requestedProvider === 'auto') && env.OPENAI_API_KEY) {
        try {
            const res = await callOpenAI({
                systemPrompt: SYSTEM_PROMPT,
                messages: [{ role: 'user', content: groundedPrompt }],
            });
            responseContent = res.text;
            activeModel = res.model;
            activeProvider = res.provider;
            llmSuccess = true;
        } catch (err) {
            logger.warn('OpenAI call failed, attempting fallback', { error: err.message });
        }
    }

    // If no external LLM succeeded or built-in was requested: use Built-in Engine
    if (!llmSuccess) {
        responseContent = generateBuiltInResponse({
            message: cleanMessage,
            language,
            user: { profile: effectiveProfile },
            schemes,
            recommendations,
            intent,
        });
        activeModel = 'SevaConnect Intelligent Engine (Open Source)';
        activeProvider = 'builtin';
    }

    // 7. Persist conversation (MongoDB if connected, otherwise in-memory)
    let activeConversationId = conversationId;
    let messageId = `msg_${Date.now()}`;

    if (isDBConnected) {
        try {
            let conversation = null;
            if (conversationId) {
                conversation = await Conversation.findById(conversationId);
            }
            if (!conversation) {
                conversation = new Conversation({
                    user: user?._id || null,
                    title: cleanMessage.slice(0, 45),
                    language,
                    messages: [],
                });
            }

            conversation.messages.push({ role: 'user', content: cleanMessage });
            conversation.messages.push({
                role: 'assistant',
                content: responseContent,
                intent,
                sources,
            });

            await conversation.save();
            activeConversationId = String(conversation._id);
            const lastMsg = conversation.messages[conversation.messages.length - 1];
            messageId = String(lastMsg._id);
        } catch (err) {
            logger.warn('Failed to save to MongoDB conversation, using memory fallback', { error: err.message });
        }
    }

    // If not saved via MongoDB, save to in-memory store
    if (!activeConversationId || !isDBConnected) {
        const memConv = getOrCreateInMemoryConversation(activeConversationId, language, cleanMessage);
        activeConversationId = memConv._id;
        memConv.messages.push({ role: 'user', content: cleanMessage, createdAt: new Date() });
        memConv.messages.push({
            role: 'assistant',
            content: responseContent,
            intent,
            sources,
            createdAt: new Date(),
        });
        memConv.updatedAt = new Date();
    }

    return {
        conversationId: activeConversationId,
        message: {
            id: messageId,
            role: 'assistant',
            content: responseContent,
        },
        intent,
        model: activeModel,
        provider: activeProvider,
        isOpenSource: activeProvider === 'ollama' || activeProvider === 'groq' || activeProvider === 'builtin',
        recommendations: recommendations
            .filter((r) => r.status !== 'NOT_CURRENTLY_MATCHED')
            .slice(0, 5)
            .map((r) => ({
                schemeId: r.schemeId,
                schemeName: r.schemeName,
                status: r.status,
                score: r.score,
                matchedCriteria: r.matchedCriteria,
                needsVerification: r.needsVerification,
            })),
        sources,
        disclaimer: 'Final eligibility is determined solely by the relevant government authority.',
    };
}

// ── Scheme Explainer ──────────────────────────────────────────────
export async function explainScheme({ schemeId, language = 'en', user = null }) {
    const schemes = await getAvailableSchemes();
    const scheme = schemes.find((s) => String(s._id) === String(schemeId) || s.name.toLowerCase().includes(String(schemeId).toLowerCase()));

    if (!scheme) throw new Error('Scheme not found');

    const prompt = `Explain the following government scheme simply and clearly:
Scheme: ${scheme.name}
Category: ${scheme.category}
Benefits: ${scheme.benefits}
Process: ${scheme.applicationProcess}
Documents: ${(scheme.requiredDocuments || []).map((d) => d.name).join(', ')}`;

    return processChat({
        user,
        message: prompt,
        language,
    });
}

// ── Eligibility Explainer ─────────────────────────────────────────
export async function explainEligibility({ schemeId, user }) {
    const schemes = await getAvailableSchemes();
    const scheme = schemes.find((s) => String(s._id) === String(schemeId));
    if (!scheme) throw new Error('Scheme not found');

    const profile = user?.profile ? (user.profile.toObject ? user.profile.toObject() : user.profile) : {};
    const result = evaluateEligibility(profile, scheme);

    return {
        eligibility: result,
        scheme: { id: scheme._id, name: scheme.name, officialUrl: scheme.officialUrl },
        disclaimer: 'Final eligibility is determined by the relevant government authority.',
    };
}

// ── Document Explainer ────────────────────────────────────────────
export async function explainDocument({ documentName, language = 'en' }) {
    const prompt = `Explain what the document "${documentName}" is, why it is required for government benefits, and how an Indian citizen can obtain it.`;
    return processChat({
        message: prompt,
        language,
    });
}

// ── AI Status & Configuration Metadata ────────────────────────────
export function getAIStatusInfo() {
    const hasOllama = env.OLLAMA_ENABLED || Boolean(env.OLLAMA_API_KEY) || env.AI_PROVIDER === 'ollama';
    const hasGroq = Boolean(env.GROQ_API_KEY);
    const hasGemini = Boolean(env.GEMINI_API_KEY);
    const hasOpenAI = Boolean(env.OPENAI_API_KEY);

    let activeProvider = 'builtin';
    let activeModel = 'SevaConnect Intelligent Engine (Open Source)';
    let isOpenSource = true;

    if (hasOllama && (env.AI_PROVIDER === 'auto' || env.AI_PROVIDER === 'ollama')) {
        activeProvider = 'ollama';
        activeModel = `Ollama (${env.OLLAMA_MODEL}) [Open Source]`;
    } else if (hasGroq && (env.AI_PROVIDER === 'auto' || env.AI_PROVIDER === 'groq')) {
        activeProvider = 'groq';
        activeModel = `Groq (${env.GROQ_MODEL}) [Open Source]`;
        isOpenSource = true;
    } else if (hasGemini && (env.AI_PROVIDER === 'auto' || env.AI_PROVIDER === 'gemini')) {
        activeProvider = 'gemini';
        activeModel = `Google Gemini (${env.GEMINI_MODEL})`;
        isOpenSource = false;
    } else if (hasOpenAI && (env.AI_PROVIDER === 'auto' || env.AI_PROVIDER === 'openai')) {
        activeProvider = 'openai';
        activeModel = 'OpenAI (gpt-4o-mini)';
        isOpenSource = false;
    }

    return {
        activeProvider,
        activeModel,
        isOpenSource,
        status: 'operational',
        freeApiKeyGuides: {
            ollama: {
                name: 'Ollama Cloud (Open Source Models)',
                isFree: true,
                isOpenSource: true,
                keyUrl: 'https://ollama.com/settings/keys',
                envVar: 'OLLAMA_API_KEY',
            },
            groq: {
                name: 'Groq Cloud (Open Source Meta Llama 3.3 70B & 3.1 8B)',
                isFree: true,
                isOpenSource: true,
                keyUrl: 'https://console.groq.com/keys',
                envVar: 'GROQ_API_KEY',
            },
            gemini: {
                name: 'Google Gemini 2.0 Flash',
                isFree: true,
                isOpenSource: false,
                keyUrl: 'https://ai.google.dev',
                envVar: 'GEMINI_API_KEY',
            },
        },
        configuredProviders: {
            ollama: hasOllama,
            groq: hasGroq,
            gemini: hasGemini,
            openai: hasOpenAI,
            builtin: true,
        },
    };
}

// ── Conversation CRUD ─────────────────────────────────────────────
export async function getConversations(userId) {
    if (isDBConnected) {
        try {
            return await Conversation.find({ user: userId })
                .select('title language createdAt updatedAt')
                .sort({ updatedAt: -1 });
        } catch { }
    }
    return Array.from(inMemoryConversations.values()).map((c) => ({
        id: c._id,
        title: c.title,
        language: c.language,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
    }));
}

export async function getConversation(userId, conversationId) {
    if (isDBConnected) {
        try {
            const conv = await Conversation.findOne({ _id: conversationId, user: userId });
            if (conv) return conv;
        } catch { }
    }
    return inMemoryConversations.get(conversationId) || null;
}

export async function deleteConversation(userId, conversationId) {
    if (isDBConnected) {
        try {
            return await Conversation.findOneAndDelete({ _id: conversationId, user: userId });
        } catch { }
    }
    return inMemoryConversations.delete(conversationId);
}
