/**
 * Standard Password Validation Utility
 * Requires:
 * - Minimum 8 characters
 * - 1 Uppercase letter
 * - 1 Lowercase letter
 * - 1 Number or Symbol
 * 
 * @param {string} password 
 * @returns {string|null} Error message if invalid, null if valid
 */
export const validatePasswordStrength = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).{8,}$/;
    if (!regex.test(password)) {
        return "Password must have 8+ chars, 1 Uppercase, 1 Lowercase & 1 Number/Symbol";
    }
    return null;
};
