'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import ChatMessage from '@/components/ChatMessage';
import {
  coach,
  chat,
  settings as settingsApi,
  type CoachBrief,
  type Conversation,
  type Message,
} from '@/lib/api';

// ─── Pre-loaded Assignment Data ──────────────────────────────────────────────

const ISABELLA_ASSIGNMENTS = [
  {
    subject_code: 'MKT105',
    assessment_name: 'SWOT Analysis Report',
    word_limit: 750,
    weighting: '30%',
    brief_content: `ASSESSMENT 1 BRIEF
Subject Code and Title: MKT105 Marketing in the Digital Era
Assessment Task: SWOT Analysis Report
Individual/Group: Individual
Length: 750 words
Weighting: 30%
Total Marks: 100 marks

Learning Outcomes:
c) Explain environmental factors impacting the behaviour of customers and businesses.
e) Apply critical thinking, research, planning and scheduling, and influence and persuasive skills within the business context.

Assessment Task:
Develop a SWOT analysis report that synthesises internal and external factors to inform strategic insights for a small to medium-sized enterprise (SME).

Context:
You will take on the role of a marketing consultant and analyse your chosen SME's marketing environment. Your task is to identify and explain the internal factors (strengths and weaknesses) and external factors (opportunities and threats) that may influence the business.

Instructions:

Step 1. Choose a small to medium-sized (SME) business
- It should have fewer than 200 employees. Avoid large companies, chain stores or franchises.
- Select a business-to-consumer (B2C) business.
- Ensure the business is based in Australia and currently operating.
- Select a business you are familiar with or interested in, such as a local cafe, boutique store, or small online retailer.
- Confirm with your Learning Facilitator before starting.

Step 2. Introduction
Briefly introduce the report purpose and selected business by summarising its marketing mix (4Ps) and the industry it operates in. Use IBIS World reports to identify and describe the industry context.

Step 3. SWOT Analysis
Develop a SWOT analysis of your selected business. Include three (3) factors for each:
I. Strengths (what the business does well in the marketing mix)
II. Weaknesses (areas where the marketing mix needs improvement)
III. Opportunities (external trends or advantages the business could leverage)
IV. Threats (external risks to the business's success)

Your strengths and weaknesses should be grounded in direct observations or research about your business's marketing mix. Critically analyse the business website and social media profiles.

Your opportunities and threats should be based on evidence from IBISWorld (industry-level trends) and Think With Google (consumer behaviour/marketing trends). You can also use academic sources from Module Resources. Choose trends that directly influence your SME. These trends should be referenced.

Present SWOT in a simple 2x2 matrix format. You may include screenshots from the business website.

Step 4. Conclusion
Summarise your findings in a brief conclusion with a clear statement of overall findings.

Step 5. References
At minimum reference: IBISWorld, Think With Google, and one academic reference. Use latest APA edition guidelines.

Tips and Advice:
- Read the assessment rubric carefully.
- All work must be word-processed, spell-checked, grammatically acceptable, and professional.
- Report must be written in THIRD PERSON perspective. The use of 'I, we, my, our' are NOT acceptable.
- Submit in MS Word format.
- File naming: SubjectCode_Surname_FirstNameInitial_AssessmentNumber (e.g., MKT105_Jones_S_Assessment_1.docx)

Use of Generative AI:
- Must be in line with Torrens Gen AI guidelines.
- Must clearly cite and reference any Generative AI tools used.
- Must include an appendix containing any AI prompts and responses used, plus a Statement of Acknowledgement.`,

    rubric_content: `ASSESSMENT RUBRIC

INTRODUCTION (10%)
High Distinction (85-100%): An excellent report purpose established. Comprehensive background information on the chosen business and an excellent overview of the marketing mix and industry context.
Distinction (75-84%): A very good report purpose established. Detailed background information on the chosen business and a very good overview of the marketing mix and industry context.
Credit (65-74%): A good report purpose established. Some good background information on the chosen business and marketing mix with some industry context established.
Pass (50-64%): A satisfactory report purpose established. Limited background information on the chosen business and marketing mix. Needs more detail and a clearer industry context.
Fail (0-49%): Chosen business does not meet requirements. No clear report purpose. Little or no background information or overview of marketing mix or industry context.

SWOT ANALYSIS — STRENGTHS AND WEAKNESSES (30%)
High Distinction: Strengths and weaknesses are highly specific, accurate, and clearly based on detailed analysis of the SME's marketing mix. Demonstrates excellent critical thinking with strong evidence from the business's website, social media, or customer experience.
Distinction: Strengths and weaknesses are clearly explained, relevant, and supported with good evidence from the SME's marketing mix. Demonstrates solid analytical thinking and evidence from the business's website, social media, or customer experience.
Credit: Strengths and weaknesses are identified with adequate relevance and some evidence from the business's website, social media, or customer experience. Some analysis is evident, though explanations may lack depth or contain minor generalisations.
Pass: Basic strengths and weaknesses identified, but analysis is limited or requires further explanation. Evidence from the marketing mix is minimal or partially relevant.
Fail: Strengths and weaknesses missing, inaccurate, vague, or not linked to the marketing mix. Little to no analysis or use of evidence. Factors may be generic or unrelated to the chosen SME.

SWOT ANALYSIS — OPPORTUNITIES AND THREATS (40%)
High Distinction: Opportunities and threats are highly relevant, clearly linked to credible industry/consumer trends and show strong insight into how external factors affect the SME. Explanations demonstrate excellent strategic understanding and use of well-interpreted evidence.
Distinction: Opportunities and threats are relevant and linked to industry/consumer trends and show insight into how external factors affect the SME. Explanations demonstrate very good strategic understanding and use of well-interpreted evidence.
Credit: Opportunities and threats are appropriate and supported with some links to industry/consumer trends. Explanations show reasonable understanding but may lack depth or consistency.
Pass: Basic opportunities and threats are identified but are general, loosely supported, or not clearly connected to industry or consumer trends. Limited explanation of their relevance.
Fail: Opportunities and threats are missing, incorrect, irrelevant, or unsupported. Little to no reference to external trends. Minimal insight into the SME's external environment.

EFFECTIVE COMMUNICATION — WRITTEN (10%)
High Distinction: Communicates persuasively, coherently, concisely and creatively. Meaning is always easy to follow. Spelling, grammar and punctuation are free from errors. Headings and subheadings consistent with submission guidelines.
Distinction: Communicates coherently and concisely. Meaning is easy to follow. Few errors in spelling, grammar and/or punctuation. Headings consistent with submission guidelines.
Credit: Communicates concisely. Meaning is mostly easy to follow. Minor errors in spelling, grammar and/or punctuation. Mostly consistent with submission guidelines.
Pass: Communicates in a readable manner. Meaning is sometimes difficult to follow. Errors present. Limited headings and some submission guidelines require adjustments.
Fail: Confusing manner, not clearly organised. Numerous errors. No headings, submission guidelines not followed.

REFERENCING (10%)
High Distinction: Uses most recent APA with no errors. No mistakes in in-text citations and reference list. Provides more than minimum required references.
Distinction: Uses most recent APA with no errors. Very few mistakes. Provides more than minimum required references.
Credit: Uses most recent APA with occasional errors. Minor mistakes. Provides minimum required references.
Pass: Uses most recent APA but frequent errors. Provides minimum required references, in-text referencing is inconsistent.
Fail: Referencing does not resemble APA or is omitted. Does not provide minimum required references.`,

    draft: `SWOT Analysis Report

Introduction:
This analysis report evaluates the internal and external factors that influence and affect Sushi Taro. Using a SWOT analysis to recognise strengths, weaknesses, opportunities, and threats present in the business.

Sushi Taro is a local restaurant located in Artarmon. Sushi Taro is best known for its authentic Japanese dishes such as fresh sashimi/sushi, noodles, poke bowls, and bento boxes. It sells kid friendly meals and vegan options. While having a wide range of authentic dishes they also provide a wide range of drinks from traditional saki, beer and fizzy drinks, to general drinks you can find in local supermarkets.

For this business they sell affordable casual dining. Prices do vary based on what you do order. Fresh sashimi may be slightly more expensive due to its premium quality compared to a noodle or chicken dish. All food comes in considerable sizes and offers affordable pricing for premium quality.

Sushi Taro is located in the heart of Artarmon right next to the train station in a little court surrounded by greenery giving it a warm ambiance. Sushi Taro offers inside and outside dining while also allowing takeaway orders. To help with its high demand you can find it on delivery apps such as Uber Eats and Door Dash. With a wide verity of ways to access their food it allows people to easily get a taste of their authentic Japanese food.

Sushi Taros main way of attracting customers is due to its convenient location. By being near a train station and in the middle of Artarmon it catches people's eye easily. Its welcoming atmosphere and friendly staff keep people coming back. Aswell as deals like a $3 appetizer with any drink ordered being promoted regularly on social media and the website.

This Business, Sushi Taro functions within the Australian restaurant and takeaway food services industry. The Takeaway Food Services in Australia is a high demand growing industry, especially with the rapid rise of the cost-of-living crisis. Consumers are trading going out to fine dining restaurants for cheaper more affordable fast-food restaurants fuelling revenue growth. As Australians we are spending more on take-away food then actually going out. (IBIS World, 2024) Key trends that are rising in this industry is the demand for healthy eating while keeping it affordable. The dark kitchen model caters for the rapid rising demand for delivery and takeaway services. As the online food demand increases, dark kitchens allow for brands to meet the consumers needs without the substantial cost associated with dine in restaurants. (IBIS World, 2024)

SWOT:

Strengths:
- Business advantages
- Compare other business, how are you better
- Any unique services
- Clients thoughts

Weaknesses:
- Services negative impact
- Re-evaluated parts
- Prices compared

Opportunity:
- Opportunities business consider
- New trends
- Gaps in the business
- Tech strategies

Threats:
- External issues
- Due to evolving tech how does social media be threatened
- More competitors emerging
- Political/environmental factors

Conclusion:`,
  },
  {
    subject_code: 'MGMT6002',
    assessment_name: 'Assessment 1',
    word_limit: null,
    weighting: null,
    brief_content: `MGMT6002 Assessment 1

Note: The full brief for this assessment has not been provided yet. Isabella can paste the brief content here when available, or start a coaching session to discuss what she knows about the requirements so far.`,
    rubric_content: '',
    draft: '',
  },
];

