# Skill: Create Redux Slice

When creating a new Redux slice:
1. One slice per domain (auth, user, devotee, priest, booking)
2. Use createAsyncThunk for all async actions — never put API calls in reducers
3. Handle all three async states in extraReducers: pending, fulfilled, rejected
4. Keep state shape flat — no deeply nested objects
5. Define TypeScript interface for the state above the slice
6. Export actions and reducer separately