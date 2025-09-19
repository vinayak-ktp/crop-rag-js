import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PineconeStore } from "@langchain/pinecone";

import { PINECONE_INDEX_NAME } from "./env.js";
import { embeddingModel, pinecone } from "./model.js";

const indexDocuments = async () => {
  console.log("loading raw docs...");

  const PDFPATH = "../data/crop-data.pdf";
  const pdfLoader = new PDFLoader(PDFPATH);
  const rawDocs = await pdfLoader.load();

  console.log("splitting and chunking...");

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const chunkedDocs = await textSplitter.splitDocuments(rawDocs);

  console.log("initializing pinecone...");

  const pineconeIndex = pinecone.Index(PINECONE_INDEX_NAME);

  console.log("initializing pinecone store...");

  //   const sampleText = "this is some text";
  //   const testEmbedding = await embeddingModel.embedQuery(sampleText);
  //   console.log(testEmbedding.length);

  await PineconeStore.fromDocuments(chunkedDocs, embeddingModel, {
    pineconeIndex: pineconeIndex,
    maxConcurrency: 5,
  });

  console.log("doc stored in db");
};

indexDocuments();
