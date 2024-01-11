import { createClient } from "@supabase/supabase-js";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

import { markdownLoader } from "./load.js"
import { StringOutputParser } from "@langchain/core/output_parsers";
import { BufferMemory } from "langchain/memory";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";

export const markdownRetriever = async () => {
  const privateKey = process.env.SUPABASE_PRIVATE_KEY;
  if (!privateKey) throw new Error(`Expected env var SUPABASE_PRIVATE_KEY`);

  const url = process.env.SUPABASE_URL;
  if (!url) throw new Error(`Expected env var SUPABASE_URL`);

  const client = createClient(url, privateKey);

  const texts = await markdownLoader()

  const vectorStore = await SupabaseVectorStore.fromDocuments(
    texts,
    new OpenAIEmbeddings(),
    {
      client,
      tableName: "documents",
      queryName: "match_documents",
    }
  );

  const retriever = vectorStore.asRetriever({
    searchType: "mmr", // Use max marginal relevance search
    searchKwargs: { fetchK: 5 },
  });

  const model = new ChatOpenAI({ modelName: "gpt-4" }).pipe(
    new StringOutputParser()
  );

  const memory = new BufferMemory({
    returnMessages: true, // Return stored messages as instances of `BaseMessage`
    memoryKey: "chat_history", // This must match up with our prompt template input variable.
  });

  return {
    retriever,
    model,
    memory
  }
}