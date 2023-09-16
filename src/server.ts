import { fastify } from 'fastify'
import { getAllPromptsRoutes } from './routes/get-all-prompts'
import { uploadVideoRoutes } from './routes/upload-video'
import { createTranscriptionRoutes } from './routes/create-transcription'
import { generateAICompletionsRoutes } from './routes/generation-ai-completion'
import { fastifyCors } from '@fastify/cors'

const app = fastify()
app.register(fastifyCors, {
  origin: `*`,
})

app.register(getAllPromptsRoutes)
app.register(uploadVideoRoutes)
app.register(createTranscriptionRoutes)
app.register(generateAICompletionsRoutes)

app.listen({ port: 3333 }).then(() => {
  console.log(`HTTP Server Running!`)
})
