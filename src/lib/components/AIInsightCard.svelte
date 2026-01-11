<script lang="ts">
	import { Lightbulb } from 'lucide-svelte';
	import { db, type Category, type Transaction, type Budget } from '$lib/db';
	import { liveQuery } from 'dexie';
	import { startOfMonth, endOfMonth, format } from 'date-fns';
	import { generateInsight, type SpendingData } from '$lib/services/gemini';

	interface Props {
		selectedDate: Date;
	}

	let { selectedDate }: Props = $props();

	// In-memory cache for insights per month (persists across component re-renders)
	const insightCache = new Map<string, string>();

	// Component state
	let isLoading = $state(true);
	let insight = $state('');

	/**
	 * Get cache key for a specific month
	 */
	function getCacheKey(date: Date): string {
		return format(date, 'yyyy-MM');
	}

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
	 * Build spending data from transactions and budgets
	 */
	function buildSpendingData(transactions: Transaction[], budgets: Budget[]): SpendingData {
		// Calculate totals
		const totalIncome = transactions
			.filter(t => t.type === 'income')
			.reduce((sum, t) => sum + t.amount, 0);

		const totalExpenses = transactions
			.filter(t => t.type === 'expense')
			.reduce((sum, t) => sum + t.amount, 0);

		// Group expenses by category
		const categoryTotals = new Map<Category, number>();
		transactions
			.filter(t => t.type === 'expense')
			.forEach(t => {
				const current = categoryTotals.get(t.category) || 0;
				categoryTotals.set(t.category, current + t.amount);
			});

		// Build category breakdown with percentages
		const byCategory = Array.from(categoryTotals.entries())
			.map(([category, amount]) => ({
				category,
				amount,
				percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
			}))
			.sort((a, b) => b.amount - a.amount);

		// Build budget status
		const budgetStatus = budgets
			.filter(b => b.limit > 0)
			.map(b => {
				const spent = categoryTotals.get(b.category) || 0;
				return {
					category: b.category,
					spent,
					limit: b.limit,
					percentage: Math.round((spent / b.limit) * 100)
				};
			});

		return {
			totalIncome,
			totalExpenses,
			byCategory,
			budgetStatus
		};
	}

	/**
	 * Fetch insight for the selected month
	 */
	async function fetchInsight(transactions: Transaction[], budgets: Budget[]) {
		const cacheKey = getCacheKey(selectedDate);

		// Check cache first
		if (insightCache.has(cacheKey)) {
			insight = insightCache.get(cacheKey)!;
			isLoading = false;
			return;
		}

		isLoading = true;

		// Build spending data
		const spendingData = buildSpendingData(transactions, budgets);

		// If no transactions, show a default message
		if (transactions.length === 0) {
			insight = 'Belum ada transaksi bulan ini. Mulai catat pengeluaranmu!';
			insightCache.set(cacheKey, insight);
			isLoading = false;
			return;
		}

		// Fetch AI insight
		const result = await generateInsight(spendingData);
		insight = result;
		insightCache.set(cacheKey, result);
		isLoading = false;
	}

	// Fetch data and generate insight when selectedDate changes
	$effect(() => {
		const start = getStartOfMonth(selectedDate);
		const end = getEndOfMonth(selectedDate);
		const cacheKey = getCacheKey(selectedDate);

		// If already cached, use it immediately
		if (insightCache.has(cacheKey)) {
			insight = insightCache.get(cacheKey)!;
			isLoading = false;
			return;
		}

		// Set loading state
		isLoading = true;

		// Create live queries
		const transactionsQuery = liveQuery(async () => {
			return await db.transactions
				.where('date')
				.between(start, end, true, true)
				.toArray();
		});

		const budgetsQuery = liveQuery(async () => {
			return await db.budgets.toArray();
		});

		let transactions: Transaction[] = [];
		let budgets: Budget[] = [];
		let transactionsLoaded = false;
		let budgetsLoaded = false;

		// Subscribe to transactions
		const transactionsSub = transactionsQuery.subscribe(result => {
			if (result) {
				transactions = result;
				transactionsLoaded = true;
				if (budgetsLoaded) {
					fetchInsight(transactions, budgets);
				}
			}
		});

		// Subscribe to budgets
		const budgetsSub = budgetsQuery.subscribe(result => {
			if (result) {
				budgets = result;
				budgetsLoaded = true;
				if (transactionsLoaded) {
					fetchInsight(transactions, budgets);
				}
			}
		});

		// Cleanup
		return () => {
			transactionsSub.unsubscribe();
			budgetsSub.unsubscribe();
		};
	});
</script>

<div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 shadow-sm border border-blue-100">
	<div class="flex items-start gap-3">
		<!-- Lightbulb Icon -->
		<div class="flex-shrink-0 w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
			<Lightbulb size={20} class="text-warning" />
		</div>

		<!-- Content -->
		<div class="flex-1 min-w-0">
			<h3 class="text-sm font-semibold text-text mb-1">Tips Finansial</h3>

			{#if isLoading}
				<!-- Loading Skeleton -->
				<div class="space-y-2 animate-pulse">
					<div class="h-4 bg-gray-200 rounded w-full"></div>
					<div class="h-4 bg-gray-200 rounded w-3/4"></div>
				</div>
			{:else}
				<!-- Insight Text -->
				<p class="text-sm text-gray-600 leading-relaxed">{insight}</p>
			{/if}
		</div>
	</div>
</div>
