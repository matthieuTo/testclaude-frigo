import { useState } from 'react'

export default function RecipeCard({ recipe, matchScore, matchedIngredients, missingIngredients }) {
  const [expanded, setExpanded] = useState(false)

  const scoreColor =
    matchScore >= 80 ? 'text-green-600' :
    matchScore >= 50 ? 'text-orange-500' :
    'text-red-400'

  const scoreBg =
    matchScore >= 80 ? 'bg-green-50 border-green-100' :
    matchScore >= 50 ? 'bg-orange-50 border-orange-100' :
    'bg-gray-50 border-gray-100'

  return (
    <div className={`card border ${scoreBg}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 truncate">{recipe.name}</h3>
          {recipe.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{recipe.description}</p>
          )}
        </div>
        <div className={`text-2xl font-bold shrink-0 ${scoreColor}`}>
          {matchScore}%
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {matchedIngredients.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {matchedIngredients.map((ing, i) => (
              <span key={i} className="tag tag-green text-xs">✓ {ing}</span>
            ))}
          </div>
        )}
        {missingIngredients.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {missingIngredients.map((ing, i) => (
              <span key={i} className="tag tag-gray text-xs">✗ {ing}</span>
            ))}
          </div>
        )}
      </div>

      {recipe.instructions && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            {expanded ? '▲ Masquer la recette' : '▼ Voir la recette'}
          </button>
          {expanded && (
            <pre className="mt-2 text-sm text-gray-700 whitespace-pre-wrap bg-white rounded-lg p-3 border border-gray-100">
              {recipe.instructions}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
