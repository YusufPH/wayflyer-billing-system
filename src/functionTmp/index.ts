import { getAdvances, getRevenue, postCharge, markBillingComplete } from '../services/apiService';

// Function to test getAdvances
const testGetAdvances = async () => {
    const today = '2022-01-24'; // Example date
    try {
        const advances = await getAdvances(today);
        console.log('Advances:', advances);
    } catch (error) {
        console.error('Error fetching advances:', error);
    }
};

// Function to test getRevenue
const testGetRevenue = async () => {
    const customerId = 1;  // Example customer ID
    const today = '2022-01-11'; // Example date
    const forDate = '2022-01-08';  // Example date
    try {
        const revenue = await getRevenue(customerId, today, forDate);
        console.log(`Revenue for customer ${customerId} on ${forDate}:`, revenue);
    } catch (error) {
        console.error('Error fetching revenue:', error);
    }
};

// Function to test postCharge
const testPostCharge = async () => {
    const mandateId = 1;  // Example mandate ID
    const amount = '1.';  // Example amount
    const today = '2022-01-03'; // Example date
    try {
        const success = await postCharge(mandateId, amount, today);
        if (success) {
            console.log(`Successfully charged ${amount} to mandate ${mandateId}`);
        } else {
            console.log(`Charge for mandate ${mandateId} could not be processed at this time.`);
        }
    } catch (error) {
        console.error('Error posting charge:', error);
    }
};

// Function to test markBillingComplete
const testMarkBillingComplete = async () => {
    const advanceId = 1;  // Example advance ID
    const today = '2022-01-02'; // Example date
    try {
        await markBillingComplete(advanceId, today);
        console.log(`Billing for advance ${advanceId} has been marked as complete.`);
    } catch (error) {
        console.error('Error marking billing as complete:', error);
    }
};

// Call the test functions one by one
testGetAdvances();
//testPostCharge();
//testGetRevenue();
//testMarkBillingComplete();
