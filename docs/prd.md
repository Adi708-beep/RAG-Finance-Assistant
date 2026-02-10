# RAG-Driven Personal & Family Finance Assistant Requirements Document

## 1. Application Overview

### 1.1 Application Name
RupeeWise – AI-Powered Personal & Family Finance Assistant

### 1.2 Application Description
A production-ready fintech web application that enables users to upload financial documents, track expenses, set monthly/yearly budget goals, manage personal or family income, and interact with a finance-only AI assistant powered by Google Gemini API using Retrieval-Augmented Generation (RAG) architecture. The application includes an integrated demo payment system for simulating transactions and a comprehensive landing page.

### 1.3 Application Type
Full-stack web application with responsive design (desktop + mobile)

## 2. Landing Page

### 2.1 Landing Page Purpose
Create a modern, trustworthy fintech landing page that explains the product, how it works, and why it is useful for Indian users. The page should clearly communicate features, benefits, and compliance-safe AI usage, and encourage users to sign up or try the app.

### 2.2 Target Audience
- Indian working professionals
- Families managing household expenses
- Students & early earners
- People who want budgeting help without spreadsheets

### 2.3 Design & UI Style
**Design Reference:**
- Use image.png as the exact visual reference for landing page design
- Match colors, fonts, and overall style from image.png precisely
- Maintain the layout structure and visual hierarchy shown in the reference image
- Apply professional fading effects and transitions as demonstrated in the reference

**Color Palette:**
- Extract and replicate the exact color scheme from image.png
- Maintain consistency with purple/violet accent colors
- Use white and light backgrounds as shown in reference

**Typography:**
- Match font families, sizes, and weights from image.png as closely as possible
- Maintain text hierarchy and spacing

**Visual Elements:**
- Clean fintech aesthetic matching reference design
- Smooth scroll animations
- Fully responsive (mobile-first)
- Trust-focused design (no clutter)

### 2.4 Landing Page Structure

#### 2.4.1 Hero Section (Above the Fold)
**Layout Reference:**
- Follow the exact layout structure shown in image.png
- Position elements according to reference design

**Background Image:**
- Use image-2.png as the background image for the hero section
- Position the background image beneath the heading text
- Apply professional fading effect to image-2.png:
  - Gradient overlay from solid color at top to transparent
  - Smooth transition that doesn't obscure text readability
  - Blend the image naturally with the page background
  - Ensure text remains clearly visible and legible

**Headline (Big & Bold):**
Manage Your Money Smarter with AI — Built for India 🇮🇳

**Subheading:**
Track expenses, set budgets, and plan your monthly or family finances using AI powered by your real spending data — not guesses.

**Key Highlights (Icons):**
- AI-assisted budgeting
- Personal & family expense planning
- Receipt uploads & smart insights
- Finance-only, privacy-focused AI

**Primary CTA Button:**
👉 Get Started Free

**Secondary CTA:**
👉 See How It Works

**Sign In and Sign Up Buttons:**
- Sign In button
- Sign Up button

#### 2.4.2 Problem Statement Section
**Title:**
Why Managing Money Is Hard

**Content:**
Explain common pain points:
- No clear idea where money goes
- Manual tracking is tiring
- Hard to plan monthly expenses
- Family finances get confusing
- Apps don't explain why you overspend

Tone: empathetic, Indian context.

#### 2.4.3 Solution Section
**Title:**
One AI Assistant. Complete Financial Clarity.

**Explanation:**
Describe how the platform solves these problems using:
- Real transaction data
- Uploaded receipts
- Budget goals
- AI explanations (not automation)

Make it clear:
The AI helps you understand and plan — you stay in control.

#### 2.4.4 Key Features Section (Detailed)

**Feature 1: AI Finance Assistant (Chat-Based)**
- Ask questions like:
  - How much did I spend on groceries?
  - Am I overspending this month?
- AI answers using your actual data
- Finance-only responses (no irrelevant topics)

**Feature 2: Receipt & Statement Upload**
- Upload receipts, bills, and bank statements
- Automatic extraction of:
  - Amount
  - Date
  - Category
- Everything stays private and secure

**Feature 3: Personal & Family Budgeting**
- Choose:
  - Personal mode (single income)
  - Family mode (combined household income)
- Add multiple earners
- Track shared expenses easily

**Feature 4: Salary-Based Budget Planning**
- Enter your monthly or yearly salary
- Manually set budgets OR
- Let AI suggest a realistic plan
- You always approve before saving

**Feature 5: Indian Market-Aware Budgeting**
- Budget suggestions based on:
  - Indian cost-of-living ranges
  - City-based expense patterns
  - Your past spending habits
- No fake live prices — only realistic averages

**Feature 6: Smart Alerts & Insights**
- Get notified when:
  - You reach 80% of a budget
  - Spending spikes unusually
- Clear, friendly alerts — no pressure

