/**
 * Password hashing for the Mock persistence layer (localStorage).
 *
 * Security context: in a real deployment, passwords must be hashed
 * server-side (bcrypt/argon2) and the client should only ever transmit the
 * raw password over HTTPS during login/register - which is exactly what
 * `ApiAuthStrategy` does. There is no server in Mock mode, so this module's
 * job is narrower but still important: a password must never be written to
 * `localStorage` in plaintext, because anyone with access to that browser
 * profile (or a copy of the data, e.g. via XSS-adjacent data exfiltration,
 * shared/public computers, browser extensions, etc.) could otherwise read
 * every user's real password directly.
 *
 * PBKDF2-SHA256 with 100,000 iterations and a random 16-byte salt per user
 * is used via the native Web Crypto API (`SubtleCrypto`), which is
 * available in every modern browser without any extra dependency.
 */

const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH_BYTES = 16;
const DERIVED_KEY_LENGTH_BITS = 256;

function bytesToBase64(bytes: Uint8Array): string {
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return window.btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
	const binary = window.atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

async function deriveBits(
	password: string,
	salt: Uint8Array
): Promise<ArrayBuffer> {
	const keyMaterial = await window.crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveBits"]
	);

	return window.crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt: salt as BufferSource,
			iterations: PBKDF2_ITERATIONS,
			hash: "SHA-256",
		},
		keyMaterial,
		DERIVED_KEY_LENGTH_BITS
	);
}

export interface HashedPassword {
	readonly hash: string;
	readonly salt: string;
}

/** Hashes a plaintext password with a freshly generated random salt. */
export async function hashPassword(password: string): Promise<HashedPassword> {
	const saltBytes = window.crypto.getRandomValues(
		new Uint8Array(SALT_LENGTH_BYTES)
	);
	const derivedBits = await deriveBits(password, saltBytes);

	return {
		hash: bytesToBase64(new Uint8Array(derivedBits)),
		salt: bytesToBase64(saltBytes),
	};
}

/**
 * Compares two equal-length base64 strings in constant time (i.e. the
 * comparison always inspects every character, regardless of where the first
 * mismatch is), so a timing measurement can't reveal how many leading
 * characters of a guessed hash were correct. `===` short-circuits on the
 * first differing character, which theoretically leaks that information.
 */
function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;

	let mismatch = 0;
	for (let i = 0; i < a.length; i += 1) {
		mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return mismatch === 0;
}

/** Verifies a plaintext password against a previously stored hash/salt pair. */
export async function verifyPassword(
	password: string,
	hash: string,
	salt: string
): Promise<boolean> {
	const derivedBits = await deriveBits(password, base64ToBytes(salt));
	const computedHash = bytesToBase64(new Uint8Array(derivedBits));
	return timingSafeEqual(computedHash, hash);
}
