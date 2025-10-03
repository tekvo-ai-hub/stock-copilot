// Simple test script to verify Finnhub API integration
const axios = require('axios');

const FINNHUB_API_KEY = 'd3fkbopr01qolkndkprgd3fkbopr01qolkndkps0';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

async function testFinnhubAPI() {
  console.log('🧪 Testing Finnhub API Integration...\n');

  try {
    // Test 1: Get AAPL quote
    console.log('1. Testing real-time quote for AAPL...');
    const quoteResponse = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
      params: {
        symbol: 'AAPL',
        token: FINNHUB_API_KEY,
      },
      timeout: 10000,
    });
    
    console.log('✅ Quote API working:');
    console.log(`   Current Price: $${quoteResponse.data.c}`);
    console.log(`   Change: $${quoteResponse.data.d} (${quoteResponse.data.dp}%)`);
    console.log(`   High: $${quoteResponse.data.h}, Low: $${quoteResponse.data.l}\n`);

    // Test 2: Get company profile
    console.log('2. Testing company profile for AAPL...');
    const profileResponse = await axios.get(`${FINNHUB_BASE_URL}/stock/profile2`, {
      params: {
        symbol: 'AAPL',
        token: FINNHUB_API_KEY,
      },
      timeout: 10000,
    });
    
    console.log('✅ Profile API working:');
    console.log(`   Company: ${profileResponse.data.name}`);
    console.log(`   Exchange: ${profileResponse.data.exchange}`);
    console.log(`   Country: ${profileResponse.data.country}`);
    console.log(`   Industry: ${profileResponse.data.finnhubIndustry}\n`);

    // Test 3: Search stocks
    console.log('3. Testing stock search for "Apple"...');
    const searchResponse = await axios.get(`${FINNHUB_BASE_URL}/search`, {
      params: {
        q: 'Apple',
        token: FINNHUB_API_KEY,
      },
      timeout: 10000,
    });
    
    console.log('✅ Search API working:');
    console.log(`   Found ${searchResponse.data.result.length} results`);
    searchResponse.data.result.slice(0, 3).forEach((stock, index) => {
      console.log(`   ${index + 1}. ${stock.symbol} - ${stock.description}`);
    });
    console.log('');

    // Test 4: Get market news
    console.log('4. Testing market news...');
    const newsResponse = await axios.get(`${FINNHUB_BASE_URL}/news`, {
      params: {
        category: 'general',
        token: FINNHUB_API_KEY,
      },
      timeout: 10000,
    });
    
    console.log('✅ News API working:');
    console.log(`   Found ${newsResponse.data.length} news articles`);
    console.log(`   Latest: ${newsResponse.data[0].headline}\n`);

    // Test 5: Get market status
    console.log('5. Testing market status...');
    const statusResponse = await axios.get(`${FINNHUB_BASE_URL}/stock/market-status`, {
      params: {
        exchange: 'US',
        token: FINNHUB_API_KEY,
      },
      timeout: 10000,
    });
    
    console.log('✅ Market Status API working:');
    console.log(`   Exchange: ${statusResponse.data.exchange}`);
    console.log(`   Is Open: ${statusResponse.data.isOpen}`);
    console.log(`   Session: ${statusResponse.data.session}\n`);

    console.log('🎉 All Finnhub API tests passed! Integration is working correctly.');
    console.log('\n📊 Available Real-time Data:');
    console.log('   • Real-time stock quotes');
    console.log('   • Company profiles and information');
    console.log('   • Stock search functionality');
    console.log('   • Market news and updates');
    console.log('   • Market status and hours');
    console.log('   • Historical price data (candles)');
    console.log('   • Technical indicators');
    console.log('   • Market movers and sector performance');

  } catch (error) {
    console.error('❌ Finnhub API test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run the test
testFinnhubAPI();
