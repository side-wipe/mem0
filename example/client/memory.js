import { MemuClient } from 'memu-js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeConversationShape(item) {
  // Accept multiple shapes and normalize to either string or array of { role, content }
  if (typeof item === 'string') return item;
  if (Array.isArray(item)) return item; // assume already [{ role, content }, ...]
  if (item && typeof item === 'object') {
    if (typeof item.conversation_text === 'string') return item.conversation_text;
    if (Array.isArray(item.conversation)) return item.conversation;
    if (Array.isArray(item.messages)) return item.messages;
  }
  // Fallback: stringify unknown structures
  return JSON.stringify(item);
}

async function loadConversationsFromJsonFile(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const data = JSON.parse(content);
  const list = Array.isArray(data) ? data : Array.isArray(data?.conversations) ? data.conversations : [];
  return list.map(normalizeConversationShape).filter((v) => v && (typeof v === 'string' || Array.isArray(v)));
}

async function waitForTaskCompletion(client, taskId) {
  // Poll task status until terminal state
  while (true) {
    const status = await client.getTaskStatus(taskId);
    console.log(`Task status: ${status.status}`);
    if (['SUCCESS', 'FAILURE', 'REVOKED'].includes(status.status)) break;
    await sleep(2000);
  }
}

async function main() {
  const client = new MemuClient({
    baseUrl: 'https://api.memu.so',
    apiKey: process.env.MEMU_API_KEY,
  });

  const USER_ID = 'user001';
  const USER_NAME = 'User 001';
  const AGENT_ID = 'assistant001';
  const AGENT_NAME = 'Assistant 001';

  const conversationFile = path.join(path.dirname(new URL(import.meta.url).pathname), 'conversation.json');
  const conversations = await loadConversationsFromJsonFile(conversationFile);

  if (!conversations.length) {
    console.log('No conversations loaded. Exiting.');
    if (typeof client.close === 'function') client.close();
    return;
  }

  console.log(`Processing ${conversations.length} English dialogues...`);

  for (let i = 0; i < conversations.length; i += 1) {
    const conversation = conversations[i];
    console.log(`\nProcessing dialogue ${i + 1}/${conversations.length}`);

    const memoResponse = await client.memorizeConversation(
      conversation, // string or [{ role, content }]
      USER_ID,
      USER_NAME,
      AGENT_ID,
      AGENT_NAME
    );

    console.log(`Saved! Task ID: ${memoResponse.taskId}`);
    await waitForTaskCompletion(client, memoResponse.taskId);
    console.log(`Dialogue ${i + 1} completed successfully!`);
  }

  console.log(`\nAll ${conversations.length} dialogues have been processed and saved to MemU!`);

  // Test recall
  console.log(`\nTesting memory recall...`);
  const memories = await client.retrieveRelatedMemoryItems({
    userId: USER_ID,
    query: 'hiking safety',
    topK: 3,
  });
  console.log(`Found ${memories.totalFound} memories`);
  for (const memoryItem of memories.relatedMemories || []) {
    const content = memoryItem?.memory?.content || '';
    console.log(`Memory: ${content.slice(0, 100)}...`);
  }

  // Retrieve default categories
  console.log('\nRetrieving default categories...');
  const defaultCategories = await client.retrieveDefaultCategories({
    userId: USER_ID,
    agentId: AGENT_ID,
    includeInactive: false,
  });
  console.log(`Found ${defaultCategories.totalCategories} default categories:`);
  for (const category of defaultCategories.categories || []) {
    console.log(`  - ${category.name}: ${category.description}`);
  }

  // Retrieve related clustered categories
  console.log("\nRetrieving related categories for 'outdoor activities'...");
  const relatedCategories = await client.retrieveRelatedClusteredCategories({
    userId: USER_ID,
    categoryQuery: 'outdoor activities',
    topK: 5,
    minSimilarity: 0.3,
  });

  const relatedCount = Array.isArray(relatedCategories.clusteredCategories)
    ? relatedCategories.clusteredCategories.length
    : (relatedCategories.totalCategoriesFound || 0);
  console.log(`Found ${relatedCount} related categories:`);
  for (const category of relatedCategories.clusteredCategories || []) {
    console.log(`  - ${category.name}`);
  }

  if (typeof client.close === 'function') client.close();
}

// Run
main().catch((err) => {
  console.error('Error running memory client:', err);
  process.exitCode = 1;
});