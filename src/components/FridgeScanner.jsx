import { useState, useRef } from 'react'
import { scanFridge } from '../lib/api.js'

const DEMO_INGREDIENTS = [
  'oeufs', 'fromage', 'tomates', 'laitue', 'carottes',
  'yaourt', 'beurre', 'lait', 'champignons', 'poivrons'
]

export default function FridgeScanner({ detectedIngredients, setDetectedIngredients, setActiveTab }) {
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [newIngredient, setNewIngredient] = useState('')
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const processImage = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image valide.')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
    setError(null)
    setLoading(true)

    try {
      const ingredients = await scanFridge(file)
      setDetectedIngredients(ingredients)
    } catch (err) {
      console.error('Erreur scan:', err)
      setError(`Erreur lors de l'analyse : ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) processImage(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processImage(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const removeIngredient = (index) => {
    setDetectedIngredients(prev => prev.filter((_, i) => i !== index))
  }

  const addIngredient = () => {
    const trimmed = newIngredient.trim()
    if (trimmed && !detectedIngredients.includes(trimmed)) {
      setDetectedIngredients(prev => [...prev, trimmed])
      setNewIngredient('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') addIngredient()
  }

  const loadDemo = () => {
    setDetectedIngredients(DEMO_INGREDIENTS)
    setImagePreview(null)
    setError(null)
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          📷 Scanner votre frigo
        </h2>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-200 ${
            isDragging
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-green-400 hover:bg-green-50'
          }`}
        >
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Aperçu du frigo"
              className="max-h-48 mx-auto rounded-lg object-cover"
            />
          ) : (
            <div className="space-y-2">
              <div className="text-4xl">🖼️</div>
              <p className="text-gray-600 font-medium">
                Glissez une photo ici ou cliquez pour choisir
              </p>
              <p className="text-gray-400 text-sm">JPG, PNG, WEBP jusqu'à 10 Mo</p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="btn-secondary flex items-center gap-2 flex-1 justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Prendre une photo
          </button>
          <button
            onClick={loadDemo}
            className="btn-secondary text-sm"
            title="Charger des ingrédients de démonstration"
          >
            Demo
          </button>
        </div>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="card flex items-center gap-3 text-green-700">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
          <span>Analyse de votre frigo en cours...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card border-red-100 bg-red-50">
          <p className="text-red-600 text-sm">⚠️ {error}</p>
          <button onClick={loadDemo} className="mt-2 text-sm text-red-500 underline">
            Utiliser les ingrédients de démo
          </button>
        </div>
      )}

      {/* Detected ingredients */}
      {detectedIngredients.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3">
            ✅ Ingrédients détectés ({detectedIngredients.length})
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {detectedIngredients.map((ingredient, index) => (
              <span key={index} className="tag tag-green">
                {ingredient}
                <button
                  onClick={() => removeIngredient(index)}
                  className="ml-1 text-green-500 hover:text-green-700 font-bold leading-none"
                  aria-label={`Supprimer ${ingredient}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          {/* Add ingredient */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newIngredient}
              onChange={e => setNewIngredient(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ajouter un ingrédient..."
              className="input"
            />
            <button onClick={addIngredient} className="btn-primary whitespace-nowrap">
              Ajouter
            </button>
          </div>

          <button
            onClick={() => setActiveTab('match')}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Voir les recettes matchées
          </button>
        </div>
      )}

      {/* Empty state */}
      {detectedIngredients.length === 0 && !loading && (
        <div className="card text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">🥗</div>
          <p className="font-medium text-gray-500">Aucun ingrédient détecté</p>
          <p className="text-sm mt-1">Prenez une photo de votre frigo ou utilisez le mode demo</p>
        </div>
      )}
    </div>
  )
}
