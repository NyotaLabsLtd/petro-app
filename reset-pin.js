const bcrypt = require('bcrypt');

async function resetPin() {
  const newPin = '1234'; // Your new PIN
  const hashedPin = await bcrypt.hash(newPin, 10);
  console.log('✅ Hashed PIN:', hashedPin);
  console.log('\n📋 Run this SQL in Neon:');
  console.log(`UPDATE users SET pin = '${hashedPin}' WHERE phone = '0729730197' AND is_admin = true;`);
}

resetPin();