# Supabase Setup Guide for Stock Copilot

This guide will help you set up Supabase as the backend for your Stock Copilot application.

## 🚀 **Quick Start**

### 1. **Create Supabase Project**

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `stock-copilot`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
6. Click "Create new project"

### 2. **Get Project Credentials**

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Anon Key** (public key)
   - **Service Role Key** (secret key)

### 3. **Set Environment Variables**

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# AI Services (Optional - for Edge Functions)
TOGETHER_AI_API_KEY=your_together_ai_api_key
OPENAI_API_KEY=your_openai_api_key

# Stock Data APIs (Optional)
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
IEX_CLOUD_API_KEY=your_iex_cloud_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. **Set Up Database Schema**

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase/schema.sql`
3. Paste and run the SQL script
4. This will create all necessary tables, indexes, and RLS policies

### 5. **Configure Authentication**

1. Go to **Authentication** → **Settings**
2. Configure the following:

**Site URL**: `http://localhost:3000` (for development)
**Redirect URLs**: 
- `http://localhost:3000/auth/callback`
- `https://your-domain.com/auth/callback`

**Email Settings**:
- Enable email confirmations
- Configure email templates
- Set up SMTP (optional)

### 6. **Deploy Edge Functions (Optional)**

If you want to use the AI prediction and chat functions:

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

4. Deploy functions:
```bash
supabase functions deploy ai-prediction
supabase functions deploy ai-chat
```

5. Set function secrets:
```bash
supabase secrets set TOGETHER_AI_API_KEY=your_key_here
supabase secrets set OPENAI_API_KEY=your_key_here
```

## 🗄️ **Database Schema Overview**

### **Core Tables**

- **users** - User profiles and authentication
- **portfolios** - User investment portfolios
- **portfolio_holdings** - Individual stock holdings
- **transactions** - Buy/sell transaction history
- **predictions** - AI-generated stock predictions
- **chat_sessions** - Chat conversation sessions
- **chat_messages** - Individual chat messages
- **watchlists** - User stock watchlists
- **notifications** - User notifications and alerts

### **Market Data Tables**

- **stock_data** - Historical stock price data
- **market_indices** - Market index information
- **technical_indicators** - Calculated technical indicators

### **Security Features**

- **Row Level Security (RLS)** enabled on all user tables
- **JWT-based authentication** for API access
- **User-specific data isolation** - users can only access their own data
- **Public read access** for market data

## 🔐 **Authentication Flow**

### **User Registration**
1. User signs up with email/password
2. Supabase creates user account
3. User profile created in `users` table
4. Email verification sent (if enabled)

### **User Login**
1. User enters credentials
2. Supabase validates and returns JWT token
3. Token stored in browser for API requests
4. User redirected to dashboard

### **API Requests**
1. Frontend sends JWT token in Authorization header
2. Supabase validates token and extracts user ID
3. RLS policies ensure user only accesses their data
4. Response returned with user-specific data

## 📊 **Real-time Features**

### **Live Data Updates**
- Stock prices update in real-time
- Portfolio values recalculate automatically
- Market indices refresh every minute
- Chat messages appear instantly

### **WebSocket Subscriptions**
```typescript
// Example: Subscribe to portfolio changes
const subscription = supabase
  .channel('portfolio_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'portfolios',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('Portfolio updated:', payload)
  })
  .subscribe()
```

## 🚀 **Deployment**

### **Frontend Deployment (Vercel)**
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### **Database Migration**
1. Use Supabase dashboard for schema changes
2. Or use Supabase CLI for version control:
```bash
supabase db diff --schema public
supabase db push
```

### **Edge Functions Deployment**
```bash
supabase functions deploy --project-ref your-project-ref
```

## 🔧 **Development Tools**

### **Supabase Dashboard**
- **Table Editor** - View and edit data
- **SQL Editor** - Run custom queries
- **API Docs** - Auto-generated API documentation
- **Logs** - Monitor function and database activity

### **Local Development**
```bash
# Start local Supabase (optional)
supabase start

# Run migrations
supabase db reset

# Deploy functions locally
supabase functions serve
```

## 📈 **Performance Optimization**

### **Database Indexes**
- All foreign keys indexed
- Frequently queried columns indexed
- Composite indexes for complex queries

### **Caching Strategy**
- Stock data cached for 5 minutes
- Market indices cached for 1 minute
- User data cached in React state

### **Query Optimization**
- Use select() to limit returned columns
- Implement pagination for large datasets
- Use real-time subscriptions instead of polling

## 🛡️ **Security Best Practices**

### **Row Level Security**
- All user tables protected by RLS
- Policies ensure data isolation
- Service role key only used server-side

### **API Security**
- JWT tokens expire automatically
- Rate limiting on Edge Functions
- Input validation on all endpoints

### **Data Privacy**
- No sensitive data in client-side code
- User data encrypted at rest
- GDPR compliance built-in

## 🐛 **Troubleshooting**

### **Common Issues**

1. **Authentication not working**
   - Check environment variables
   - Verify redirect URLs
   - Check browser console for errors

2. **Database connection failed**
   - Verify DATABASE_URL
   - Check network connectivity
   - Verify RLS policies

3. **Real-time not working**
   - Check WebSocket connection
   - Verify subscription filters
   - Check browser WebSocket support

### **Debug Mode**
```typescript
// Enable debug logging
const supabase = createClient(url, key, {
  auth: {
    debug: true
  }
})
```

## 📚 **Additional Resources**

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js with Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)

## 🎯 **Next Steps**

1. **Set up your Supabase project** following this guide
2. **Configure environment variables** in your `.env.local`
3. **Run the database schema** in SQL Editor
4. **Test authentication** by running the app
5. **Deploy Edge Functions** for AI features
6. **Configure real-time subscriptions** for live updates

Your Stock Copilot app is now ready with a powerful Supabase backend! 🚀
