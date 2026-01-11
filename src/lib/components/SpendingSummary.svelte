<script lang="ts">
	import { db, type Transaction } from '$lib/db';
	import { liveQuery } from 'dexie';

	/**
	 * Get start of today (midnight)
	 */
	function getStartOfToday(): Date {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
	}

	/**
	 * Get end of today (23:59:59.999)
	 */
	function getEndOfToday(): Date {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
	}

	/**
	 * Get start of current week (Monday at midnight)
	 * Week starts on Monday, ends Sunday
	 */
	function getStartOfWeek(): Date {
		const now = new Date();
		const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
		// Convert to Monday-based index: Mon=0, Tue=1, ..., Sun=6
		const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
		const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMonday, 0, 0, 0, 0);
		return monday;
	}

	/**
	 * Get end of current week (Sunday at 23:59:59.999)
	 */
	function getEndOfWeek(): Date {
		const startOfWeek = getStartOfWeek();
		const sunday = new Date(startOfWeek);
		sunday.setDate(sunday.getDate() + 6);
		sunday.setHours(23, 59, 59, 999);
		return sunday;
	}

	/**
	 * Calculate total expenses from transactions
	 * Only counts transactions with type 'expense'
	 */
	function calculateExpenses(transactions: Transaction[]): number {
		return transactions
			.filter(t => t.type === 'expense')
			.reduce((sum, t) => sum + t.amount, 0);
	}

	/**
	 * Format amount in Indonesian Rupiah format with thousand dot separators
	 */
	function formatRupiah(value: number): string {
		return 'Rp ' + value.toLocaleString('id-ID');
	}

	// Live query for today's transactions
	const todayTransactions = liveQuery(async () => {
		const start = getStartOfToday();
		const end = getEndOfToday();
		return await db.transactions
			.where('date')
			.between(start, end, true, true)
			.toArray();
	});

	// Live query for this week's transactions
	const weekTransactions = liveQuery(async () => {
		const start = getStartOfWeek();
		const end = getEndOfWeek();
		return await db.transactions
			.where('date')
			.between(start, end, true, true)
			.toArray();
	});

	// Reactive state for totals
	let todayTotal = $state(0);
	let weekTotal = $state(0);

	// Update totals when transactions change
	$effect(() => {
		const transactions = $todayTransactions;
		if (transactions) {
			todayTotal = calculateExpenses(transactions);
		}
	});

	$effect(() => {
		const transactions = $weekTransactions;
		if (transactions) {
			weekTotal = calculateExpenses(transactions);
		}
	});
</script>

<div class="bg-white rounded-xl p-4 shadow-sm border border-border">
	<div class="flex items-center justify-between">
		<!-- Today's spending -->
		<div class="flex-1 text-center">
			<p class="text-xs text-gray-500 mb-1">Today</p>
			<p class="text-lg font-bold text-text">{formatRupiah(todayTotal)}</p>
		</div>

		<!-- Divider -->
		<div class="w-px h-10 bg-border mx-4"></div>

		<!-- This week's spending -->
		<div class="flex-1 text-center">
			<p class="text-xs text-gray-500 mb-1">This Week</p>
			<p class="text-lg font-bold text-text">{formatRupiah(weekTotal)}</p>
		</div>
	</div>
</div>
