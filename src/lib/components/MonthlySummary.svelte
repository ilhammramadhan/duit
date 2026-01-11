<script lang="ts">
	import { db, type Transaction } from '$lib/db';
	import { liveQuery } from 'dexie';
	import { startOfMonth, endOfMonth } from 'date-fns';

	interface Props {
		selectedDate: Date;
	}

	let { selectedDate }: Props = $props();

	/**
	 * Get start of selected month (midnight on 1st day)
	 */
	function getStartOfMonth(date: Date): Date {
		return startOfMonth(date);
	}

	/**
	 * Get end of selected month (23:59:59.999 on last day)
	 */
	function getEndOfMonth(date: Date): Date {
		const end = endOfMonth(date);
		end.setHours(23, 59, 59, 999);
		return end;
	}

	/**
	 * Calculate total income from transactions
	 */
	function calculateIncome(transactions: Transaction[]): number {
		return transactions
			.filter(t => t.type === 'income')
			.reduce((sum, t) => sum + t.amount, 0);
	}

	/**
	 * Calculate total expenses from transactions
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

	// Reactive state for totals
	let totalIncome = $state(0);
	let totalExpenses = $state(0);
	let net = $derived(totalIncome - totalExpenses);

	// Update when selectedDate changes - query month's transactions
	$effect(() => {
		const start = getStartOfMonth(selectedDate);
		const end = getEndOfMonth(selectedDate);

		// Create live query for selected month's transactions
		const monthlyTransactions = liveQuery(async () => {
			return await db.transactions
				.where('date')
				.between(start, end, true, true)
				.toArray();
		});

		// Subscribe to the live query
		const subscription = monthlyTransactions.subscribe(transactions => {
			if (transactions) {
				totalIncome = calculateIncome(transactions);
				totalExpenses = calculateExpenses(transactions);
			}
		});

		// Cleanup subscription when effect re-runs or component unmounts
		return () => {
			subscription.unsubscribe();
		};
	});
</script>

<div class="bg-white rounded-xl p-4 shadow-sm border border-border">
	<div class="grid grid-cols-3 gap-4">
		<!-- Total Income -->
		<div class="text-center">
			<p class="text-xs text-gray-500 mb-1">Income</p>
			<p class="text-base font-bold text-success">{formatRupiah(totalIncome)}</p>
		</div>

		<!-- Total Expenses -->
		<div class="text-center">
			<p class="text-xs text-gray-500 mb-1">Expenses</p>
			<p class="text-base font-bold text-text">{formatRupiah(totalExpenses)}</p>
		</div>

		<!-- Net (Income - Expenses) -->
		<div class="text-center">
			<p class="text-xs text-gray-500 mb-1">Net</p>
			<p class="text-base font-bold {net >= 0 ? 'text-success' : 'text-danger'}">
				{net >= 0 ? '+' : ''}{formatRupiah(net)}
			</p>
		</div>
	</div>
</div>
