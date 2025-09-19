import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";

import { GOOGLE_API_KEY, PINECONE_API_KEY } from "./env.js";

const chatModel = new ChatGoogleGenerativeAI({
  apiKey: GOOGLE_API_KEY,
  model: "gemini-2.5-flash",
  temperature: 0.3,
});

const embeddingModel = new GoogleGenerativeAIEmbeddings({
  apiKey: GOOGLE_API_KEY,
  model: "models/text-embedding-004",
  // outputDimensionality: 768,
});

const pinecone = new Pinecone({
  apiKey: PINECONE_API_KEY,
});

export { chatModel, embeddingModel, pinecone };
