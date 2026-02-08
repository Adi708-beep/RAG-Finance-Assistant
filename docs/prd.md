# RAG-Driven Personal & Family Finance Assistant Requirements Document

## 1. Application Overview

### 1.1 Application Name
RAG-Driven Personal & Family Finance Assistant

### 1.2 Application Description
A production-ready fintech web application that enables users to upload financial documents, track expenses, set monthly/yearly budget goals, manage personal or family income, and interact with a finance-only AI assistant powered by Google Gemini API using Retrieval-Augmented Generation (RAG) architecture. The application now includes an integrated demo payment system for simulating transactions.

### 1.3 Application Type
Full-stack web application with responsive design (desktop + mobile)

## 2. Core Features

### 2.1 User Authentication & Modes
- Secure sign-up and login system
- User-isolated financial data
- Two user modes:
  - Personal Mode: single income user
  - Family Mode: multiple earning members with combined household income
- Mode switching capability from settings

### 2.2 Chat Interface
- WhatsApp-style chat UI
- Text input with send button
- Chat history preserved per user
- Finance-only responses from AI
- Clear rejection message for non-financial queries: I'm designed to assist only with personal finance, budgeting, and expense-tracking questions.
- AI can read and analyze all payment transactions made through the integrated payment app

### 2.3 Document Upload System
- Upload receipts and bank statements (PDF/image/CSV)
- Extract transaction data:
  - Amount
  - Date
  - Merchant
  - Category
- Store structured transaction data

### 2.4 Salary & Income Setup
**Personal Mode:**
- Monthly or yearly salary input
- Manual entry OR AI-assisted chat input

**Family Mode:**
- Multiple earning members
- Individual income entries
- Auto-calculated combined income
- AI-assisted parsing example: I earn ₹50,000 and my spouse earns ₹30,000 per month
- User confirmation required before saving

### 2.5 Budget & Goal Setting
- Create monthly or yearly budgets
- Category-wise allocation:
  - Rent
  - Groceries
  - Transport
  - Entertainment
  - Savings
  - Emergency fund
- Budget creation modes:
  - Manual Mode: user enters amounts or percentages
  - AI-Assisted Mode: AI suggests budget based on salary and past expenses (user approval required)

### 2.6 Budget Dashboard
- Total income overview
- Budget allocations display
- Actual spending vs target comparison
- Progress bars per category
- Remaining balance
- Real-time updates after each payment transaction

### 2.7 Real-Time Expense Tracking
- Automatic categorization of new transactions
- Live budget usage updates
- Anomaly detection
- Real-time synchronization with payment app transactions

### 2.8 Alerts & Notifications
Trigger alerts for:
- 80% budget usage
- Budget exceeded
- Unusual spending spikes
- Alerts must be informative and neutral

### 2.9 Integrated Demo Payment System
**Payment Button:**
- Pay button displayed on transaction page
- Clicking opens integrated demo payment app interface

**Demo Payment App Features:**
- Google Pay-style interface
- Pre-loaded default merchant options (shops, services, utilities)
- Custom merchant entry option
- Amount input field
- Payment category selection
- Instant payment confirmation

**Payment Processing:**
- Deduct payment amount from allocated salary/budget
- Automatic categorization of payment
- Real-time update of:
  - Total remaining budget
  - Category-wise spending
  - Transaction history
  - Dashboard numbers
  - All financial metrics across the application

**Transaction Integration:**
- All payments automatically recorded in transaction page
- Transaction details include:
  - Merchant name
  - Amount
  - Date and time
  - Category
  - Payment method (Demo Payment App)
- Transaction history visible and sortable
- AI chatbot can read and analyze all payment app transactions

**Real-Time Updates:**
- Instant synchronization across all pages
- Budget dashboard updates immediately
- Category allocations reflect new spending
- Remaining balance recalculated
- All numerical displays updated throughout the application

## 3. AI Engine Requirements

### 3.1 AI Model
- Google Gemini (gemini-3-flash-preview)
- API-based access (no model training)
- API key loaded from environment variables

### 3.2 AI Role
**AI Must:**
- Explain financial data
- Summarize spending
- Compare actual expenses vs budget
- Suggest budget plans (advisory only)
- Read and analyze transactions from the integrated payment app

**AI Must NOT:**
- Answer non-financial questions
- Provide investment guarantees
- Give legal or tax evasion advice
- Respond without retrieved data

### 3.3 Domain Restriction (Mandatory)
If user asks anything outside finance, respond exactly: I'm designed to assist only with personal finance, budgeting, and expense-tracking questions.

### 3.4 Allowed AI Queries
- How much did I spend on groceries this month?
- Am I overspending compared to my budget?
- Create a monthly budget plan for me
- Is there unusual activity this week?
- What payments did I make through the payment app today?
- Show me my recent transactions from the payment app

### 3.5 Disallowed AI Queries
- Stock tips
- Investment guarantees
- Political or general questions
- Legal or tax evasion advice

## 4. RAG Architecture

### 4.1 Retrieval Sources
- Uploaded receipts
- Transaction history
- Budget goals
- Financial rules
- Payment app transaction records

### 4.2 Response Flow
1. Classify query as financial
2. Retrieve relevant data (including payment app transactions)
3. Perform calculations in backend
4. Inject facts into Gemini prompt
5. Gemini explains results

### 4.3 RAG Behavior
- AI answers based on:
  - Retrieved user transactions
  - Uploaded documents
  - Budget goals
  - Financial rules
  - Payment app transaction history
- AI must NOT guess or hallucinate numbers

## 5. Backend & Data Structure

### 5.1 Data Storage
- User profiles
- Family members
- Income records
- Transactions
- Uploaded documents
- Budget goals
- Alerts
- Payment app transaction records

### 5.2 Data Rules
- All financial calculations done by backend logic
- AI only explains results
- No cross-user data access
- Real-time synchronization of payment transactions across all components

## 6. Security & Compliance

### 6.1 Security Measures
- API keys via environment variables only
- No sensitive data exposed in responses
- Mask sensitive data in responses
- Enforce user data isolation

### 6.2 Disclaimer
Clear disclaimer must be displayed: This assistant provides budgeting insights only and does not offer investment or legal advice. The integrated payment system is a demo feature for simulation purposes only.

### 6.3 Compliance
- No financial guarantees
- No investment or legal advice

## 7. UI/UX Requirements

### 7.1 Design Reference
Use the design shown in image.png as the exact visual reference for the application interface.

### 7.2 Design Style
- Modern fintech theme
- Soft colors, clean typography
- Responsive layout
- Maintain existing UI design and visual consistency

### 7.3 Layout Structure
Clear separation between:
- Chat interface
- Budget management
- Dashboard
- Transaction page with integrated payment button
- Demo payment app interface

### 7.4 User Experience
- Smooth transitions and animations
- Intuitive navigation
- Clear visual hierarchy
- Seamless payment flow
- Instant feedback on payment completion
- Real-time numerical updates across all pages

## 8. Preservation Requirements

### 8.1 Existing Functionalities
All current features, UI design, and chatbot functionalities must remain unchanged and fully operational:
- User authentication and mode switching
- Document upload system
- Salary and income setup
- Budget and goal setting
- Budget dashboard
- Expense tracking
- Alerts and notifications
- AI chat interface and responses
- Existing transaction management

### 8.2 Enhancement Focus
The integrated payment system is an addition that enhances the existing application without modifying or removing any current capabilities.