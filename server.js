import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import Anthropic from '@anthropic-ai/sdk'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

app.post('/api/scan-fridge', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucune image fournie' })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Clé API Anthropic non configurée' })
    }

    const imageBase64 = req.file.buffer.toString('base64')
    const mimeType = req.file.mimetype || 'image/jpeg'

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: imageBase64
              }
            },
            {
              type: 'text',
              text: 'Analyze this fridge photo. Return ONLY a JSON array of ingredient names visible, like: ["tomatoes", "cheese", "eggs"]. Be specific but concise. In French if possible.'
            }
          ]
        }
      ]
    })

    const responseText = message.content[0].text.trim()

    // Extract JSON array from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Réponse invalide de Claude', raw: responseText })
    }

    const ingredients = JSON.parse(jsonMatch[0])
    return res.json({ ingredients })
  } catch (error) {
    console.error('Erreur scan frigo:', error)
    return res.status(500).json({ error: error.message || 'Erreur interne du serveur' })
  }
})

app.listen(PORT, () => {
  console.log(`Serveur FridgeChef démarré sur http://localhost:${PORT}`)
})
