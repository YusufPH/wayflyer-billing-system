import axios, { AxiosInstance } from 'axios';
import { Advance } from '../types/advanceTypes';

// Axios configuration
const BASE_URL = 'https://billing.eng-test.wayflyer.com/v2';
const HEADERS = (today: string) => ({
    'Content-Type': 'application/json',
    'Today': today
});

const axiosInstance: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000, // Set a timeout for requests
});

// Centralized error handling
const handleAxiosError = (error: any, context: string) => {
    const statusCode = error?.response?.status || 'Unknown';
    const statusMessage = error?.response?.statusText || 'Unknown Error';
    const customMessage = error?.response?.data || 'No further details provided';

    console.error(`Error during ${context}: ${statusCode} - ${statusMessage}`);
    console.error(`Details: ${customMessage}`);

    // Handling specific error codes, e.g., 530
    if (statusCode === 530) {
        return null;
    }

    throw new Error(`Request failed: ${statusCode} - ${statusMessage}`);
};

// Get list of advances for the given day
export const getAdvances = async (today: string): Promise<Advance[] | null> => {
    try {
        const { data } = await axiosInstance.get('/advances', { headers: HEADERS(today) });
        return data.advances;
    } catch (error) {
        handleAxiosError(error, `fetching advances on ${today}`);
        return null;
    }
};

// Get revenue for a specific customer and date
export const getRevenue = async (customerId: number, today: string, forDate: string): Promise<number | null> => {
    try {
        const { data } = await axiosInstance.get(`/customers/${customerId}/revenues/${forDate}`, { headers: HEADERS(today) });
        return data.amount;
    } catch (error) {
        return handleAxiosError(error, `fetching revenue for customer ${customerId} on ${forDate}`);
    }
};

// Post a charge to a mandate
export const postCharge = async (mandateId: number, amount: string, today: string): Promise<boolean> => {
    try {
        await axiosInstance.post(`/mandates/${mandateId}/charge`, { amount }, { headers: HEADERS(today) });
        return true;
    } catch (error) {
        handleAxiosError(error, `posting charge for mandate ${mandateId} on ${today}`);
        return false;
    }
};

// Mark an advance as billing complete
export const markBillingComplete = async (advanceId: number, today: string): Promise<void> => {
    try {
        await axiosInstance.post(`/advances/${advanceId}/billing_complete`, {}, { headers: HEADERS(today) });
    } catch (error) {
        handleAxiosError(error, `marking billing complete for advance ${advanceId}`);
    }
};
