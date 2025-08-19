import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'crypto'

export async function transactionRoutes(app: FastifyInstance) {
  app.post('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionBodySchema.parse(req.body)

    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
    })

    return reply
      .status(201)
      .send({ message: 'Transaction created with success' })
  })
  app.get('/', async (_: FastifyRequest, reply: FastifyReply) => {
    const transaction = await knex('transactions').select()

    return reply.send({
      transactions: transaction,
    })
  })
  app.get('/summary', async (req: FastifyRequest, reply: FastifyReply) => {
    const summary = await knex('transactions')
      .sum('amount', { as: 'amount' })
      .first()

    return reply.send({
      summary,
    })
  })
  app.get('/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const listUniqueTransactionBodySchema = z.object({
      id: z.uuid(),
    })

    const { id } = listUniqueTransactionBodySchema.parse(req.params)

    const transaction = await knex('transactions').where('id', id).first()
    return reply.send({
      transactions: transaction,
    })
  })
}