// ─── Coaching Session ────────────────────────────────────────────────────────

function CoachingSession({
  brief,
  initialConversation,
  initialMessages,
  draftToReview,
  onBack,
}: {
  brief: CoachBrief;
  initialConversation: Conversation;
  initialMessages: Message[];
  draftToReview: string;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [showBrief, setShowBrief] = useState(false);
  const [showDraft, setShowDraft] = useState(false);
  const [draftSent, setDraftSent] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamContent]);

  function sendMessage(content: string) {
    if (!content.trim() || streaming) return;

    setInput('');

    const userMsg: Message = {
      id: Date.now(),
      conversation_id: initialConversation.id,
      role: 'user',
      content,
      tokens_used: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    setStreaming(true);
    setStreamContent('');
    let fullResponse = '';

    abortRef.current = chat.streamMessage(
      initialConversation.id,
      content,
      (chunk) => {
        fullResponse += chunk;
        setStreamContent(fullResponse);
      },
      () => {
        setStreaming(false);
        if (fullResponse) {
          const assistantMsg: Message = {
            id: Date.now() + 1,
            conversation_id: initialConversation.id,
            role: 'assistant',
            content: fullResponse,
            tokens_used: null,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setStreamContent('');
        }
      },
      (error) => {
        setStreaming(false);
        setStreamContent('');
        const errorMsg: Message = {
          id: Date.now() + 1,
          conversation_id: initialConversation.id,
          role: 'assistant',
          content: `Sorry, I hit an error: ${error}`,
          tokens_used: null,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    );
  }

  function handleSend(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleSendDraftForReview() {
    setDraftSent(true);
    sendMessage(`Here is my draft so far. Please review it against the rubric and tell me what's working and what I need to improve:\n\n${draftToReview}`);
  }

  const quickPrompts = [
    { label: 'Review my draft against the rubric', action: () => handleSendDraftForReview() },
    { label: 'What does the rubric say I need for a High Distinction?', action: () => sendMessage('What does the rubric say I need for a High Distinction?') },
    { label: 'What sections am I missing from the brief requirements?', action: () => sendMessage('Based on the brief, what sections am I missing or need to add?') },
    { label: 'Is my introduction strong enough?', action: () => sendMessage(`Can you check if my introduction meets the brief requirements? Here it is:\n\n${draftToReview.split('SWOT:')[0]}`) },
    { label: 'Help me understand the SWOT matrix format', action: () => sendMessage('The brief says I need a 2x2 SWOT matrix format. Can you explain what that means and how I should structure it?') },
    { label: 'Check my referencing requirements', action: () => sendMessage('The brief requires IBISWorld, Think With Google, and one academic reference with APA formatting. Can you remind me what I need to include?') },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
            {brief.subject_code} — {brief.assessment_name}
          </h1>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            {brief.word_limit && <span>{brief.word_limit} words</span>}
            {brief.weighting && <span>{brief.weighting}</span>}
            <span className="text-amber-600 dark:text-amber-400 font-medium">Assignment Coach</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {draftToReview && (
            <button
              onClick={() => setShowDraft(!showDraft)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition font-medium ${
                showDraft
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {showDraft ? 'Hide Draft' : 'My Draft'}
            </button>
          )}
          <button
            onClick={() => setShowBrief(!showBrief)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition font-medium ${
              showBrief
                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {showBrief ? 'Hide Brief' : 'View Brief'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Side Panel — Brief or Draft */}
        {(showBrief || showDraft) && (
          <aside className="w-96 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto p-4 flex-shrink-0">
            {showBrief && (
              <>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
                  Assignment Brief
                </h3>
                <div className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed mb-6">
                  {brief.brief_content}
                </div>
                {brief.rubric_content && (
                  <>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      Rubric
                    </h3>
                    <div className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {brief.rubric_content}
                    </div>
                  </>
                )}
              </>
            )}
            {showDraft && !showBrief && (
              <>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
                  Your Current Draft
                </h3>
                <div className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {draftToReview}
                </div>
              </>
            )}
          </aside>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {messages.length === 0 && !streaming && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="text-4xl mb-4">&#x1F393;</div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Ready to coach you on {brief.subject_code}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-1">
                  I&apos;ve loaded your assignment brief and rubric. I can see your draft work is about
                  <strong> Sushi Taro</strong> in Artarmon.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6">
                  Pick an option below to get started. I&apos;ll review your work and help you improve it —
                  but I won&apos;t write it for you!
                </p>

                <div className="w-full max-w-lg space-y-2">
                  {quickPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={prompt.action}
                      disabled={i === 0 && (!draftToReview || draftSent)}
                      className="w-full text-left text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {i === 0 && draftToReview ? (
                        <span className="flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          {prompt.label}
                          <span className="text-xs text-gray-400 ml-auto">draft loaded</span>
                        </span>
                      ) : (
                        prompt.label
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {streaming && streamContent && (
              <ChatMessage
                message={{ role: 'assistant', content: streamContent }}
                isStreaming
              />
            )}

            {streaming && !streamContent && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <form onSubmit={handleSend} className="flex gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Ask about the assignment, paste updated sections for review, or ask how to improve..."
                disabled={streaming}
                rows={2}
                className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition disabled:opacity-50 resize-y min-h-[48px]"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="self-end bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl px-5 py-3 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
              </button>
            </form>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
              Plato reviews your work and gives feedback — it will never write your assignment for you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Trial Page ─────────────────────────────────────────────────────────

function TrialContent() {
  const [loading, setLoading] = useState(true);
  const [llmConfigured, setLlmConfigured] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Session state
  const [activeBrief, setActiveBrief] = useState<CoachBrief | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [activeDraft, setActiveDraft] = useState('');

  useEffect(() => {
    settingsApi.getLLM()
      .then((res) => setLlmConfigured(res.configured))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleStartAssignment(index: number) {
    const assignment = ISABELLA_ASSIGNMENTS[index];
    setStarting(assignment.subject_code);
    setError('');

    try {
      // Create the brief in the backend
      const briefRes = await coach.createBrief({
        subject_code: assignment.subject_code,
        assessment_name: assignment.assessment_name,
        brief_content: assignment.brief_content,
        rubric_content: assignment.rubric_content || undefined,
        word_limit: assignment.word_limit || undefined,
        weighting: assignment.weighting || undefined,
      });

      // Start a coaching session
      const sessionRes = await coach.startSession(briefRes.brief.id);

      setActiveBrief(sessionRes.brief);
      setActiveConversation(sessionRes.conversation);
      setActiveMessages(sessionRes.messages);
      setActiveDraft(assignment.draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
    } finally {
      setStarting(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!llmConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Set up your AI provider first
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
            Plato needs an API key to power the Assignment Coach.
          </p>
          <Link
            href="/settings"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg px-5 py-2.5 transition"
          >
            Go to Settings
          </Link>
        </div>
      </div>
    );
  }

  // ─── Active Session ─────────────────────────────────────────────────────────
  if (activeBrief && activeConversation) {
    return (
      <CoachingSession
        brief={activeBrief}
        initialConversation={activeConversation}
        initialMessages={activeMessages}
        draftToReview={activeDraft}
        onBack={() => {
          setActiveBrief(null);
          setActiveConversation(null);
          setActiveMessages([]);
          setActiveDraft('');
        }}
      />
    );
  }

  // ─── Assignment Selection ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">&#x1F393;</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Isabella&apos;s Assignment Coach
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Pick an assignment to start. Plato will load the brief, rubric, and your draft work so you
            can get coaching feedback right away.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg p-3 mb-4 text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* MKT105 */}
          <button
            onClick={() => handleStartAssignment(0)}
            disabled={!!starting}
            className="w-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 text-left hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition disabled:opacity-60"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded px-2 py-0.5 mb-2">
                  MKT105
                </span>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  SWOT Analysis Report
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Marketing in the Digital Era — Analyse Sushi Taro (Artarmon)
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>750 words</span>
                  <span>30% weighting</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Draft started</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                {starting === 'MKT105' ? (
                  <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </div>
          </button>

          {/* MGMT6002 */}
          <button
            onClick={() => handleStartAssignment(1)}
            disabled={!!starting}
            className="w-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 text-left hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition disabled:opacity-60"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 rounded px-2 py-0.5 mb-2">
                  MGMT6002
                </span>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Assessment 1
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Brief not yet loaded — start a session to discuss requirements
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="text-amber-500 font-medium">Brief pending</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                {starting === 'MGMT6002' ? (
                  <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </div>
          </button>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/coach"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            Go to full Assignment Coach &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TrialPage() {
  return (
    <ProtectedRoute>
      <TrialContent />
    </ProtectedRoute>
  );
}
