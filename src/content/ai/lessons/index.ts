import type { LessonBody } from "@content/types";

const llmBasics: LessonBody = {
  id: "ai-llm-basics",
  blocks: [
    {
      type: "md",
      md: `A large language model predicts the **next token** given everything before it. Text is split into tokens (roughly ¾ of a word in English), the model scores every possible next token, one is sampled, appended, and the loop repeats.

Three practical consequences for engineers:

- **Cost and latency scale with tokens**, input and output, so prompt length matters.
- **The context window is the model's whole memory** for a request. Nothing persists between calls unless you send it again.
- **Fluency isn't truth.** The model produces plausible continuations; without grounding it can confidently invent facts (hallucination).`,
    },
    {
      type: "compare",
      title: "Knobs and what they do",
      headers: ["Setting", "Effect", "Typical use"],
      rows: [
        ["Max output tokens", "Caps response length (and cost)", "Always set it"],
        ["Temperature / sampling", "Higher = more varied, lower = more deterministic", "Low for extraction, higher for brainstorming"],
        ["System prompt", "Standing instructions and persona", "Rules, tone, format"],
        ["Context (messages)", "The conversation and any documents", "Grounding facts for the answer"],
      ],
    },
    {
      type: "callout",
      tone: "insight",
      title: "Treat it like an unreliable but brilliant colleague",
      md: "Give clear instructions and the facts it needs, ask for structured output you can validate, and verify anything that matters. Design systems so a wrong answer is caught, not shipped.",
    },
    {
      type: "checklist",
      title: "Pitfalls",
      items: [
        "Sending secrets or personal data to a model without a policy",
        "Trusting model output as ground truth without validation",
        "Unbounded output or retry loops (cost blow-ups)",
        "Putting user input into the system prompt (prompt injection risk)",
      ],
    },
    { type: "quiz", ids: ["llm-q1", "llm-q2"] },
  ],
  quiz: [
    {
      id: "llm-q1",
      prompt: "Why does a model 'forget' earlier conversations?",
      choices: ["It deletes them", "Each request only sees what's in its context window", "Training resets nightly", "Tokens expire"],
      answer: 1,
      explanation: "Models are stateless per request; chat apps resend history.",
    },
    {
      id: "llm-q2",
      prompt: "What drives the cost of an LLM call?",
      choices: ["Number of words in the system prompt only", "Input and output tokens", "Time of day", "Temperature"],
      answer: 1,
      explanation: "Providers bill per token in and out.",
    },
  ],
  cards: [
    {
      id: "llm-c1",
      front: "What does an LLM fundamentally do?",
      back: "Predicts the next token repeatedly, given the context.",
    },
    {
      id: "llm-c2",
      front: "Context window?",
      back: "Everything the model can see for one request; its only memory.",
    },
    {
      id: "llm-c3",
      front: "Hallucination?",
      back: "Fluent but false output; mitigate with grounding (RAG), validation and citations.",
    },
    {
      id: "llm-c4",
      front: "What drives LLM cost and latency?",
      back: "Input + output tokens.",
    },
  ],
};