#### 2.4.5 How It Works (Step-by-Step)
- Step 1: Sign up & choose Personal or Family mode
- Step 2: Upload receipts or add income
- Step 3: Set your monthly or yearly budget
- Step 4: Ask the AI & track progress
- Step 5: Improve spending with insights

Use icons or numbered cards.

#### 2.4.6 Trust, Privacy & Compliance Section
**Title:**
Your Data. Your Control.

**Include points:**
- Finance-only AI (no unrelated questions)
- No investment or legal advice
- Your data is private & isolated
- AI explains — it doesn't decide for you

**Add a small disclaimer:**
This platform provides budgeting insights only and does not offer investment or legal advice.

#### 2.4.7 Call to Action Section
**Headline:**
Take Control of Your Money — Starting Today

**Buttons:**
- Get Started Free
- Try the AI Assistant

#### 2.4.8 Footer (Mandatory)

**Footer Sections:**

**Product**
- Features
- How It Works
- Pricing (optional placeholder)

**Company**
- About
- Contact
- Careers (optional)

**Legal**
- Privacy Policy
- Terms of Service
- Disclaimer

**Social / Info**
- GitHub (if open-source)
- LinkedIn
- Email support

**Footer bottom text:**
© 2026 RupeeWise. Built for smarter financial decisions in India.

## 3. Core Features

### 3.1 User Authentication & Modes
- Secure sign-up and login system
- User-isolated financial data
- Two user modes:
  - Personal Mode: single income user
  - Family Mode: multiple earning members with combined household income
- Mode switching capability from settings

### 3.2 Chat Interface
- WhatsApp-style chat UI
- Text input with send button
- Chat history preserved per user
- Finance-only responses from AI
- Clear rejection message for non-financial queries: I'm designed to assist only with personal finance, budgeting, and expense-tracking questions.
- AI can read and analyze all payment transactions made through the integrated payment app
- **Clear Chat Button**: Small, clearly visible button in the chatbot interface that completely erases all chat history and context when clicked

### 3.3 Document Upload System
- Upload receipts and bank statements (PDF/image/CSV)
- Extract transaction data:
  - Amount
  - Date
  - Merchant
  - Category
- Store structured transaction data

### 3.4 Salary & Income Setup
**Personal Mode:**
- Monthly or yearly salary input
- Manual entry OR AI-assisted chat input

**Family Mode:**
- Multiple earning members
- Individual income entries
- Auto-calculated combined income
- AI-assisted parsing example: I earn ₹50,000 and my spouse earns ₹30,000 per month
- User confirmation required before saving

### 3.5 Budget & Goal Setting
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

### 3.6 Budget Dashboard
- Total income overview
- Budget allocations display
- Actual spending vs target comparison
- Progress bars per category
- Remaining balance
- Real-time updates after each payment transaction

### 3.7 Real-Time Expense Tracking
- Automatic categorization of new transactions
- Live budget usage updates
- Anomaly detection
- Real-time synchronization with payment app transactions

### 3.8 Alerts & Notifications
Trigger alerts for:
- 80% budget usage
- Budget exceeded
- Unusual spending spikes
- Alerts must be informative and neutral

### 3.9 Integrated Demo Payment System
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

## 4. AI Engine Requirements

### 4.1 AI Model
- Google Gemini (gemini-3-flash-preview)
- API-based access (no model training)
- API key loaded from environment variables

### 4.2 AI Role
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

### 4.3 Domain Restriction (Mandatory)
If user asks anything outside finance, respond exactly: I'm designed to assist only with personal finance, budgeting, and expense-tracking questions.

### 4.4 Allowed AI Queries
- How much did I spend on groceries this month?
- Am I overspending compared to my budget?
- Create a monthly budget plan for me
- Is there unusual activity this week?
- What payments did I make through the payment app today?
- Show me my recent transactions from the payment app

### 4.5 Disallowed AI Queries
- Stock tips
- Investment guarantees
- Political or general questions
- Legal or tax evasion advice

## 5. RAG Architecture

### 5.1 Retrieval Sources
- Uploaded receipts
- Transaction history
- Budget goals
- Financial rules
- Payment app transaction records

### 5.2 Response Flow
1. Classify query as financial
2. Retrieve relevant data (including payment app transactions)
3. Perform calculations in backend
4. Inject facts into Gemini prompt
5. Gemini explains results

### 5.3 RAG Behavior
- AI answers based on:
  - Retrieved user transactions
  - Uploaded documents
  - Budget goals
  - Financial rules
  - Payment app transaction history
- AI must NOT guess or hallucinate numbers

## 6. Backend & Data Structure

### 6.1 Data Storage
- User profiles
- Family members
- Income records
- Transactions
- Uploaded documents
- Budget goals
- Alerts
- Payment app transaction records

### 6.2 Data Rules
- All financial calculations done by backend logic
- AI only explains results
- No cross-user data access
- Real-time synchronization of payment transactions across all components

