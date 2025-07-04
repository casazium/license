import pkg from 'node-machine-id';
const { machineIdSync } = pkg;

export function getFingerprint() {
  return machineIdSync();
}

export function validateFingerprint(fingerprint) {
  return fingerprint === getFingerprint();
}

export function sameFingerprints(print1, print2) {
  return print1 === print2;
}
