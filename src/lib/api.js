/**
 * Converts an image File to a base64 string.
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Sends an image file to the Anthropic API directly from the browser.
 * Returns an array of detected ingredient strings.
 */
export async function scanFridge(imageFile) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('Clé API Anthropic non configurée (VITE_ANTHROPIC_API_KEY)')
  }

  const imageBase64 = await fileToBase64(imageFile)
  const mimeType = imageFile.type || 'image/jpeg'

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: imageBase64 }
          },
          {
            type: 'text',
            text: 'Analyze this fridge photo. Return ONLY a JSON array of ingredient names visible, like: ["tomatoes", "cheese", "eggs"]. Be specific but concise. In French if possible.'
          }
        ]
      }]
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Erreur réseau' } }))
    throw new Error(error.error?.message || `Erreur HTTP ${response.status}`)
  }

  const data = await response.json()
  const responseText = data.content[0].text.trim()
  const jsonMatch = responseText.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('Réponse invalide de Claude')
  }

  return JSON.parse(jsonMatch[0])
}

/**
 * Pure function that calculates match scores between detected ingredients and recipes.
 * Returns recipes sorted by score descending, each enriched with:
 *   - score: number 0-100
 *   - matchedIngredients: string[]
 *   - missingIngredients: string[]
 */
export function matchRecipes(detectedIngredients, recipes) {
  if (!detectedIngredients.length || !recipes.length) {
    return recipes.map(recipe => ({
      ...recipe,
      score: 0,
      matchedIngredients: [],
      missingIngredients: recipe.ingredients || []
    }))
  }

  const normalizedDetected = detectedIngredients.map(i => i.toLowerCase().trim())

  const scored = recipes.map(recipe => {
    const recipeIngredients = recipe.ingredients || []
    const matched = []
    const missing = []

    for (const ingredient of recipeIngredients) {
      const normalizedIngredient = ingredient.toLowerCase().trim()
      const found = normalizedDetected.some(detected =>
        detected.includes(normalizedIngredient) || normalizedIngredient.includes(detected)
      )
      if (found) {
        matched.push(ingredient)
      } else {
        missing.push(ingredient)
      }
    }

    const score = recipeIngredients.length > 0
      ? Math.round((matched.length / recipeIngredients.length) * 100)
      : 0

    return {
      ...recipe,
      score,
      matchedIngredients: matched,
      missingIngredients: missing
    }
  })

  return scored.sort((a, b) => b.score - a.score)
}
