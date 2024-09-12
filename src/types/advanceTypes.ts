export interface Advance {
    id: number,
    customer_id: number,
    created: string,
    total_advanced: string,
    fee: string,
    mandate_id: number,
    repayment_start_date: string,
    repayment_percentage: number
}

export interface MissedAdvance {
    advance: Advance,
    attemptDate: string
}

export interface ChargeProps {
    today: string, 
    chargeDate: string, 
    advance: Advance,
    remainingBalance: number,
}