## 7. Security & Compliance

### 7.1 Security Measures
- API keys via environment variables only
- No sensitive data exposed in responses
- Mask sensitive data in responses
- Enforce user data isolation

### 7.2 Disclaimer
Clear disclaimer must be displayed: This assistant provides budgeting insights only and does not offer investment or legal advice. The integrated payment system is a demo feature for simulation purposes only.

### 7.3 Compliance
- No financial guarantees
- No investment or legal advice

## 8. UI/UX Requirements

### 8.1 Design Reference
**All Application Pages UI Design:**
- Use image.png, image-2.png, and image-3.png as exact visual references for all internal application pages
- Match design elements, color scheme, typography, icons, and layout precisely across all pages
- Replicate visual hierarchy and spacing from reference images
- Apply color palette from image-3.png:
  - Primary: #E62DA9 (vibrant pink/magenta)
  - Secondary: #FEDC85 (soft yellow)
  - Background: #FFFFFF (white)
  - Dark text: #0D0C10 (near black)
  - Light background: soft purple/lavender tones
- Typography from image-2.png:
  - Font family: SF Pro Display
  - Font weights: Thin, Light, Regular, Medium, Bold
  - Match font sizes and hierarchy from reference
- Icons and visual elements:
  - Use icon styles shown in image.png
  - Maintain consistent icon design language
  - Ensure all icons are clearly visible
- Color visibility requirements:
  - All text must be clearly legible against backgrounds
  - No color overlapping that obscures content
  - Sufficient contrast ratios for all UI elements
  - All components (icons, text, buttons) must be fully visible
  - No design elements should be hidden or obscured by color choices

**Landing Page Design:**
- Maintain existing landing page design as previously specified
- Use image.png reference for landing page interface
- Preserve landing page color scheme and typography

### 8.2 Design Style
**All Application Pages:**
- Modern chat-based interface matching image.png reference
- Exact color replication from image-3.png color palette
- Typography matching image-2.png SF Pro Display font family
- Icon styles from image.png
- Responsive layout
- Professional transitions and animations
- Clean, uncluttered interface
- All UI elements clearly visible with proper contrast

**Landing Page:**
- Maintain existing design style as specified
- Soft colors, clean typography
- Responsive layout

### 8.3 Layout Structure
Clear separation between:
- Landing page (existing design preserved)
- Chat interface (updated to match image.png, image-2.png, image-3.png references)
- Budget management (updated to match image.png, image-2.png, image-3.png references)
- Dashboard (updated to match image.png, image-2.png, image-3.png references)
- Transaction page with integrated payment button (updated to match image.png, image-2.png, image-3.png references)
- Demo payment app interface (updated to match image.png, image-2.png, image-3.png references)
- All other application pages (updated to match image.png, image-2.png, image-3.png references)

### 8.4 User Experience
- Smooth transitions and animations
- Intuitive navigation
- Clear visual hierarchy
- Seamless payment flow
- Instant feedback on payment completion
- Real-time numerical updates across all pages
- Clear chat history deletion with confirmation

### 8.5 Mobile Navigation Enhancement
**Mobile Menu (Hamburger Menu):**
- Display a 3-dash bar icon in the top right corner on mobile devices
- On clicking the hamburger menu icon, display a dropdown or slide-out menu containing:
  - Account
  - Transactions
  - Sign Out
- Menu should overlay or push content smoothly
- Close menu on selection or outside click
- Maintain existing desktop navigation unchanged

## 9. Preservation Requirements

### 9.1 Existing Functionalities
All current features and chatbot functionalities must remain unchanged and fully operational:
- User authentication and mode switching
- Document upload system
- Salary and income setup
- Budget and goal setting
- Budget dashboard
- Expense tracking
- Alerts and notifications
- AI chat interface and responses
- Existing transaction management
- All working application pages and interfaces
- All backend logic and data processing
- All API integrations
- All security measures

### 9.2 Enhancement Focus
The following are improvements that enhance the existing application without modifying or removing any current capabilities:
- Clear chat button addition in chatbot interface
- UI design updates across all internal pages to match image.png, image-2.png, and image-3.png references
- Color palette updates to match image-3.png
- Typography updates to match image-2.png SF Pro Display
- Icon style updates to match image.png
- Improved color visibility and contrast across all components
- Mobile navigation menu enhancement
- Landing page design preserved as previously specified

### 9.3 Design Update Scope
- Update UI design, colors, fonts, and icons for all internal application pages
- Ensure all design changes maintain or improve usability
- Preserve all existing functionality during design updates
- Maintain responsive behavior across all devices
- Ensure all text, icons, and components remain clearly visible
- Prevent any color overlapping or visibility issues

## 10. Reference Files

1. Landing page design reference: image.png
2. Hero section background image: image-2.png
3. Application pages UI design reference: image.png
4. Typography reference: image-2.png
5. Color palette reference: image-3.png