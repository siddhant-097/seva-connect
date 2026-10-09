import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });

const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: Number(process.env.PORT) || 5000,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sevaconnect',
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
    JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
    JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    GROQ_API_KEY: process.env.GROQ_API_KEY || '',
    GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    AI_PROVIDER: process.env.AI_PROVIDER || 'auto', // 'ollama' | 'groq' | 'gemini' | 'openai' | 'builtin' | 'auto'
    OLLAMA_ENABLED: process.env.OLLAMA_ENABLED === 'true',
    OLLAMA_API_KEY: process.env.OLLAMA_API_KEY || '',
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'https://ollama.com/api',
    OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'gpt-oss:20b-cloud',
    QDRANT_URL: process.env.QDRANT_URL || '',
    QDRANT_API_KEY: process.env.QDRANT_API_KEY || '',
};

export default env;
