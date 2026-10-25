
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

async function generateMealSuggestion(profile, ingredients) {
    const allergies = Array.isArray(profile.allergies)
        ? profile.allergies.join(", ")
        : "Not specified";

    const foodPreferences = Array.isArray(profile.foodPreferences)
        ? profile.foodPreferences.join(", ")
        : "No specific preferences";

    const prompt = `
You are a meal planning assistant.

Suggest one practical meal using the following user profile.

Diet type: ${profile.dietType}
Fitness goal: ${profile.fitnessGoal}
Daily calorie target: ${profile.dailyCalories || "Not specified"}
Allergies: ${allergies}
Food preferences: ${foodPreferences}
Available ingredients: ${ingredients || "Common household ingredients"}

Requirements:
1. Respect the user's dietary preferences.
2. Avoid all listed allergens. If an allergy is unclear, ask for clarification rather than assuming an ingredient is safe.
3. Give the meal name.
4. List ingredients with quantities.
5. Provide preparation steps.
6. Estimate calories, protein, carbohydrates, and fat per serving.
7. Keep the meal practical and easy to prepare.
8. Explain that nutrition values are estimates.
9. Do not claim the meal is medically suitable for a health condition.

Return the result in a clear, readable format.
`;

    const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
    });

    if (!response.text) {
        throw new Error("Gemini returned an empty response");
    }

    return response.text;
}

module.exports = {
    generateMealSuggestion,
};
