import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { openai } from '../lib/openai'
import 'dotenv/config'
import { streamToResponse, OpenAIStream } from 'ai'

export async function generateAICompletionsRoutes(app: FastifyInstance) {
  app.post('/ai/complete', async (req: FastifyRequest, reply: FastifyReply) => {
    const bodySchema = z.object({
      videoId: z.string().uuid(),
      prompt: z.string(),
      temperature: z.number().min(0).max(1).default(0.5),
    })
    const { videoId, temperature, prompt } = bodySchema.parse(req.body)

    const video = await prisma.video.findUniqueOrThrow({
      where: { id: videoId },
    })

    if (!video.transcription) {
      return reply
        .status(400)
        .send({ error: `Video Transcription was not generated yet` })
    }

    const promptMessage = prompt.replace('{transcription}', video.transcription)
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-16k',
      messages: [{ role: 'user', content: promptMessage }],
      temperature,
      stream: true,
    })

    const stream = OpenAIStream(response)

    streamToResponse(stream, reply.raw, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
    })
  })
}
