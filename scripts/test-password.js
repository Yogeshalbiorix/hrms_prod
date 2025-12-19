import bcrypt from 'bcryptjs';

const password = 'admin123';
const hash = '$2b$10$fAQgVFyC/9b1.v2TU9yn5OQ0DFnXwWJRMBdN3ON0dUdB8XbH5yPzm';

console.log('Testing password verification...');
console.log('Password:', password);
console.log('Hash:', hash);
console.log('');

bcrypt.compare(password, hash, function (err, result) {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('Does "admin123" match the hash?', result);

  if (result) {
    console.log('✅ Password verification SUCCESSFUL!');
  } else {
    console.log('❌ Password verification FAILED!');
    console.log('Generating a new hash...');

    bcrypt.hash(password, 10, function (err2, newHash) {
      if (err2) {
        console.error('Error:', err2);
        return;
      }
      console.log('New hash:', newHash);
      console.log('\nSQL to update:');
      console.log(`-- File: db/update-admin-password.sql`);
      console.log(`UPDATE users SET password_hash = '${newHash}' WHERE username = 'admin';`);
    });
  }
});
