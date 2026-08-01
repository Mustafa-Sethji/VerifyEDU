const crypto = require('crypto');

/**
 * Generates a unique, readable 6-character uppercase alphanumeric code.
 * Excludes ambiguous characters (0, O, 1, I, L).
 */
const generateClassroomCode = () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    code += chars[randomIndex];
  }
  return code;
};

module.exports = { generateClassroomCode };
