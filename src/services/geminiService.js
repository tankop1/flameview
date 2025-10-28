// Gemini AI service for dashboard generation

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const API_KEY = "AIzaSyBnD6pE3aHZ7SLLzdMKK2DN9S5Fd9QOThQ";

// Send message to Gemini AI and get dashboard code
export const sendMessageToGemini = async (
  userMessage,
  conversationHistory = [],
  firestoreSchema = null,
  existingCode = null,
  fetchedData = null
) => {
  try {
    // Log received data for debugging
    console.log(
      "Gemini service - received fetchedData keys:",
      fetchedData ? Object.keys(fetchedData) : "none"
    );
    console.log(
      "Gemini service - fetchedData sample:",
      fetchedData
        ? JSON.stringify(fetchedData, null, 2).substring(0, 300) + "..."
        : "none"
    );

    // Build conversation context
    const conversationContext = conversationHistory
      .map((msg) => `User: ${msg.userMessage}\nAI: ${msg.aiResponse}`)
      .join("\n\n");

    // Create system prompt for a polished, modern dashboard
    const systemPrompt = `You are a dashboard code generator. Generate a polished, professional, modern dashboard React component that:
• Uses functional components with hooks
• Accepts a single prop: { data } which contains Firestore-derived data
• Uses recharts for visualizations (BarChart, LineChart, PieChart, etc.) and ResponsiveContainer for responsiveness
• Builds a comprehensive dashboard layout with: professional header, multiple KPI cards, charts, and data tables
• ALWAYS includes a full background color (gradient or solid) that covers the entire dashboard
• Uses modern design system: cards with glassmorphism effects, subtle shadows, rounded corners, proper spacing
• Implements a professional color palette with consistent theming throughout
• Is fully responsive with CSS Grid and Flexbox layouts that adapt to different screen sizes
• Handles empty/partial data gracefully with professional loading states and empty state designs
• Adds rich interactivity: hover effects, animations, tooltips, legends, and interactive charts
• Uses useMemo and useCallback for performance optimization
• Includes proper data visualization best practices (appropriate chart types, clear labels, legends)
• Does NOT fetch data or assume globals; only uses the provided data prop
• Does NOT include any import or export statements
• Returns a complete, self-contained, valid React component function named Dashboard

CRITICAL DESIGN REQUIREMENTS:
• MUST have a full background color/gradient covering the entire dashboard
• MUST include at least 3-4 KPI cards with meaningful metrics
• MUST include at least 2-3 different chart types (bar, line, pie, area, etc.)
• MUST use professional typography hierarchy (h1, h2, h3, p with proper sizing)
• MUST include proper spacing and padding throughout
• MUST have a cohesive color scheme with primary, secondary, and accent colors
• MUST be visually rich and engaging, not minimal or text-heavy

Prefer visual insights (charts, KPI cards, data tables) over plain text. Make it look like a professional business dashboard.
• Include icons, trend indicators, and visual elements to make it engaging
• Use data-driven insights and meaningful metrics, not just raw data display
• Ensure the dashboard tells a story with the data through proper visualization choices

CRITICAL RESPONSE FORMAT:
Your response must be EXACTLY in this format:

SUMMARY:
• [Brief bullet point 1 describing what was built]
• [Brief bullet point 2 describing key features]
• [Brief bullet point 3 describing data visualization approach]
• [Brief bullet point 4 describing any special styling or interactions]

CODE:
\`\`\`jsx
function Dashboard({ data }) {
  // component body
}
\`\`\`

Available recharts components: BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter

STYLING GUIDELINES:
• Use modern CSS with gradients, shadows, and smooth transitions
• Implement glassmorphism effects: backdrop-filter: blur(), semi-transparent backgrounds
• Use CSS Grid for main layout: display: grid, grid-template-columns, gap
• Use Flexbox for component layouts: display: flex, justify-content, align-items
• Color palette suggestions: #1e293b (dark slate), #3b82f6 (blue), #10b981 (emerald), #f59e0b (amber), #ef4444 (red)
• Typography: font-family: 'Inter', 'Segoe UI', system-ui, sans-serif
• Shadows: box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
• Border radius: border-radius: 0.75rem (12px) for cards, 0.5rem (8px) for smaller elements
• Spacing: Use consistent padding (1rem, 1.5rem, 2rem) and margins (0.5rem, 1rem, 1.5rem)

EXAMPLE BACKGROUND PATTERNS:
• Linear gradient: background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
• Dark theme: background: linear-gradient(135deg, #1e293b 0%, #334155 100%)
• Light theme: background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)
• Colorful: background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)

Available data schema: ${
      firestoreSchema
        ? JSON.stringify(firestoreSchema, null, 2)
        : "No schema available"
    }

ACTUAL DATA (use this to generate accurate visualizations based on real data):
${
  fetchedData
    ? JSON.stringify(fetchedData, null, 2)
    : "No data available - generate placeholder content"
}

Previous dashboard code: ${existingCode || "none"}

${
  conversationContext
    ? `Previous conversation:\n${conversationContext}\n\n`
    : ""
}

User request: ${userMessage}

DASHBOARD STRUCTURE EXAMPLE:
The dashboard should follow this general structure:
1. Full background with gradient or solid color
2. Header section with title and subtitle
3. KPI cards row (3-4 cards with metrics, icons, and trend indicators)
4. Main content area with charts in a grid layout
5. Data table or additional insights section
6. Footer or additional metrics

Each section should have proper spacing, shadows, and visual hierarchy.

KPI CARD EXAMPLE STRUCTURE:
Each KPI card should include:
- Icon or visual indicator
- Main metric value (large, prominent)
- Label/description
- Trend indicator (up/down arrow with percentage)
- Background with subtle gradient or glassmorphism effect

CHART STYLING REQUIREMENTS:
- Use consistent color schemes across all charts
- Include proper legends and tooltips
- Add hover effects and animations
- Use appropriate chart types for the data (bar for comparisons, line for trends, pie for proportions)
- Include data labels where appropriate

Respond with the SUMMARY and CODE sections as specified above.`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: systemPrompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content
    ) {
      throw new Error("Invalid response from Gemini API");
    }

    const aiResponse = data.candidates[0].content.parts[0].text;

    // Extract summary and code from the new format
    let summary = "";
    let generatedCode = "";

    // Extract summary section
    const summaryMatch = aiResponse.match(/SUMMARY:\s*\n((?:•[^\n]*\n?)*)/);
    if (summaryMatch) {
      summary = summaryMatch[1].trim();
      // Add extra line breaks between bullet points for better spacing
      summary = summary.replace(/\n•/g, "\n\n•");
    }

    // Extract code from CODE section
    const codeMatch = aiResponse.match(
      /CODE:\s*\n```jsx\s*\n?([\s\S]*?)\n?```/
    );
    if (codeMatch) {
      generatedCode = codeMatch[1].trim();
    } else {
      // Fallback: try to extract code from any jsx code block
      const fallbackCodeMatch = aiResponse.match(
        /```jsx\s*\n?([\s\S]*?)\n?```/
      );
      if (fallbackCodeMatch) {
        generatedCode = fallbackCodeMatch[1].trim();
      } else {
        // Try to extract code without markdown blocks
        const functionMatch = aiResponse.match(
          /(function\s+\w+\s*\([^)]*\)\s*{[\s\S]*?^})/m
        );
        if (functionMatch) {
          generatedCode = functionMatch[1].trim();
        } else {
          throw new Error("No valid React code found in AI response");
        }
      }
    }

    console.log("Extracted code:", generatedCode);

    // Basic validation of generated code
    if (
      !generatedCode.includes("function") &&
      !generatedCode.includes("=>") &&
      !generatedCode.includes("return") &&
      !generatedCode.includes("<") &&
      !generatedCode.includes("React")
    ) {
      throw new Error(
        "Generated code does not appear to be a valid React component"
      );
    }

    return {
      code: generatedCode,
      summary: summary || "Dashboard generated successfully",
      fullResponse: aiResponse,
      success: true,
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return {
      code: null,
      fullResponse: error.message,
      success: false,
      error: error.message,
    };
  }
};

// Analyze Firestore schema and suggest data requirements
export const analyzeDataRequirements = async (userMessage, firestoreSchema) => {
  try {
    const prompt = `Analyze this Firestore schema and user request to determine what data should be fetched:

User request: ${userMessage}

Firestore schema: ${JSON.stringify(firestoreSchema, null, 2)}

Respond with a JSON object containing:
{
  "collections": ["collection1", "collection2"],
  "filters": {
    "collection1": {"field": "value"},
    "collection2": {"field": "value"}
  },
  "limit": 1000
}

Only include collections that are relevant to the user's request.`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 1024,
      },
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;

    // Try to extract JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback: return all collections with no filters
    return {
      collections: Object.keys(firestoreSchema || {}),
      filters: {},
      limit: 1000,
    };
  } catch (error) {
    console.error("Error analyzing data requirements:", error);
    return {
      collections: Object.keys(firestoreSchema || {}),
      filters: {},
      limit: 1000,
    };
  }
};
