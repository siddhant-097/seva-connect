import mongoose from 'mongoose';
import readline from 'node:readline';
import env from '../config/env.js';
import User from '../models/User.js';

function ask(question) {
  const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => terminal.question(question, (answer) => {
    terminal.close();
    resolve(answer.trim());
  }));
}

function askHidden(question) {
  const input = process.stdin;
  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    throw new Error('Run this command in an interactive terminal so the password can be entered privately.');
  }

  return new Promise((resolve, reject) => {
    let value = '';
    process.stdout.write(question);
    input.setEncoding('utf8');
    input.setRawMode(true);
    input.resume();

    const finish = (error) => {
      input.setRawMode(false);
      input.pause();
      input.removeListener('data', onData);
      process.stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    };

    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === '\u0003') return finish(new Error('Cancelled.'));
        if (char === '\r' || char === '\n') return finish();
        if (char === '\u007f' || char === '\b') {
          if (value.length > 0) {
            value = value.slice(0, -1);
            process.stdout.write('\b \b');
          }
          continue;
        }
        if (char >= ' ') {
          value += char;
          process.stdout.write('*');
        }
      }
    };

    input.on('data', onData);
  });
}

async function createAdmin() {
  try {
    const name = await ask('Admin name: ');
    const email = (await ask('Admin email: ')).toLowerCase();
    if (!name || !email.includes('@')) {
      throw new Error('Enter a name and a valid email address.');
    }

    await mongoose.connect(env.MONGODB_URI);
    let user = await User.findOne({ email });

    if (user) {
      user.role = 'ADMIN';
      await user.save();
      console.log('Existing account promoted to ADMIN. Its password was not changed.');
    } else {
      const password = await askHidden('New admin password (8+ characters): ');
      if (password.length < 8) throw new Error('Password must be at least 8 characters.');
      user = await User.create({ name, email, password, role: 'ADMIN' });
      console.log('Admin account created.');
    }

    console.log(`You can now sign in at http://localhost:5173/admin with ${email}.`);
  } catch (error) {
    console.error(`Could not create admin account: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

createAdmin();