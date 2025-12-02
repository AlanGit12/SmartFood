// src/lib/server/db.js
import { MongoClient } from 'mongodb';
import { env } from '$env/dynamic/private'; // statt process.env

console.log('Private env keys:', Object.keys(env)); // <--- diese Zeile

const uri = env.MONGODB_URI;

if (!uri) {
	console.error('MONGODB_URI ist nicht gesetzt. Aktuelle private env keys:', Object.keys(env));
	throw new Error('MONGODB_URI ist nicht gesetzt (.env fehlt oder falsch).');
}

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
	if (!globalThis._mongoClientPromise) {
		client = new MongoClient(uri);
		globalThis._mongoClientPromise = client.connect();
	}
	clientPromise = globalThis._mongoClientPromise;
} else {
	client = new MongoClient(uri);
	clientPromise = client.connect();
}

export async function getDb() {
	const client = await clientPromise;
	// Name deiner DB – laut Compass z.B. "SmartFood"
	return client.db('SmartFood');
}