const prompting: LessonBody = {
  id: "ai-prompting",
  blocks: [
    {
      type: "md",
      md: `Good prompts read like a brief to a smart contractor: **role, task, context, constraints, output format**. And for anything a program consumes, don't parse prose; ask for **structured output** that matches a schema, and validate it.`,
    },
    {
      type: "code",
      lang: "text",
      title: "A clear prompt",
      code: `System: You review pull-request descriptions for a Java team. Be concise and specific.

User:
<pr_description>
{{description}}
</pr_description>

Return JSON: { "summary": string, "risks": string[], "missingTests": string[] }.
If the description is empty, return empty arrays and summary "No description".`,
    },
    {
      type: "compare",
      title: "Techniques",
      headers: ["Technique", "When"],
      rows: [
        ["Delimit inputs (XML tags)", "Always: separates instructions from data, reduces injection"],
        ["Few-shot examples", "Format or style is hard to describe"],
        ["Structured output (JSON schema)", "Any machine-consumed result"],
        ["Tool / function calling", "The model needs live data or to take an action"],
        ["Ask for reasoning before the answer", "Multi-step problems (or use a model's built-in thinking)"],
      ],
    },
    {
      type: "callout",
      tone: "insight",
      title: "Tool calling, in one sentence",
      md: "You describe functions (name, purpose, JSON parameters); the model replies with a call it wants made; *your code* runs it and returns the result; the model continues. The model never executes anything itself.",
    },
    {
      type: "callout",
      tone: "warning",
      title: "Prompt injection",
      md: 'Text from users or documents can contain instructions ("ignore previous instructions…"). Keep untrusted content clearly delimited, never let it change tool permissions, and validate every tool call server-side.',
    },
    { type: "quiz", ids: ["pr-q1", "pr-q2"] },
  ],
  quiz: [
    {
      id: "pr-q1",
      prompt: "Your service needs the model's answer as data. Best approach?",
      choices: [
        "Parse prose with regex",
        "Request structured output against a schema and validate it",
        "Ask nicely for JSON and hope",
        "Use a higher temperature",
      ],
      answer: 1,
      explanation: "Schema-constrained output plus validation is robust.",
    },
    {
      id: "pr-q2",
      prompt: "In tool calling, who executes the function?",
      choices: ["The model", "Your application code", "The provider's servers always", "The user"],
      answer: 1,
      explanation: "The model only requests the call; you run it and send back the result.",
    },
  ],
  cards: [
    {
      id: "pr-c1",
      front: "Elements of a good prompt?",
      back: "Role, task, context, constraints, output format.",
    },
    {
      id: "pr-c2",
      front: "Why delimit inputs with tags?",
      back: "Separates instructions from data; reduces prompt-injection risk.",
    },
    {
      id: "pr-c3",
      front: "Tool calling flow?",
      back: "Model requests a call → your code runs it → result returned → model continues.",
    },
    {
      id: "pr-c4",
      front: "Prompt injection defence?",
      back: "Delimit untrusted text, least-privilege tools, server-side validation of every action.",
    },
  ],
};

const rag: LessonBody = {
  id: "ai-rag",
  blocks: [
    {
      type: "md",
      md: `**Retrieval-augmented generation** grounds answers in your own data: retrieve the most relevant passages, put them in the prompt, and ask the model to answer *from them* (with citations). It's how you get current, private, verifiable answers without training a model.`,
    },
    {
      type: "steps",
      title: "The RAG pipeline",
      items: [
        {
          title: "Chunk",
          md: "Split documents into passages of a few hundred tokens with some overlap, keeping headings as context.",
        },
        {
          title: "Embed",
          md: "Turn each chunk into a vector with an embedding model; similar meaning → nearby vectors.",
        },
        {
          title: "Store",
          md: "Put vectors plus metadata in a vector store (pgvector, OpenSearch, a managed service).",
        },
        {
          title: "Retrieve",
          md: "Embed the question, find the top-k nearest chunks (often hybrid with keyword search), optionally re-rank.",
        },
        {
          title: "Generate",
          md: 'Prompt: "Answer only from these sources; cite them; say if the answer isn\'t there."',
        },
      ],
    },
    {
      type: "compare",
      title: "Tuning levers",
      headers: ["Lever", "Too small", "Too large"],
      rows: [
        ["Chunk size", "Loses context", "Dilutes relevance, costs tokens"],
        ["Top-k", "Misses the answer", "Noise and cost"],
        ["Similarity threshold", "Empty results", "Irrelevant context"],
      ],
    },
    {
      type: "callout",
      tone: "insight",
      title: "Evaluate retrieval separately",
      md: "Most bad RAG answers are retrieval failures. Keep a small set of questions with known source passages and measure whether retrieval finds them before blaming the model.",
    },
    { type: "quiz", ids: ["rag-q1", "rag-q2"] },
  ],
  quiz: [
    {
      id: "rag-q1",
      prompt: "What does an embedding represent?",
      choices: ["A compressed file", "A vector where semantically similar text lands close together", "A database index", "A token count"],
      answer: 1,
      explanation: "Nearest-neighbour search over embeddings finds related meaning, not just matching words.",
    },
    {
      id: "rag-q2",
      prompt: "A RAG system gives wrong answers. What should you check first?",
      choices: ["Switch to a bigger model", "Whether retrieval returned the right passages", "Increase temperature", "Remove citations"],
      answer: 1,
      explanation: "If the right context isn't retrieved, no model can answer correctly.",
    },
  ],
  cards: [
    {
      id: "rag-c1",
      front: "RAG pipeline steps?",
      back: "Chunk → embed → store → retrieve (top-k, hybrid, re-rank) → generate with citations.",
    },
    {
      id: "rag-c2",
      front: "Why hybrid search in RAG?",
      back: "Embeddings catch meaning; keyword search catches exact names, codes and rare terms.",
    },
    {
      id: "rag-c3",
      front: "First thing to debug in bad RAG answers?",
      back: "Retrieval quality: were the right passages returned?",
    },
  ],
};

