import { Hono } from 'hono'
import { db } from './db'
import { examples } from './db/schema/example'

const app = new Hono()

app.get('/', async (c) => {
  // Example query to test the database connection
  const result = await db.select().from(examples).limit(1)
  return c.json(result)
})

export default app
