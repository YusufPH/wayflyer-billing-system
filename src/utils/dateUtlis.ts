// Helper function to get the previous day's date in 'YYYY-MM-DD' format
export const getPreviousDay = (date: string): string => {
    const currentDate = new Date(date);
    currentDate.setDate(currentDate.getDate() - 1);
    return currentDate.toISOString().split('T')[0];
};

// Helper function to get the range of dates between start and end
export const getDateRange = (startDate: string, endDate: string): string[] => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];

    for (let dt = start; dt <= end; dt.setDate(dt.getDate() + 1)) {
        dates.push(new Date(dt).toISOString().split('T')[0]);
    }

    return dates;
};
