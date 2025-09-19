import dotenv from 'dotenv'
dotenv.config()

const GOOGLE_API_KEY=process.env.GOOGLE_API_KEY
const TAVILY_API_KEY=process.env.TAVILY_API_KEY
const PINECONE_API_KEY=process.env.PINECONE_API_KEY
const PINECONE_INDEX_NAME=process.env.PINECONE_INDEX_NAME

export {
    GOOGLE_API_KEY,
    TAVILY_API_KEY,
    PINECONE_API_KEY,
    PINECONE_INDEX_NAME,
}