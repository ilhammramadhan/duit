<script lang="ts">
	import { db, type Transaction, type Category } from '$lib/db';
	import { liveQuery } from 'dexie';
	import { startOfMonth, endOfMonth } from 'date-fns';
	import { Utensils, Car, Receipt, ShoppingBag, Film, HelpCircle } from 'lucide-svelte';

	interface Props {
		selectedDate: Date;
	}

	let { selectedDate }: Props = $props();

	// Category icons mapping (excluding income)
	const CATEGORY_ICONS: Record<Exclude<Category, 'income'>, typeof Utensils> = {
		food: Utensils,
		transport: Car,
		bills: Receipt,
		shopping: ShoppingBag,
		entertainment: Film,
		other: HelpCircle
	};

	// Category icon background colors
	const CATEGORY_ICON_BG: Record<Exclude<Category, 'income'>, string> = {
		food: 'bg-orange-100 text-orange-600',
		transport: 'bg-blue-100 text-blue-600',
		bills: 'bg-yellow-100 text-yellow-600',
		shopping: 'bg-pink-100 text-pink-600',
		entertainment: 'bg-purple-100 text-purple-600',
		other: 'bg-gray-100 text-gray-600'
	};

	// Category display names
	const CATEGORY_NAMES: Record<Exclude<Category, 'income'>, string> = {
		food: 'Food',
		transport: 'Transport',
		bills: 'Bills',
		shopping: 'Shopping',
		entertainment: 'Entertainment',
		other: 'Other'
	};

	// Progress bar colors based on category
	const CATEGORY_BAR_COLORS: Record<Exclude<Category, 'income'>, string> = {
		food: 'bg-orange-500',
		transport: 'bg-blue-500',
		bills: 'bg-yellow-500',
		shopping: 'bg-pink-500',
		entertainment: 'bg-purple-500',
		other: 'bg-gray-500'
	};

	interface CategorySpending {
		category: Exclude<Category, 'income'>;
		amount: number;
		percentage: number;
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
	 * Format amount in Indonesian Rupiah format with thousand dot separators
	 */
	function formatRupiah(value: number): string {
		return 'Rp ' + value.toLocaleString('id-ID');
	}

	/**
	 * Calculate spending breakdown by category
	 */
	function calculateBreakdown(transactions: Transaction[]): CategorySpending[] {
		// Filter expenses only
		const expenses = transactions.filter(t => t.type === 'expense');

		// Calculate total expenses
		const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

		if (totalExpenses === 0) return [];

		// Group by category
		const categoryTotals = new Map<Exclude<Category, 'income'>, number>();

		for (const t of expenses) {
			const cat = t.category as Exclude<Category, 'income'>;
			categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + t.amount);
		}

		// Convert to array and calculate percentages
		const breakdown: CategorySpending[] = [];
		for (const [category, amount] of categoryTotals) {
			breakdown.push({
				category,
				amount,
				percentage: Math.round((amount / totalExpenses) * 100)
			});
		}

		// Sort by highest spending amount
		breakdown.sort((a, b) => b.amount - a.amount);

		return breakdown;
	}

	// Reactive state for category breakdown
	let categoryBreakdown = $state<CategorySpending[]>([]);

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
				categoryBreakdown = calculateBreakdown(transactions);
			}
		});

		// Cleanup subscription when effect re-runs or component unmounts
		return () => {
			subscription.unsubscribe();
		};
	});
</script>

{#if categoryBreakdown.length > 0}
	<div class="bg-white rounded-xl p-4 shadow-sm border border-border">
		<h3 class="text-sm font-semibold text-text mb-3">Category Breakdown</h3>
		<div class="space-y-3">
			{#each categoryBreakdown as item}
				{@const IconComponent = CATEGORY_ICONS[item.category]}
				<div class="flex items-center gap-3">
					<!-- Category Icon -->
					<div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center {CATEGORY_ICON_BG[item.category]}">
						<IconComponent size={16} />
					</div>

					<!-- Category Details -->
					<div class="flex-1 min-w-0">
						<div class="flex justify-between items-center mb-1">
							<span class="text-sm font-medium text-text">{CATEGORY_NAMES[item.category]}</span>
							<div class="flex items-center gap-2">
								<span class="text-sm font-semibold text-text">{formatRupiah(item.amount)}</span>
								<span class="text-xs text-gray-500 min-w-[3rem] text-right">{item.percentage}%</span>
							</div>
						</div>
						<!-- Progress Bar -->
						<div class="h-2 bg-gray-100 rounded-full overflow-hidden">
							<div
								class="h-full rounded-full transition-all duration-300 {CATEGORY_BAR_COLORS[item.category]}"
								style="width: {item.percentage}%"
							></div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}
