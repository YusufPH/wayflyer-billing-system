import { runBilling, processBillingForDay, repayMissedAdvances, checkAdvanceStatus, getAmountToCharge, mandateRepayment } from '../services/billingService';
import { getAdvances, getRevenue, postCharge, markBillingComplete } from '../services/apiService';
import { ChargeProps } from '../types/advanceTypes';

// Mock dependencies
jest.mock('../services/apiService', () => ({
    getAdvances: jest.fn(),
    getRevenue: jest.fn(),
    postCharge: jest.fn(),
    markBillingComplete: jest.fn(),
}));

let advancesRemainingBalances: { [advanceId: number]: number } = {};
let fullyPaidOffAdvances: Set<number> = new Set();
let missedAdvances: { [customerId: number]: any[] } = {};

describe('Billing Service Tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
        // Reset global variables after each test
        advancesRemainingBalances = {};
        fullyPaidOffAdvances = new Set();
        missedAdvances = {};
    });

    describe('runBilling', () => {
        it('should log message when no advances are found', async () => {
            (getAdvances as jest.Mock).mockResolvedValue([]);
            const today = '2024-09-10';

            console.log = jest.fn(); // Mock console.log

            await runBilling(today);

            expect(console.log).toHaveBeenCalledWith(`No advances found for ${today}`);
        });

    });

    describe('processBillingForDay', () => {
        it('should skip advances that have been paid off', async () => {
            const advances = [
                {
                    id: 1,
                    customer_id: 123,
                    repayment_start_date: '2024-09-01',
                    total_advanced: '100',
                    fee: '10',
                    mandate_id: 123,
                    created: '2024-01-01',   // Added created field
                    repayment_percentage: 10, // Added repayment_percentage field
                },
            ];
            fullyPaidOffAdvances.add(1);

            await processBillingForDay('2024-09-10', advances);

            expect(fullyPaidOffAdvances.has(1)).toBe(true);
        });

        it('should process billing and call mandateRepayment', async () => {
            const advances = [
                {
                    id: 1,
                    customer_id: 123,
                    repayment_start_date: '2024-09-01',
                    total_advanced: '100',
                    fee: '10',
                    mandate_id: 123,
                    created: '2024-01-01',   // Added created field
                    repayment_percentage: 10, // Added repayment_percentage field
                },
            ];

            (getRevenue as jest.Mock).mockResolvedValue(50);
            (postCharge as jest.Mock).mockResolvedValue(true);

            await processBillingForDay('2024-09-10', advances);

            expect(postCharge).toHaveBeenCalled();
        });
    });

    describe('checkAdvanceStatus', () => {

        it('should not mark advance as complete when balance is not 0', async () => {
            advancesRemainingBalances[1] = 50;
            const today = '2024-09-10';

            const result = await checkAdvanceStatus(1, today);

            expect(result).toBe(false);
            expect(markBillingComplete).not.toHaveBeenCalled();
        });
    });

    describe('getAmountToCharge', () => {
        it('should return null if no revenue is available', async () => {
            const props: ChargeProps = {
                chargeDate: '2024-09-09',
                today: '2024-09-10',
                remainingBalance: 100,
                advance: {
                    id: 1,
                    customer_id: 123,
                    repayment_start_date: '2024-09-01',
                    total_advanced: '100',
                    fee: '10',
                    mandate_id: 123,
                    created: '2024-01-01',   // Added created field
                    repayment_percentage: 10, // Added repayment_percentage field
                },
            };

            (getRevenue as jest.Mock).mockResolvedValue(null);

            const result = await getAmountToCharge(props);

            expect(result).toBeNull();
            expect(getRevenue).toHaveBeenCalled();
        });

        it('should return capped amount to charge based on revenue and remaining balance', async () => {
            const props: ChargeProps = {
                chargeDate: '2024-09-09',
                today: '2024-09-10',
                remainingBalance: 100,
                advance: {
                    id: 1, customer_id: 123, repayment_percentage: 10, total_advanced: '100', fee: '10',
                    created: '',
                    mandate_id: 0,
                    repayment_start_date: ''
                },
            };

            (getRevenue as jest.Mock).mockResolvedValue(50);

            const result = await getAmountToCharge(props);

            expect(result).toBe(5);
        });
    });

    describe('mandateRepayment', () => {
        it('should successfully charge mandate', async () => {
            (postCharge as jest.Mock).mockResolvedValue(true);

            const result = await mandateRepayment(50, 1, 123, '2024-09-10');

            expect(postCharge).toHaveBeenCalledWith(123, '50.00', '2024-09-10');
            expect(result).toBe(true);
        });

        it('should fail if charge is unsuccessful', async () => {
            (postCharge as jest.Mock).mockResolvedValue(false);

            const result = await mandateRepayment(50, 1, 123, '2024-09-10');

            expect(result).toBe(false);
        });
    });
});