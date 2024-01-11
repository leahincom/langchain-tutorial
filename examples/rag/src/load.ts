import 'dotenv/config'
import { NotionLoader } from 'langchain/document_loaders/fs/notion';
import { MarkdownTextSplitter } from 'langchain/text_splitter';

export const markdownLoader = async () => {
  const REPO_PATH = "/Users/lea/git/langchain-tutorial/examples/rag/docs";
  
  const loader = new NotionLoader(REPO_PATH);
  const docs = await loader.load();
  
  const markdownSplitter = MarkdownTextSplitter.fromLanguage("markdown");
  const texts = await markdownSplitter.splitDocuments(docs);
  
  console.log(texts)
  console.log("Loaded ", texts.length, " documents.");

  return texts;
}
