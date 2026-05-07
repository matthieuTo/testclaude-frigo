import { useState, useEffect } from 'react'
import NavBar from './components/NavBar.jsx'
import FridgeScanner from './components/FridgeScanner.jsx'
import RecipeManager from './components/RecipeManager.jsx'
import RecipeMatch from './components/RecipeMatch.jsx'
import { supabase } from './lib/supabase.js'

const DEMO_RECIPES = [
  {
    id: 'demo-1',
    name: 'Omelette aux champignons',
    description: 'Une omelette moelleuse aux champignons et herbes fraîches',
    ingredients: ['oeufs', 'champignons', 'beurre', 'sel', 'poivre', 'persil'],
    instructions: '1. Battre les oeufs avec sel et poivre.\n2. Faire revenir les champignons dans le beurre.\n3. Verser les oeufs, cuire à feu moyen.\n4. Plier l\'omelette et servir avec persil.',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-2',
    name: 'Salade de tomates mozzarella',
    description: 'Salade fraîche italienne classique',
    ingredients: ['tomates', 'mozzarella', 'basilic', 'huile d\'olive', 'sel', 'poivre'],
    instructions: '1. Couper tomates et mozzarella en tranches.\n2. Alterner sur le plat.\n3. Arroser d\'huile d\'olive.\n4. Ajouter basilic, sel et poivre.',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-3',
    name: 'Pâtes carbonara',
    description: 'Pâtes crémeuses à la romaine',
    ingredients: ['pâtes', 'lardons', 'oeufs', 'parmesan', 'poivre noir', 'sel'],
    instructions: '1. Cuire les pâtes al dente.\n2. Faire revenir les lardons.\n3. Mélanger oeufs et parmesan.\n4. Hors du feu, mélanger pâtes, lardons et sauce.\n5. Poivrer généreusement.',
    created_at: new Date().toISOString()
  }
]

export default function App() {
  const [activeTab, setActiveTab] = useState('scanner')
  const [detectedIngredients, setDetectedIngredients] = useState([])
  const [recipes, setRecipes] = useState([])
  const [loadingRecipes, setLoadingRecipes] = useState(false)

  const loadRecipes = async () => {
    setLoadingRecipes(true)
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRecipes(data || [])
    } catch (err) {
      console.warn('Supabase non disponible, utilisation des recettes de démo:', err.message)
      setRecipes(DEMO_RECIPES)
    } finally {
      setLoadingRecipes(false)
    }
  }

  useEffect(() => {
    loadRecipes()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {activeTab === 'scanner' && (
          <FridgeScanner
            detectedIngredients={detectedIngredients}
            setDetectedIngredients={setDetectedIngredients}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'recettes' && (
          <RecipeManager
            recipes={recipes}
            loadRecipes={loadRecipes}
            loadingRecipes={loadingRecipes}
          />
        )}
        {activeTab === 'match' && (
          <RecipeMatch
            detectedIngredients={detectedIngredients}
            recipes={recipes}
          />
        )}
      </main>
    </div>
  )
}
