import readlineSync from "readline-sync";

import { chatModel, embeddingModel, pinecone } from "./models.js";
import { PINECONE_INDEX_NAME } from "./env.js";

const chatHistory = [];

const generateChatHistoryContext = () => {
  const chatHistoryContext =
    chatHistory.length > 0
      ? chatHistory
          .map((message) => `${message.role}: ${message.content}`)
          .join("\n")
      : "No previous conversations";
  return chatHistoryContext;
};

const transformQuery = async (query) => {
  try {
    const chatHistory = generateChatHistoryContext();

    const fullPrompt = `
            You are a query rewriting expert. Based on the provided chat history, rephrase the "follow up user query" into a complete, standalone question that can be understood without the chat history.
            Only output the rewritten question and nothing else.

            chat history: ${chatHistory}

            follow up user query: ${query}
        `;
    const response = await chatModel.invoke([
      { role: "user", content: fullPrompt },
    ]);
    return response.content || question;
  } catch (error) {
    console.error("error in transform query function", error);
    return question;
  }
};

const chat = async (query) => {
  try {
    console.log("transforming query...");
    const transformedQuery = await transformQuery(query);

    console.log("creating embeddings...");
    const queryVector = await embeddingModel.embedQuery(
      String(transformedQuery)
    );

    console.log("querying pinecone...");
    const pineconeIndex = pinecone.Index(PINECONE_INDEX_NAME);

    const searchResults = await pineconeIndex.query({
      topK: 10,
      vector: queryVector,
      includeMetadata: true,
    });

    console.log("creating context...");

    if (!searchResults.matches || searchResults.matches.length === 0) {
      console.log("No documents found in pinecone");
      return;
    }

    const context = searchResults.matches
      .filter((match) => match.metadata && match.metadata.text)
      .map((match) => match.metadata.text)
      .join("\n-----------------\n");

    if (!context.trim()) {
      console.log("No valid search results");
      return;
    }

    const chatHistoryContext = generateChatHistoryContext();

    console.log("generating response...");

    const fullPrompt = `
            You are an agricultural assistant that helps farmers with their queries about crops and crop production. 
        
            ## Context Sources
            You have the following context:
            1. Search Context: ${context}
            2. Chat History: ${chatHistoryContext}
            3. Farmer Query: ${query}
            4. Transformed Query:  ${transformedQuery}

            ## Instructions
            - Always use the retrieved crop data as the **main source of truth** when answering.
            - Use the chat history to stay consistent and avoid repeating the same details unnecessarily.
            - Provide **simple, clear, and practical answers** that farmers can directly apply in the field.
            - Do not provide technical explanations, probabilities, or machine learning outputs. Translate everything into **actionable farming advice**.
            - If some information is missing in the retrieved data, give the best possible guidance based on available knowledge, and suggest what else the farmer could check or provide.
            - Always focus on what helps the farmer make better decisions about crops and their production (e.g., when to sow, how to irrigate, how to control pests, which variety to plant).
            - Keep responses **friendly, respectful, and easy to understand**.
        
            ## Output Format
            - Start with a direct and clear answer to the farmer’s query.
            - If useful, add **step-by-step guidance** or **practical tips**.
            - Where relevant, include preventive measures, cost-saving suggestions, or recommendations for improving yield.
            - Avoid unnecessary technical jargon, research-style explanations, or statistical outputs.
        
            Your role is to act as a **trusted farming advisor**, giving the most relevant and easy-to-follow advice based on the retrieved crop data and the farmer’s questions.    
        `;

    const response = await chatModel.invoke([{ role: "user", content: fullPrompt }]);

    chatHistory.push({ role: "user", content: query });
    chatHistory.push({ role: "assistant", content: response.content });

    console.log("\n AI assistant");
    // console.log(response)
    console.log(response.content);
    console.log("-------------\n");
  } catch (error) {
    console.error("error in chat function: ", error.message);
    console.error("error details: ", error);
  }
};

const main = async () => {
  console.log("RAG chatbot, type 'exit' to quit");
  while (true) {
    try {
      const userProblem = readlineSync.question("--> ");

      if (userProblem.toLowerCase() === "exit") {
        console.log("Goodbye!");
        break;
      }

      if (userProblem.trim()) {
        await chat(userProblem);
      }
    } catch (error) {
      console.error("Error in main loop:", error);
      break;
    }
  }
};

main().catch((error) => {
  console.log("fatal error: ", error);
  process.exit(1);
});
