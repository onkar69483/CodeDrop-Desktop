/**
 * Generates a random 4-digit numeric code for room identification
 * @returns {string} A 4-digit code as string
 */
const generateCode = () => {
  // Generate a random number between 1000 and 9999
  const code = Math.floor(1000 + Math.random() * 9000);
  return code.toString();
};

module.exports = generateCode;