/**
 * TypeScript usage example for MemU JavaScript SDK
 * 
 * This example demonstrates how to use the SDK with full TypeScript support
 */

import {
  MemuClient,
  MemuClientConfig,
  MemorizeResponse,
  MemorizeTaskStatusResponse,
  DefaultCategoriesResponse,
  RelatedMemoryItemsResponse,
  RelatedClusteredCategoriesResponse,
  MemuAPIException,
  MemuValidationException,
  MemuAuthenticationException,
  MemuConnectionException
} from '@memu/sdk-javascript';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function typescriptExample(): Promise<void> {
  // Initialize client with typed configuration
  const config: MemuClientConfig = {
    baseUrl: process.env.MEMU_API_BASE_URL || 'https://api.memu.ai',
    apiKey: process.env.MEMU_API_KEY || 'your-api-key-here',
    timeout: 30000,
    maxRetries: 3
  };

  const client = new MemuClient(config);

  try {
    console.log('🚀 Starting TypeScript MemU SDK example...\n');

    // Example 1: Typed conversation messages
    const conversation: ConversationMessage[] = [
      { role: 'user', content: 'I want to learn about machine learning.' },
      { role: 'assistant', content: 'Great! Machine learning is a subset of AI that enables computers to learn and make decisions from data.' }
    ];

    console.log('🤖 Memorizing ML conversation...');
    const memorizeResponse: MemorizeResponse = await client.memorizeConversation(
      conversation,
      'student_456',
      'Bob Smith',
      'ml_tutor',
      'ML Tutor'
    );

    console.log(`✅ Task ID: ${memorizeResponse.taskId}`);
    console.log(`   Status: ${memorizeResponse.status}\n`);

    // Example 2: Polling task status with proper typing
    console.log('⏳ Polling task status...');
    let taskStatus: MemorizeTaskStatusResponse;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      await new Promise(resolve => setTimeout(resolve, 2000));
      taskStatus = await client.getTaskStatus(memorizeResponse.taskId);
      attempts++;
      
      console.log(`   Attempt ${attempts}: ${taskStatus.status}`);
      
      if (taskStatus.progress) {
        console.log(`   Progress: ${JSON.stringify(taskStatus.progress)}`);
      }
    } while (
      taskStatus.status === 'PENDING' && 
      attempts < maxAttempts
    );

    if (taskStatus.status === 'SUCCESS') {
      console.log('✅ Memorization completed successfully!');
      if (taskStatus.detailInfo) {
        console.log(`   Detail: ${taskStatus.detailInfo}`);
      }
    } else if (taskStatus.status === 'FAILURE') {
      console.log('❌ Memorization failed!');
      if (taskStatus.detailInfo) {
        console.log(`   Detail: ${taskStatus.detailInfo}`);
      }
    }
    console.log();

    // Example 3: Retrieve categories with full typing
    console.log('📂 Retrieving default categories...');
    const categoriesResponse: DefaultCategoriesResponse = await client.retrieveDefaultCategories({
      userId: 'student_456',
      agentId: 'ml_tutor',
      includeInactive: false
    });

    console.log(`   Total categories: ${categoriesResponse.totalCategories}`);
    
    categoriesResponse.categories.forEach((category, index) => {
      console.log(`   ${index + 1}. ${category.name}`);
      console.log(`      Type: ${category.type}`);
      console.log(`      Description: ${category.description}`);
      console.log(`      Memories: ${category.memoryCount}`);
      console.log(`      Active: ${category.isActive}`);
    });
    console.log();

    // Example 4: Search memories with type safety
    console.log('🔍 Searching for ML-related memories...');
    const searchResponse: RelatedMemoryItemsResponse = await client.retrieveRelatedMemoryItems({
      userId: 'student_456',
      agentId: 'ml_tutor',
      query: 'machine learning algorithms',
      topK: 5,
      minSimilarity: 0.3,
      includeCategories: ['learning', 'technology']
    });

    console.log(`🎯 Query: "${searchResponse.query}"`);
    console.log(`   Total found: ${searchResponse.totalFound}`);
    console.log(`   Search params: ${JSON.stringify(searchResponse.searchParams)}`);

    searchResponse.relatedMemories.forEach((relatedMemory, index) => {
      const { memory, similarityScore } = relatedMemory;
      console.log(`   ${index + 1}. Score: ${similarityScore.toFixed(3)}`);
      console.log(`      ID: ${memory.memoryId}`);
      console.log(`      Category: ${memory.category}`);
      console.log(`      Content: ${memory.content.substring(0, 100)}...`);
      console.log(`      Created: ${memory.createdAt}`);
      console.log(`      Updated: ${memory.updatedAt}`);
    });
    console.log();

    // Example 5: Clustered categories search
    console.log('🗂️ Searching clustered categories...');
    const clustersResponse: RelatedClusteredCategoriesResponse = 
      await client.retrieveRelatedClusteredCategories({
        userId: 'student_456',
        agentId: 'ml_tutor',
        categoryQuery: 'artificial intelligence',
        topK: 3,
        minSimilarity: 0.4
      });

    console.log(`📚 Category query: "${clustersResponse.categoryQuery}"`);
    console.log(`   Categories found: ${clustersResponse.totalCategoriesFound}`);

    clustersResponse.clusteredCategories.forEach((cluster, index) => {
      console.log(`   ${index + 1}. ${cluster.name}`);
      console.log(`      Similarity: ${cluster.similarityScore.toFixed(3)}`);
      console.log(`      Memory count: ${cluster.memoryCount}`);
      
      // Show first few memories in the cluster
      cluster.memories.slice(0, 2).forEach((memory, memIndex) => {
        console.log(`      Memory ${memIndex + 1}: ${memory.content.substring(0, 60)}...`);
      });
    });

    console.log('\n✨ TypeScript example completed successfully!');

  } catch (error) {
    console.error('❌ Error occurred:');
    
    // Type-safe error handling
    if (error instanceof MemuValidationException) {
      console.error(`   Validation Error: ${error.message}`);
      console.error(`   Status Code: ${error.statusCode}`);
      if (error.responseData) {
        console.error(`   Response Data: ${JSON.stringify(error.responseData, null, 2)}`);
      }
    } else if (error instanceof MemuAuthenticationException) {
      console.error(`   Authentication Error: ${error.message}`);
      console.error(`   Status Code: ${error.statusCode}`);
    } else if (error instanceof MemuConnectionException) {
      console.error(`   Connection Error: ${error.message}`);
    } else if (error instanceof MemuAPIException) {
      console.error(`   API Error: ${error.message}`);
      console.error(`   Status Code: ${error.statusCode}`);
      if (error.responseData) {
        console.error(`   Response Data: ${JSON.stringify(error.responseData, null, 2)}`);
      }
    } else {
      console.error(`   Unknown Error: ${error}`);
    }
  }
}

// Utility function to demonstrate type inference
async function memorySearchHelper(
  client: MemuClient,
  userId: string,
  query: string,
  options?: {
    agentId?: string;
    topK?: number;
    minSimilarity?: number;
  }
): Promise<number> {
  const response = await client.retrieveRelatedMemoryItems({
    userId,
    query,
    agentId: options?.agentId,
    topK: options?.topK || 10,
    minSimilarity: options?.minSimilarity || 0.3
  });

  return response.totalFound;
}

// Export for use in other modules
export { typescriptExample, memorySearchHelper };

// Run if this file is executed directly
if (require.main === module) {
  typescriptExample().catch(console.error);
}
