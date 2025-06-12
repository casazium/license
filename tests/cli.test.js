import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, rm } from 'fs/promises';
import path from 'path';
import { execa } from 'execa';
import nock from 'nock';

const cliPath = path.resolve('sdk/cli.js');
const licenseFile = path.resolve('test/temp-license.json');

describe('CLI', () => {
  beforeEach(async () => {
    // Simulate valid license server response
    nock('http://localhost:3001').post('/verify').reply(200, {
      valid: true,
      tier: 'pro',
      reason: null,
    });

    await writeFile(licenseFile, JSON.stringify({ key: 'valid-key' }, null, 2));
  });

  afterEach(async () => {
    await rm(licenseFile, { force: true });
    nock.cleanAll();
  });

  test('verifies a valid license file', async () => {
    const { stdout, exitCode } = await execa('node', [
      cliPath,
      'verify',
      '--key',
      'valid-key',
    ]);

    const json = JSON.parse(stdout);
    expect(json.valid).toBe(true);
    expect(json.tier).toBe('pro');
    // Don't check `reason` if it's not always included
    expect(exitCode).toBe(0);
  });

  test('fails with missing license file', async () => {
    nock.cleanAll();

    nock('http://localhost:3001')
      .post('/verify')
      .reply(404, { valid: false, error: 'License key not found' });

    const { stdout, stderr, exitCode } = await execa(
      'node',
      [cliPath, 'verify', '--key', 'missing-key'],
      { reject: false }
    );

    const output = stdout || stderr;
    expect(output).toMatch(/Error: verifyKey failed with 404/);
    expect(exitCode).not.toBe(0);
  });

  test('shows help with no arguments', async () => {
    const { stdout, stderr, exitCode } = await execa('node', [cliPath], {
      reject: false,
    });

    const output = stdout + stderr;
    expect(output).toMatch(/<command>/i);
    expect(output).toMatch(/Commands:/i);
    expect(exitCode).not.toBe(0);
  });
});
