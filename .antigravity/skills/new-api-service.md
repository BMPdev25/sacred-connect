# Skill: Create API Service

When creating any service file in services/:
1. Use the existing Axios instance from api/index.ts — never create a new one
2. Every function is async and has try/catch
3. Functions return typed responses — define the TypeScript interface above the function
4. No business logic in service functions — only HTTP calls and response mapping
5. Group related calls in one service file (e.g., bookingService.ts for all booking calls)
6. Export individual named functions, not a class
7. Add JSDoc to every exported function with @param and @returns