import bcrypt from 'bcryptjs';

const password = 'admin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, function (err, hash) {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nSQL Command to update admin:');
  console.log(`UPDATE users SET password_hash = '${hash}' WHERE username = 'admin';`);
});
