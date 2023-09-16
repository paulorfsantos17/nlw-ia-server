import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../lib/prisma'
import { fastifyMultipart } from '@fastify/multipart'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'

const pump = promisify(pipeline)

export async function uploadVideoRoutes(app: FastifyInstance) {
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 1_048_576 * 25, // 25mb
    },
  })
  app.post('/videos', async (req: FastifyRequest, reply: FastifyReply) => {
    const data = await req.file()

    if (!data) return reply.status(400).send({ error: 'Missing file Input' })

    const extension = path.extname(data.filename)

    if (extension !== '.mp3') {
      return reply
        .status(400)
        .send({ error: 'Invalid input type, please upload MP3.' })
    }

    const fileBaseName = path.basename(data.filename, extension)

    const fileUploadName = `${fileBaseName}-${randomUUID()}`

    const uploadDIR = path.resolve(
      __dirname,
      '../../tmp',
      fileUploadName + '.mp3',
    )

    await pump(data.file, fs.createWriteStream(uploadDIR))

    const video = await prisma.video.create({
      data: {
        name: data.filename,
        path: uploadDIR,
      },
    })

    return reply.send(video)
  })
}
