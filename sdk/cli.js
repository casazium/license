// sdk/cli.js
/* c8 ignore start */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { CasaziumLicenseClient } from './client.js';
import fs from 'fs';
import path from 'path';
import { createSign } from 'node:crypto';

const argv = yargs(hideBin(process.argv))
  .command('verify', 'Verify a license key', (yargs) => {
    yargs.option('key', { type: 'string', demandOption: true });
  })
  .command('track', 'Track a usage metric', (yargs) => {
    yargs.option('key', { type: 'string', demandOption: true });
    yargs.option('metric', { type: 'string', demandOption: true });
    yargs.option('increment', { type: 'number', default: 1 });
  })
  .command('activate', 'Activate a license for an instance/device', (yargs) => {
    yargs.option('key', { type: 'string', demandOption: true });
    yargs.option('instance-id', { type: 'string', demandOption: true });
  })
  .command('report', 'Get usage report for a license key', (yargs) => {
    yargs.option('key', { type: 'string', demandOption: true });
  })
  .command('revoke', 'Revoke a license key', (yargs) => {
    yargs.option('key', { type: 'string', demandOption: true });
  })
  .command('list', 'List all licenses', (yargs) => {
    yargs
      .option('product-id', {
        describe: 'Product ID to filter by',
        type: 'string',
      })
      .option('status', {
        describe: 'Filter by status',
        choices: ['active', 'revoked'],
      })
      .option('page', {
        describe: 'Page number',
        type: 'number',
        default: 1,
      })
      .option('limit', {
        describe: 'Items per page',
        type: 'number',
        default: 20,
      })
      .option('admin-token', {
        describe: 'Admin token to access protected endpoints',
        type: 'string',
        demandOption: true,
      });
  })
  .command('sign', 'Sign a license file using a private key', (yargs) => {
    yargs.option('license', { type: 'string', demandOption: true });
    yargs.option('private-key', { type: 'string', demandOption: true });
  })
  .command(
    'verify-file',
    'Verify a signed license file using a public key',
    (yargs) => {
      yargs.option('license', { type: 'string', demandOption: true });
      yargs.option('signature', { type: 'string', demandOption: true });
      yargs.option('public-key', { type: 'string', demandOption: true });
    }
  )
  .demandCommand(1)
  .help().argv;

const command = argv._[0];

const client = new CasaziumLicenseClient({
  baseUrl: 'http://localhost:3001',
  publicKey: argv.publicKey
    ? fs.readFileSync(argv.publicKey, 'utf8')
    : undefined,
  adminToken: argv.adminToken,
});

(async () => {
  try {
    let res;
    switch (command) {
      case 'verify':
        res = await client.verifyKey(argv.key);
        break;
      case 'track':
        res = await client.trackUsage(argv.key, argv.metric, argv.increment);
        break;
      case 'activate':
        res = await client.activate(argv.key, argv['instance-id']);
        break;
      case 'report':
        res = await client.getUsageReport(argv.key);
        break;
      case 'revoke':
        res = await client.revoke(argv.key);
        break;
      case 'list':
        res = await client.listLicenses({
          product_id: argv['product-id'],
          status: argv.status,
          page: argv.page,
          limit: argv.limit,
        });
        break;
      case 'sign': {
        const license = JSON.parse(fs.readFileSync(argv.license, 'utf8'));
        const privateKey = fs.readFileSync(argv['private-key'], 'utf8');
        const signer = createSign('SHA256');
        signer.update(JSON.stringify(license));
        signer.end();
        const signature = signer.sign(privateKey, 'base64');
        console.log(signature);
        return;
      }
      case 'verify-file': {
        const license = JSON.parse(fs.readFileSync(argv.license, 'utf8'));
        const signature = argv.signature;
        const publicKey = fs.readFileSync(argv['public-key'], 'utf8');
        const valid = client.verifySignedFile({
          license,
          signature,
          publicKey,
        });
        console.log(JSON.stringify({ valid }, null, 2));
        return;
      }
      default:
        console.error('Unknown command');
        process.exit(1);
    }
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
