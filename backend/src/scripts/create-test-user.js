const { query } = require('../config/db');
const bcrypt = require('bcrypt');

async function createMyUser() {
  try {
    const username = 'sandyyy';
    const email = 'santhosh.rv173@gmail.com';
    const password = 'S@ndyyy@741821'; // 🔐 Use a real password here
    const firstName = 'Santhosh';
    const lastName = 'Venkatachalam';
    const birthday = '2005-06-02'; // 🎂 Change if needed

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const result = await query(
      `INSERT INTO users 
      (username, email, password_hash, first_name, last_name, birthday, is_email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [username, email, passwordHash, firstName, lastName, birthday, true]
    );

    const user = result.rows[0];
    console.log('\n✅ User inserted successfully!');
    console.log('Email:', user.email);
    console.log('Password (plaintext):', password);
    console.log('User ID:', user.id);

    // Insert dummy security questions
    await query(
      `INSERT INTO security_questions 
      (user_id, question1_id, answer1, question2_id, answer2, question3_id, answer3)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user.id, 'pet', 'spot', 'city', 'london', 'friend', 'john']
    );

    console.log('🛡️ Security questions inserted!');
  } catch (error) {
    console.error('❌ Error inserting user:', error);
  }
}

module.exports = createMyUser;
