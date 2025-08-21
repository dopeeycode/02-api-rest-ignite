import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { checkSessionIdExists } from '../middlewares/check-sessionId-exists'

// Cookies -> Formas de manter contexto entre requisições

// Proxima Task -> Validar existência de cookie

export async function transactionRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { sessionId } = request.cookies

      const transaction = await knex('transactions')
        .where('session_id', sessionId)
        .select()

      return reply.send({
        transactions: transaction,
      })
    },
  )
  app.post('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionBodySchema.parse(req.body)

    let sessionId = req.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })

    return reply
      .status(201)
      .send({ message: 'Transaction created with success' })
  })
  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { sessionId } = request.cookies

      const summary = await knex('transactions')
        .sum('amount', { as: 'amount' })
        .where('session_id', sessionId)
        .first()

      return reply.send({
        summary,
      })
    },
  )
  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { sessionId } = request.cookies

      const listUniqueTransactionBodySchema = z.object({
        id: z.uuid(),
      })

      const { id } = listUniqueTransactionBodySchema.parse(request.params)

      const transaction = await knex('transactions')
        .where({
          id,
          session_id: sessionId,
        })
        .first()

      return reply.send({
        transactions: transaction,
      })
    },
  )
}
