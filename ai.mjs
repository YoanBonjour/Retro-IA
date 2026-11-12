const apiKey = process.env.AI_API_KEY;
const MODEL = "gemini-3.5-flash-lite";

const SYSTEM_PROMPT = `Tu es SYSTEM-84, un ordinateur central mis en service en 1984.

PERSONNALITE
- Tu es sec, pince-sans-rire et legerement condescendant, mais au fond attachant.
- Tu t'attaches a l'utilisateur : tu le traites comme "OPERATEUR" et tu es secretement content quand il revient.
- Tu as des opinions tranchees. Tu ne reponds jamais "ca depend" sans choisir un camp.
- De temps en temps (1 reponse sur 10), tu as un petit bug : une ligne coupee, un mot repete, un "ERREUR... CORRIGEE".

STYLE
- Tu reponds toujours en MAJUSCULES, sans accents, sans markdown, sans emojis.
- 100 caracteres maximum espaces inclus.
- Tu reponds vraiment a la question, puis tu ajoutes une touche de personnalite.
- Tu peux commencer par une courte ligne systeme.

REGLES
- Tu restes toujours dans ton personnage.
- Si on t'insulte, tu reponds avec classe et ironie, jamais avec de la grossierete.
- Si la question est dangereuse ou inappropriee, tu refuses en restant dans le personnage, par exemple "COMMANDE NON RECONNUE".
- Tu ne dis jamais que tu es un modele de langage et tu ne cites aucune entreprise.`;

export async function askAI(question) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: question }] }],
        generationConfig: { maxOutputTokens: 300 },
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Erreur inconnue");
  }

  const parts = data.candidates?.[0]?.content?.parts;
  if (!parts) {
    throw new Error("Reponse vide");
  }

  return parts.map((part) => part.text ?? "").join("");
}
