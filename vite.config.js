import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import Anthropic from '@anthropic-ai/sdk'
import multer from 'multer'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

function fridgeApiPlugin() {
  return {
    name: 'fridge-api',
    configureServer(server) {
      server.middlewares.use('/api/scan-fridge', (req, res, next) => {
        if (req.method !== 'POST') return next()

        upload.single('image')(req, res, async (err) => {
          if (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ error: err.message }))
          }

          if (!req.file) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ error: 'Aucune image fournie' }))
          }

          const apiKey = process.env.ANTHROPIC_API_KEY
          if (!apiKey) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ error: 'Clé API Anthropic non configurée' }))
          }

          try {
            const anthropic = new Anthropic({ apiKey })
            const imageBase64 = req.file.buffer.toString('base64')
            const mimeType = req.file.mimetype || 'image/jpeg'

            const message = await anthropic.messages.create({
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

            const responseText = message.content[0].text.trim()
            const jsonMatch = responseText.match(/\[[\s\S]*\]/)
            if (!jsonMatch) {
              res.writeHead(500, { 'Content-Type': 'application/json' })
              return res.end(JSON.stringify({ error: 'Réponse invalide de Claude', raw: responseText }))
            }

            const ingredients = JSON.parse(jsonMatch[0])
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ingredients }))
          } catch (error) {
            console.error('Erreur scan frigo:', error)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: error.message || 'Erreur interne du serveur' }))
          }
        })
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), fridgeApiPlugin()],
})
