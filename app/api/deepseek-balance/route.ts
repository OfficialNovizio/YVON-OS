// GET /api/deepseek-balance — Fetches real-time DeepSeek account balance.
// Returns total_balance, topped_up_balance, granted_balance in USD.
// The balance info is used by the CEO Token Usage panel to show actual remaining credits.

interface DeepSeekBalanceResponse {
  is_available: boolean
  balance_infos: Array<{
    currency: string
    total_balance: string
    topped_up_balance: string
    granted_balance: string
  }>
}

export async function GET(): Promise<Response> {
  const apiKey = process.env.DEEPSEEK_API_KEY

  if (!apiKey) {
    return Response.json(
      { balance: null, error: 'DEEPSEEK_API_KEY not configured' },
      { status: 200 },
    )
  }

  try {
    const res = await fetch('https://api.deepseek.com/user/balance', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!res.ok) {
      return Response.json(
        { balance: null, error: `DeepSeek API returned ${res.status}` },
        { status: 200 },
      )
    }

    const data = (await res.json()) as DeepSeekBalanceResponse

    if (!data.is_available || !data.balance_infos?.length) {
      return Response.json(
        { balance: null, error: 'Balance info not available' },
        { status: 200 },
      )
    }

    const info = data.balance_infos[0]
    const total = parseFloat(info.total_balance)
    const toppedUp = parseFloat(info.topped_up_balance)
    const granted = parseFloat(info.granted_balance)

    return Response.json({
      balance: {
        total,
        toppedUp,
        granted,
        currency: info.currency,
      },
    })
  } catch (e) {
    return Response.json(
      { balance: null, error: String(e) },
      { status: 200 },
    )
  }
}
