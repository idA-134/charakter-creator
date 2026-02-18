import { Pool, QueryResult, PoolClient, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL Connection Pool
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	max: 20, // Maximum connections
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
	if (err) {
		console.error('❌ PostgreSQL Verbindungsfehler:', err);
		process.exit(1);
	}
	console.log('✅ PostgreSQL verbunden:', res.rows[0].now);
});

// Handle pool errors
pool.on('error', (err) => {
	console.error('❌ Unerwarteter PostgreSQL Fehler:', err);
});

// Database helper class
class Database {
	private pool: Pool;

	constructor(pool: Pool) {
		this.pool = pool;
	}

	/**
	 * Execute a query and return all rows
	 */
	async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
		const start = Date.now();
		try {
			const res = await this.pool.query<T>(text, params);
			const duration = Date.now() - start;
			if (process.env.NODE_ENV === 'development') {
				console.log('Executed query', { text, duration, rows: res.rowCount });
			}
			return res;
		} catch (error) {
			console.error('Database query error:', { text, error });
			throw error;
		}
	}

	/**
	 * Execute a query and return all rows (alias for backwards compatibility)
	 */
	async all<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<T[]> {
		const result = await this.query<T>(text, params);
		return result.rows;
	}

	/**
	 * Execute a query and return the first row
	 */
	async get<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<T | undefined> {
		const result = await this.query<T>(text, params);
		return result.rows[0];
	}

	/**
	 * Execute a query (INSERT, UPDATE, DELETE) and return result
	 */
	async run(text: string, params?: any[]): Promise<QueryResult> {
		return await this.query(text, params);
	}

	/**
	 * Get a client from the pool for transactions
	 */
	async getClient(): Promise<PoolClient> {
		return await this.pool.connect();
	}

	/**
	 * Execute multiple queries in a transaction
	 */
	async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
		const client = await this.getClient();
		try {
			await client.query('BEGIN');
			const result = await callback(client);
			await client.query('COMMIT');
			return result;
		} catch (error) {
			await client.query('ROLLBACK');
			throw error;
		} finally {
			client.release();
		}
	}

	/**
	 * Close all connections
	 */
	async close(): Promise<void> {
		await this.pool.end();
	}
}

export const db = new Database(pool);
export { pool };
