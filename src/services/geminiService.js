// Gemini AI service for dashboard generation

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const API_KEY = "AIzaSyBnD6pE3aHZ7SLLzdMKK2DN9S5Fd9QOThQ";

// Send message to Gemini AI and get dashboard code
export const sendMessageToGemini = async (
  userMessage,
  conversationHistory = [],
  firestoreSchema = null,
  existingCode = null
) => {
  try {
    // Build conversation context
    const conversationContext = conversationHistory
      .map((msg) => `User: ${msg.userMessage}\nAI: ${msg.aiResponse}`)
      .join("\n\n");

    // Create system prompt
    const systemPrompt = `You are a dashboard code generator. Generate React component code that:
- Uses functional components with hooks
- Accepts data prop containing Firestore data
- Uses recharts for visualizations (BarChart, LineChart, PieChart, etc. are available)
- Returns complete, self-contained JSX
- Includes proper error handling
- Is responsive and styled with inline styles
- Uses modern React patterns (useState, useEffect, useMemo)
- Handles loading states and empty data gracefully
- DO NOT include any import statements - all dependencies are provided
- DO NOT include export statements - just return the component function body
- MUST include at least one JSX element (like <div>, <h1>, etc.)
- MUST be valid React component code

IMPORTANT: Your response must be a complete React component function that can be executed. 

CRITICAL: Wrap your response in \`\`\`jsx code blocks like this:

\`\`\`jsx
function Dashboard({ data }) {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard</h1>
      <BarChart width={500} height={300} data={data.users || []}>
        <Bar dataKey="value" fill="#8884d8" />
      </BarChart>
    </div>
  );
}
\`\`\`

Do NOT include any text before or after the code block. Start your response with \`\`\`jsx and end with \`\`\`.

Available recharts components: BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter

Available data schema: ${
      firestoreSchema
        ? JSON.stringify(firestoreSchema, null, 2)
        : "No schema available"
    }
Previous dashboard code: ${existingCode || "none"}

${
  conversationContext
    ? `Previous conversation:\n${conversationContext}\n\n`
    : ""
}

User request: ${userMessage}

Respond with ONLY the React component code wrapped in \`\`\`jsx\n...\n\`\`\` blocks. Do not include any explanations or additional text.`;

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

    // Extract code from markdown code blocks or raw code
    let codeMatch = aiResponse.match(/```jsx\s*\n?([\s\S]*?)\n?```/);
    let generatedCode;

    if (codeMatch) {
      generatedCode = codeMatch[1].trim();
    } else {
      // Try to extract code without markdown blocks
      // Look for function declarations with proper matching
      const functionMatch = aiResponse.match(
        /(function\s+\w+\s*\([^)]*\)\s*{[\s\S]*?^})/m
      );
      if (functionMatch) {
        generatedCode = functionMatch[1].trim();
      } else {
        // Look for any JSX-like content
        const jsxMatch = aiResponse.match(/(<[^>]+>[\s\S]*?<\/[^>]+>)/);
        if (jsxMatch) {
          generatedCode = jsxMatch[1].trim();
        } else {
          // Last resort: try to find any code that looks like a React component
          const componentMatch = aiResponse.match(
            /(const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{[\s\S]*?^})/m
          );
          if (componentMatch) {
            generatedCode = componentMatch[1].trim();
          } else {
            throw new Error("No valid React code found in AI response");
          }
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