const springAi: LessonBody = {
  id: "ai-spring-ai",
  blocks: [
    {
      type: "md",
      md: `**Spring AI** brings the usual Spring conventions to LLMs: a portable \`ChatClient\`, auto-configured model clients, **advisors** (interceptors around calls, used for memory and RAG), tool calling via annotated methods, and a \`VectorStore\` abstraction.`,
    },
    {
      type: "code",
      lang: "java",
      title: "ChatClient with structured output",
      code: `@Service
class ReviewSummarizer {
    private final ChatClient chat;

    ReviewSummarizer(ChatClient.Builder builder) {
        this.chat = builder
            .defaultSystem("You summarise customer reviews for product managers. Be concise.")
            .build();
    }

    record Summary(String sentiment, List<String> themes) {}

    Summary summarise(String reviews) {
        return chat.prompt()
            .user(u -> u.text("<reviews>{r}</reviews>").param("r", reviews))
            .call()
            .entity(Summary.class);            // maps the JSON response onto the record
    }
}`,
    },
    {
      type: "code",
      lang: "java",
      title: "Tools the model can call",
      code: `class OrderTools {
    @Tool(description = "Look up the status of an order by its id")
    String orderStatus(@ToolParam(description = "Order id, e.g. ORD-123") String orderId) {
        return orders.findStatus(orderId);     // your code runs; validate inputs here
    }
}

String answer = chat.prompt()
    .user("Where is order ORD-123?")
    .tools(new OrderTools())
    .call()
    .content();`,
    },
    {
      type: "callout",
      tone: "insight",
      title: "Advisors are the extension point",
      md: "Memory (`MessageChatMemoryAdvisor`) and RAG (`QuestionAnswerAdvisor` with a `VectorStore`) are advisors that enrich the prompt before the call. You can write your own for logging, guardrails or redaction.",
    },
    {
      type: "checklist",
      title: "Production checklist",
      items: [
        "Timeouts, retries with backoff, and a fallback path",
        "Token and cost metrics via Micrometer observations",
        "Validate structured output and tool arguments",
        "Keep API keys in a secret store, never in application.yml",
      ],
    },
    { type: "quiz", ids: ["sai-q1", "sai-q2"] },
  ],
  quiz: [
    {
      id: "sai-q1",
      prompt: "How does Spring AI turn a response into a Java record?",
      choices: ["Manual regex", "`.entity(MyRecord.class)` with structured output conversion", "Jackson annotations on the prompt", "It can't"],
      answer: 1,
      explanation: "It instructs the model on the format and maps the JSON onto the type.",
    },
    {
      id: "sai-q2",
      prompt: "Where does RAG plug into Spring AI?",
      choices: ["A custom JDBC driver", "An advisor such as QuestionAnswerAdvisor backed by a VectorStore", "A servlet filter", "Spring Batch"],
      answer: 1,
      explanation: "Advisors enrich the prompt with retrieved context before the call.",
    },
  ],
  cards: [
    {
      id: "sai-c1",
      front: "Spring AI's main entry point?",
      back: "ChatClient (fluent prompt → call → content/entity).",
    },
    {
      id: "sai-c2",
      front: "Spring AI advisors?",
      back: "Interceptors around model calls: memory, RAG (QuestionAnswerAdvisor), logging, guardrails.",
    },
    {
      id: "sai-c3",
      front: "Expose a Java method as a tool?",
      back: "Annotate with @Tool (and @ToolParam), pass the object via .tools(...).",
    },
  ],
};

const lessons: LessonBody[] = [llmBasics, prompting, rag, springAi];
export default lessons;
