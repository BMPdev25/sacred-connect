// Helper function to extract detectIdentifierType for testing
export const detectIdentifierType = (input: string): "phone" | "email" => {
  if (input.includes("@")) return "email";
  // Check if mostly digits (allowing +, -, spaces, parentheses)
  const digitsOnly = input.replace(/[\s\-\+\(\)]/g, "");
  if (/^\d+$/.test(digitsOnly)) return "phone";
  return "email"; // default to email for mixed input
};
