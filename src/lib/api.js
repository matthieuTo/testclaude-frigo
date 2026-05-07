/**
 * Sends an image file to the backend for fridge scanning.
 * Returns an array of detected ingredient strings.
 */
export async function scanFridge(imageFile) {
  const formData = new FormData()
  formData.append('image', imageFile)

  const response = await fetch('/api/scan-fridge', {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur réseau' }))
    throw new Error(error.error || `Erreur HTTP ${response.status}`)
  }

  const data = await response.json()
  return data.ingredients || []
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
