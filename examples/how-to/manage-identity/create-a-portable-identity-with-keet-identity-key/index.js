import Identity from 'keet-identity-key'
import crypto from 'hypercore-crypto'

// Generate once and persist it somewhere safe (treat it like a wallet seed).
const mnemonic = Identity.generateMnemonic()

const identity = await Identity.from({ mnemonic })
// identity.identityPublicKey is the same on every device that loads this mnemonic.

// Each device gets its own ephemeral key pair, attested by the identity.
const deviceKeyPair = crypto.keyPair()
const deviceProof = await identity.bootstrap(deviceKeyPair.publicKey)

// Sign data: attest a payload with the device key. The proof chains back to the identity.
const payload = Buffer.from('hello from this device')
const proof = Identity.attestData(payload, deviceKeyPair, deviceProof)

// Verify data: any peer can confirm authorship with only the public identity key.
const ok = Identity.verify(proof, payload, {
  expectedIdentity: identity.identityPublicKey
})
// ok is truthy when the proof is valid for that identity.

console.log('identity:', identity.identityPublicKey.toString('hex'))
console.log('verified:', !!ok)
