/**
 * lib/validate.ts — Request body validation with Zod.
 *
 * Usage:
 *   import { validateJson } from '@/lib/validate'
 *   import { z } from 'zod'
 *
 *   const body = await validateJson(req, z.object({
 *     name: z.string().min(1),
 *     email: z.string().email(),
 *   }))
 *
 *   // On validation failure, returns 400 Response automatically
 *   // On success, body is typed as the inferred Zod schema
 */

import { z } from 'zod'

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: z.ZodIssue[],
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Parse and validate JSON request body against a Zod schema.
 * Returns a typed response on failure so the route doesn't need try/catch.
 */
export async function validateJson<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new ValidationError('Invalid JSON body', [])
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    throw new ValidationError('Validation failed', result.error.issues)
  }

  return result.data
}

/**
 * Wrap a route handler with automatic Zod validation.
 * Catches ValidationError and returns a 400 response.
 *
 * Usage:
 *   import { withValidation } from '@/lib/validate'
 *   import { z } from 'zod'
 *
 *   const schema = z.object({ name: z.string() })
 *   export const POST = withValidation(schema, async (req, body) => {
 *     // body is typed as { name: string }
 *     return Response.json({ ok: true })
 *   })
 */
export function withValidation<T extends z.ZodType>(
  schema: T,
  handler: (req: Request, body: z.infer<T>) => Promise<Response>,
) {
  return async (req: Request): Promise<Response> => {
    try {
      const body = await validateJson(req, schema)
      return handler(req, body)
    } catch (err) {
      if (err instanceof ValidationError) {
        return Response.json(
          {
            error: err.message,
            issues: err.issues.map(i => ({
              path: i.path.join('.'),
              message: i.message,
            })),
          },
          { status: 400 },
        )
      }
      throw err
    }
  }
}
