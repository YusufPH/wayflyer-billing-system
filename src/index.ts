import { runBilling } from './services/billingService';
import { getDateRange } from './utils/dateUtlis';

const START_DATE = '2022-01-01';
const END_DATE = '2022-02-01';

// Simulate billing over the period
const simulateBilling = async () => {
    const dateRange = getDateRange(START_DATE, END_DATE);
    
    for (const date of dateRange) {
        await runBilling(date);
    }
};

// Start the simulation
simulateBilling().then(() => console.log('Billing simulation complete.'));
