import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  AIMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "langchain/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { formatDocumentsAsString } from "langchain/util/document";
import { BaseMessage } from "langchain/schema";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {markdownRetriever} from "./retrieval.js"

export const markdownChaining = async () => {
  const questionGeneratorTemplate = ChatPromptTemplate.fromMessages([
    AIMessagePromptTemplate.fromTemplate(
      "Given the following conversation about a codebase and a follow up question, rephrase the follow up question to be a standalone question."
    ),
    new MessagesPlaceholder("chat_history"),
    AIMessagePromptTemplate.fromTemplate(`Follow Up Input: {question}
  Standalone question:`),
  ]);

  const combineDocumentsPrompt = ChatPromptTemplate.fromMessages([
    AIMessagePromptTemplate.fromTemplate(
      "Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.\n\n{context}\n\n"
    ),
    new MessagesPlaceholder("chat_history"),
    HumanMessagePromptTemplate.fromTemplate("Question: {question}"),
  ]);

  const { retriever, model, memory } = await markdownRetriever()

  const combineDocumentsChain = RunnableSequence.from([
    {
      question: (output: string) => output,
      chat_history: async () => {
        const { chat_history } = await memory.loadMemoryVariables({});
        return chat_history;
      },
      context: async (output: string) => {
        const relevantDocs = await retriever.getRelevantDocuments(output);
        return formatDocumentsAsString(relevantDocs);
      },
    },
    combineDocumentsPrompt,
    model,
    new StringOutputParser(),
  ]);

  const conversationalQaChain = RunnableSequence.from([
    {
      question: (i: { question: string }) => i.question,
      chat_history: async () => {
        const { chat_history } = await memory.loadMemoryVariables({});
        return chat_history;
      },
    },
    questionGeneratorTemplate,
    model,
    new StringOutputParser(),
    combineDocumentsChain,
  ]);

  const question = "what is stackflow in detail?";
  const result = await conversationalQaChain.invoke({
    question,
  });

  await memory.saveContext(
    {
      input: question,
    },
    {
      output: result,
    }
  );

  console.log(`This is result: ${result}`);
}