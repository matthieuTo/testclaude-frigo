import { useMemo } from 'react'
import { matchRecipes } from '../lib/api.js'
import RecipeCard from './RecipeCard.jsx'

export default function RecipeMatch({ detectedIngredients, recipes }) {
  const matchedRecipes = useMemo(
    () => matchRecipes(detectedIngredients, recipes),
    [detectedIngredients, recipes]
  )

  if (detectedIngredients.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-5xl mb-3">📸</div>
        <p className="font-semibold text-gray-600">Aucun ingrédient scanné</p>
        <p className="text-sm text-gray-400 mt-1">
          Prenez d'abord une photo de votre frigo dans l'onglet Scanner
        </p>
      </div>
    )
  }

  if (recipes.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-5xl mb-3">📖</div>
        <p className="font-semibold text-gray-600">Aucune recette enregistrée</p>
        <p className="text-sm text-gray-400 mt-1">
          Ajoutez vos recettes favorites dans l'onglet Mes recettes
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <p className="text-sm text-gray-500 font-medium mb-2">
          🥦 Ingrédients dans votre frigo ({detectedIngredients.length})
        </p>
        <div className="flex flex-wrap gap-1">
          {detectedIngredients.map((ing, i) => (
            <span key={i} className="tag tag-blue text-xs">{ing}</span>
          ))}
        </div>
      </div>

      <p className="text-sm font-medium text-gray-500 px-1">
        {matchedRecipes.length} recette{matchedRecipes.length > 1 ? 's' : ''} — triées par compatibilité
      </p>

      <div className="space-y-3">
        {matchedRecipes.map(recipe => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            matchScore={recipe.score}
            matchedIngredients={recipe.matchedIngredients}
            missingIngredients={recipe.missingIngredients}
          />
        ))}
      </div>
    </div>
  )
}
