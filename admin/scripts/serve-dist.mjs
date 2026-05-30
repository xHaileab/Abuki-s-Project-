import { spawn } from 'node:child_process';

const port = process.env.PORT || '4173';
const host = process.env.HOST || '0.0.0.0';
const command = process.platform === 'win32' ? 'serve.cmd' : 'serve';

const child = spawn(command, ['-s', 'dist', '-l', `tcp://${host}:${port}`], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
