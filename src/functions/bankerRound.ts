// engine/bankerRound.ts
export function bankerRound(value: number, decimals = 2) {
    const factor = 10 ** decimals
    const n = value * factor
    const floor = Math.floor(n)
    const diff = n - floor

    if (diff === 0.5) {
        return (floor % 2 === 0 ? floor : floor + 1) / factor
    }

    return Math.round(n) / factor
}