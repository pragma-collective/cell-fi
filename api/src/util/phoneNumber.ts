/**
 * Formats a phone number to ensure it starts with a '+' symbol
 * @param phoneNumber - The phone number to format
 * @returns The formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string): string {
    return phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
}