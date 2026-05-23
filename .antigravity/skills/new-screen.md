# Skill: Create New Screen

When creating any new screen:
1. Check AGENTS.md for the correct folder location
2. Import theme tokens from constants/theme.ts — no hardcoded values
3. Wrap in KeyboardAvoidingView if form is present
4. Use ScrollView if content may exceed screen height
5. Import images via AssetService, never with require()
6. Extract every logical unit into a named sub-function
7. Styles go in StyleSheet.create() at the bottom of the file
8. Add JSDoc to the component export
9. Handle: loading state, error state, empty state — all three
10. Use FloatingInput for all inputs, PrimaryButton for all CTAs