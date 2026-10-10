# SevaConnect

SevaConnect is a prototype that helps people explore Indian government schemes, understand possible next steps, and find official application links. It is not a government service and does not decide final eligibility.

## What visitors can do

- Search and browse schemes by state or category.
- Create a profile to get more relevant scheme suggestions. The profile is saved in the current browser.
- Ask SevaConnect AI to explain a scheme, either from the catalogue or from the assistant's suggestions.
- Explore other suggested schemes and ask follow-up questions in English, Hindi, or Hinglish.

The profile asks for basic details such as state, age, occupation, education, and social category. Optional farmer or business questions appear when relevant.

## How it works

The website sends requests to a server, which reads scheme information from MongoDB. A rules-based eligibility engine compares profile details with available scheme rules. The AI uses scheme information to explain results in simpler language; it does not make the final eligibility decision.

The catalogue includes a study dataset alongside curated schemes. Some records have not been independently checked, so visitors should confirm details with the linked official source.

## Run locally

1. Install dependencies from the project folder:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project folder with your MongoDB connection and JWT secret:

   ```env
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-private-random-secret
   ```

   To use Ollama Cloud for AI responses, also add:

   ```env
   AI_PROVIDER=auto
   OLLAMA_ENABLED=true
   OLLAMA_API_KEY=your-ollama-api-key
   ```

3. Start the website and server:

   ```bash
   npm run dev
   ```

   Open http://localhost:5173. The API runs at http://localhost:5000.

## Admin scheme management

The admin page is at http://localhost:5173/admin. There is no public admin sign-up. Create an admin account from the project folder with:

```bash
npm run admin:create --workspace server
```

Then sign in on the admin page to add or edit catalogue schemes.

## Suggested demo

1. Search for a scheme and open its details.
2. Choose **Ask SevaConnect AI** to get an explanation using the saved profile.
3. Open **Explore other schemes for my profile** and select another suggestion.
4. Show the admin page and explain how schemes are managed.

Always describe scheme suggestions as guidance. The relevant government authority makes the final eligibility and approval decisions.
