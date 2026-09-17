// Local preview at http://localhost:4000, built in a container.
//
// Ruby's native-gem toolchain does not build on this Windows machine, so Jekyll
// runs in ruby:3.3 instead. Gems live in a named volume, so only the first run
// pays for `bundle install`. Requires Docker Desktop to be running.
//
// Nothing here is on the publish path — GitHub builds the real site.
//
// Usage: npm run serve

import { spawn } from 'node:child_process';

const args = [
  'run', '--rm', '-it',
  '-v', `${process.cwd()}:/srv`,
  '-w', '/srv',
  '-v', 'homepage-bundle:/usr/local/bundle',
  '-p', '4000:4000',
  'ruby:3.3',
  'sh', '-c',
  // --host 0.0.0.0 so the port is reachable from outside the container.
  // --force-polling because bind-mounted filesystems do not deliver inotify
  // events, so the watcher would otherwise never notice your edits.
  'bundle install --quiet && bundle exec jekyll serve --host 0.0.0.0 --force-polling',
];

const child = spawn('docker', args, { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
