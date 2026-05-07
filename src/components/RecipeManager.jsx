import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

const EMPTY_FORM = {
  name: '',
  description: '',
  ingredients: [],
  instructions: ''
}

export default function RecipeManager({ recipes, loadRecipes, loadingRecipes }) {
  const [showForm, setShowForm] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [ingredientInput, setIngredientInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const openAddForm = () => {
    setEditingRecipe(null)
    setForm(EMPTY_FORM)
    setIngredientInput('')
    setError(null)
    setShowForm(true)
  }

  const openEditForm = (recipe) => {
    setEditingRecipe(recipe)
    setForm({
      name: recipe.name || '',
      description: recipe.description || '',
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || ''
    })
    setIngredientInput('')
    setError(null)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingRecipe(null)
    setForm(EMPTY_FORM)
    setIngredientInput('')
    setError(null)
  }

  const addIngredientToForm = () => {
    const trimmed = ingredientInput.trim()
    if (trimmed && !form.ingredients.includes(trimmed)) {
      setForm(prev => ({ ...prev, ingredients: [...prev.ingredients, trimmed] }))
      setIngredientInput('')
    }
  }

  const removeIngredientFromForm = (index) => {
    setForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }))
  }

  const handleIngredientKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addIngredientToForm()
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Le nom de la recette est obligatoire.')
      return
    }
    if (form.ingredients.length === 0) {
      setError('Ajoutez au moins un ingrédient.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        ingredients: form.ingredients,
        instructions: form.instructions.trim()
      }

      if (editingRecipe) {
        const { error: err } = await supabase
          .from('recipes')
          .update(payload)
          .eq('id', editingRecipe.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase
          .from('recipes')
          .insert([payload])
        if (err) throw err
      }

      await loadRecipes()
      closeForm()
    } catch (err) {
      setError(`Erreur lors de l'enregistrement : ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (recipe) => {
    if (!confirm(`Supprimer la recette "${recipe.name}" ?`)) return

    try {
      const { error: err } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipe.id)
      if (err) throw err
      await loadRecipes()
    } catch (err) {
      alert(`Erreur lors de la suppression : ${err.message}`)
    }
  }

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">📖 Mes recettes</h2>
        <button onClick={openAddForm} className="btn-primary flex items-center gap-2 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter une recette
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingRecipe ? 'Modifier la recette' : 'Nouvelle recette'}
                </h3>
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="label">Nom de la recette *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Omelette aux herbes"
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Décrivez la recette en quelques mots..."
                    rows={2}
                    className="input resize-none"
                  />
                </div>

                <div>
                  <label className="label">Ingrédients *</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={ingredientInput}
                      onChange={e => setIngredientInput(e.target.value)}
                      onKeyDown={handleIngredientKeyDown}
                      placeholder="Tapez un ingrédient et appuyez Entrée"
                      className="input"
                    />
                    <button
                      type="button"
                      onClick={addIngredientToForm}
                      className="btn-secondary whitespace-nowrap text-sm"
                    >
                      Ajouter
                    </button>
                  </div>
                  {form.ingredients.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {form.ingredients.map((ing, i) => (
                        <span key={i} className="tag tag-green">
                          {ing}
                          <button
                            onClick={() => removeIngredientFromForm(i)}
                            className="ml-1 text-green-500 hover:text-green-700 font-bold leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">Instructions</label>
                  <textarea
                    value={form.instructions}
                    onChange={e => setForm(prev => ({ ...prev, instructions: e.target.value }))}
                    placeholder="Étapes de préparation..."
                    rows={5}
                    className="input resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Enregistrement...
                    </>
                  ) : (
                    editingRecipe ? 'Mettre à jour' : 'Enregistrer'
                  )}
                </button>
                <button onClick={closeForm} className="btn-secondary">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loadingRecipes && (
        <div className="card flex items-center gap-3 text-gray-500">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
          <span>Chargement des recettes...</span>
        </div>
      )}

      {/* Recipe list */}
      {!loadingRecipes && recipes.length === 0 && (
        <div className="card text-center py-10 text-gray-400">
          <div className="text-4xl mb-3">🍽️</div>
          <p className="font-medium text-gray-500">Aucune recette enregistrée</p>
          <p className="text-sm mt-1">Ajoutez vos recettes préférées pour commencer</p>
          <button onClick={openAddForm} className="btn-primary mt-4 text-sm">
            Ajouter ma première recette
          </button>
        </div>
      )}

      {!loadingRecipes && recipes.length > 0 && (
        <div className="space-y-3">
          {recipes.map(recipe => (
            <div key={recipe.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => toggleExpand(recipe.id)}
                    className="text-left w-full group"
                  >
                    <h3 className="font-semibold text-gray-800 group-hover:text-green-700 transition-colors">
                      {recipe.name}
                    </h3>
                    {recipe.description && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                        {recipe.description}
                      </p>
                    )}
                  </button>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                      {recipe.ingredients?.length || 0} ingrédient{(recipe.ingredients?.length || 0) > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openEditForm(recipe)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Modifier"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(recipe)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Expanded view */}
              {expandedId === recipe.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                  {recipe.ingredients?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Ingrédients</p>
                      <div className="flex flex-wrap gap-1.5">
                        {recipe.ingredients.map((ing, i) => (
                          <span key={i} className="tag tag-green text-xs">
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {recipe.instructions && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Instructions</p>
                      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                        {recipe.instructions}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
