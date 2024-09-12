import { Advance } from '../types/advanceTypes';
import { getAdvances, getRevenue, postCharge, markBillingComplete } from './apiService';
import { ChargeProps, MissedAdvance } from '../types/advanceTypes';
import { getPreviousDay } from '../utils/dateUtlis';

// In-memory store to track remaining balance for each advance
const advancesRemainingBalances: { [advanceId: number]: number } = {};

// In-memory store to track advances that have been fully paid off
const fullyPaidOffAdvances: Set<number> = new Set();

// Cache of missed payment for a customer
const missedAdvances: { [customerId: number]: MissedAdvance[] } = {};

// Run billing for todthe day
export const runBilling = async (today: string) => {
    try {
        console.log(`.................................`);
        console.log(`Commencing billing for: ${today}`);

        // Get all advances
        const advances = await getAdvances(today);
        if (!advances || advances.length === 0) {
            console.log(`No advances found for ${today}`);
            return;
        }

        await processBillingForDay(today, advances)
    } catch (e) {
        console.error(`Error retrieving advances for ${today}`, e);
    }
}

// Repay missed advances for a specific customer
export const repayMissedAdvances = async (customerId: number, today: string) => {
    if (!(customerId in missedAdvances))
        // Nothing to repay
        return false;

    const misses = missedAdvances[customerId]

    for (const miss of misses) {
        const {
            id: advanceId,
            mandate_id: mandateId,
        } = miss.advance;

        const paidOff = await checkAdvanceStatus(advanceId, today)

        if (paidOff) {
            return
        }

        const remainingBalance = advancesRemainingBalances[advanceId];

        const amountToCharge = await getAmountToCharge({
            chargeDate: miss.attemptDate,
            advance: miss.advance,
            remainingBalance,
            today,
        });

        // Post charge to the mandate if available
        if (amountToCharge) {
            const charged = await mandateRepayment(amountToCharge, advanceId, mandateId, today)

            if (!charged)
                continue;
            else
                // Remove this advance from their missed advances
                missedAdvances[customerId] = misses.filter(m => m.advance.id !== advanceId)
        } else {
            console.log(`Unable to charge Missed advance ${advanceId} on ${miss.attemptDate}. Remaining balance is ${remainingBalance.toFixed(2)}`);
        }
    }
}

// Process billing for a specific day
export const processBillingForDay = async (today: string, advances: Advance[]) => {
    for (const advance of advances) {
        const {
            id: advanceId,
            customer_id: customerId,
            repayment_start_date: repaymentStartDate,
            mandate_id: mandateId,
            total_advanced: totalAdvanced,
            fee
        } = advance;

        // Skip advances that have already been paid off
        if (fullyPaidOffAdvances.has(advanceId)) {
            console.log(`Skipping advance ${advanceId} as it is fully paid off.`);
            continue;
        }

        // Initialize the remaining balance for this advance if it hasn't been tracked yet
        if (!(advanceId in advancesRemainingBalances)) {
            // Total amount to be repaid (principal + fee)
            const totalToRepay = parseFloat(totalAdvanced) + parseFloat(fee);
            advancesRemainingBalances[advanceId] = totalToRepay;
        }

        // Skip advances that haven't started repayment yet
        if (new Date(today) < new Date(repaymentStartDate)) {
            console.log(`Skipping advance ${advanceId}, repayment starts on ${repaymentStartDate}`);
            continue;
        }

        try {
            // try first charge for missed revenue
            await repayMissedAdvances(customerId, today)

            // Get the remaining balance
            const remainingBalance = advancesRemainingBalances[advanceId];

            // check if we have anything to do - what if we overcharge?
            if (remainingBalance <= 0)
                continue;

            // Get the previous day
            const previousDay = getPreviousDay(today);

            const amountToCharge = await getAmountToCharge({
                chargeDate: previousDay,
                advance,
                remainingBalance,
                today,
            });

            // Post charge to the mandate if available
            if (amountToCharge) {
                const charged = await mandateRepayment(amountToCharge, advanceId, mandateId, today)
                if (!charged)
                    continue;
            } else {
                console.log(`Unable to charge for advance ${advanceId} on ${today}. Remaining balance is ${remainingBalance.toFixed(2)}`);
            }

            await checkAdvanceStatus(advanceId, today)
        } catch (error) {
            console.error(`Error processing billing for advance ${advanceId} on ${today}`, error);
        }
    }
};

// Charge via mandate to make a repayment
export const mandateRepayment = async (amountToCharge: number, advanceId: number, mandateId: number, today: string) => {
    console.log(`Attempting to charge ${amountToCharge} to mandate ${mandateId} for advance ${advanceId}`);
    const chargeSuccessful = await postCharge(mandateId, amountToCharge.toFixed(2), today);
    if (!chargeSuccessful) {
        console.error(`Failed to post charge for mandate ${mandateId} on ${today}`);
        return false;
    }

    // Deduct the charged amount from the remaining balance
    advancesRemainingBalances[advanceId] -= amountToCharge;
    console.log(`Advance ${advanceId}: Remaining balance is ${advancesRemainingBalances[advanceId].toFixed(2)}`);

    return chargeSuccessful;
}

// Calculate the amount to charge
export const getAmountToCharge = async (props: ChargeProps) => {
    const {
        chargeDate,
        today,
        remainingBalance,
        advance
    } = props

    const customerId = advance.customer_id
    // Get revenue for the customer for the previous day
    const revenueAmount = await getRevenue(customerId, today, chargeDate);
    if (!revenueAmount) {
        console.log(`Revenue not available for customer ${customerId} on ${chargeDate}`);

        // add to cache that we missed it
        const missed = { advance, attemptDate: chargeDate }

        // check if this failed for the customer before advance already exists
        // skip if it exists already
        const exists = !!missedAdvances[customerId]?.find(e => e.advance.id === advance.id)

        if (!(customerId in missedAdvances))  // create
            missedAdvances[customerId] = [missed];
        else if (!exists)  // append if not already there
            missedAdvances[customerId].push(missed);


        return null;
    }

    // Calculate repayment amount
    const repaymentAmount = (revenueAmount * (advance.repayment_percentage / 100)).toFixed(2);
    const repaymentAmountFloat = parseFloat(repaymentAmount);

    // Cap the repayment amount to not exceed the remaining balance
    return Math.min(repaymentAmountFloat, remainingBalance);
}

//Check and remove advance if settled
export const checkAdvanceStatus = async (advanceId: number, today: string) => {
    // Check if the advance has been fully repaid
    if (advancesRemainingBalances[advanceId] <= 0) {
        // Mark the advance as billing complete
        await markBillingComplete(advanceId, today);
        console.log(`Advance ${advanceId} fully paid off and marked as complete.`);

        // Track the advance as fully paid off
        fullyPaidOffAdvances.add(advanceId);

        // Remove the advance from the remaining balance tracking if no longer needed
        delete advancesRemainingBalances[advanceId];

        return true;
    }
    return false;
}
