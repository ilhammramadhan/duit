<script lang="ts">
	import { Utensils, Car, Receipt, ShoppingBag, Film, HelpCircle } from 'lucide-svelte';
	import { liveQuery } from 'dexie';
	import { db, type Budget, type Category } from '$lib/db';

	// Only expense categories (not income)
	const EXPENSE_CATEGORIES: Category[] = ['food', 'transport', 'bills', 'shopping', 'entertainment', 'other'];

	// Category icons mapping
	const CATEGORY_ICONS: Record<Category, typeof Utensils> = {
		food: Utensils,
		transport: Car,
		bills: Receipt,
		shopping: ShoppingBag,
		entertainment: Film,
		income: Utensils, // Not used but needed for type
		other: HelpCircle
	};

	// Category display names
	const CATEGORY_LABELS: Record<Category, string> = {
		food: 'Food',
		transport: 'Transport',
		bills: 'Bills',
		shopping: 'Shopping',
		entertainment: 'Entertainment',
		income: 'Income',
		other: 'Other'
	};

	// Category icon background colors
	const CATEGORY_ICON_BG: Record<Category, string> = {
		food: 'bg-orange-100 text-orange-600',
		transport: 'bg-blue-100 text-blue-600',
		bills: 'bg-yellow-100 text-yellow-600',
		shopping: 'bg-pink-100 text-pink-600',
		entertainment: 'bg-purple-100 text-purple-600',
		income: 'bg-green-100 text-green-600',
		other: 'bg-gray-100 text-gray-600'
	};

	/**
	 * Get start of current month (1st day at midnight)
	 */
	function getStartOfMonth(): Date {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
	}

	/**
	 * Get end of current month (last day at 23:59:59.999)
	 */
	function getEndOfMonth(): Date {
		const now = new Date();
		// Next month's first day minus 1 millisecond = last day of current month
		return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
	}

	/**
	 * Format amount in Indonesian Rupiah format with thousand dot separators
	 */
	function formatRupiah(value: number): string {
		return 'Rp ' + value.toLocaleString('id-ID');
	}

	/**
	 * Get bar color based on percentage
	 * 0-79%: blue (#2563EB)
	 * 80-99%: orange (#F59E0B)
	 * 100%+: red (#EF4444)
	 */
	function getBarColor(percentage: number): string {
		if (percentage >= 100) return 'bg-danger';
		if (percentage >= 80) return 'bg-warning';
		return 'bg-primary';
	}

	interface BudgetWithSpending {
		category: Category;
		limit: number;
		spent: number;
		percentage: number;
	}

	// Live query for budgets
	const budgetsQuery = liveQuery(() => db.budgets.toArray());

	// Live query for current month's expenses by category
	const monthlyExpensesQuery = liveQuery(async () => {
		const start = getStartOfMonth();
		const end = getEndOfMonth();
		const transactions = await db.transactions
			.where('date')
			.between(start, end, true, true)
			.toArray();

		// Calculate spending per category
		const spending: Record<Category, number> = {
			food: 0,
			transport: 0,
			bills: 0,
			shopping: 0,
			entertainment: 0,
			income: 0,
			other: 0
		};

		for (const t of transactions) {
			if (t.type === 'expense') {
				spending[t.category] += t.amount;
			}
		}

		return spending;
	});

	// Reactive state for budgets with spending
	let budgetsWithSpending: BudgetWithSpending[] = $state([]);

	// Combine budgets with spending data
	$effect(() => {
		const budgets = $budgetsQuery;
		const spending = $monthlyExpensesQuery;

		if (budgets && spending) {
			// Filter to only categories that have budget limits set (limit > 0)
			budgetsWithSpending = budgets
				.filter((b: Budget) => b.limit > 0 && EXPENSE_CATEGORIES.includes(b.category))
				.map((b: Budget) => {
					const spent = spending[b.category] || 0;
					const percentage = Math.round((spent / b.limit) * 100);
					return {
						category: b.category,
						limit: b.limit,
						spent,
						percentage
					};
				})
				// Sort by percentage (highest first to show most concerning)
				.sort((a: BudgetWithSpending, b: BudgetWithSpending) => b.percentage - a.percentage);
		}
	});
</script>

{#if budgetsWithSpending.length > 0}
	<div class="mt-4 space-y-3">
		<h3 class="text-sm font-medium text-gray-500">Budget Overview</h3>

		{#each budgetsWithSpending as budget (budget.category)}
			{@const IconComponent = CATEGORY_ICONS[budget.category]}
			<div class="bg-white rounded-xl p-3 shadow-sm border border-border">
				<!-- Header: Icon, Category Name, Amount / Limit -->
				<div class="flex items-center gap-3 mb-2">
					<!-- Category Icon -->
					<div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center {CATEGORY_ICON_BG[budget.category]}">
						<IconComponent size={16} />
					</div>

					<!-- Category Name & Percentage -->
					<div class="flex-1 min-w-0">
						<p class="font-medium text-text text-sm">{CATEGORY_LABELS[budget.category]}</p>
					</div>

					<!-- Amount / Limit -->
					<div class="flex-shrink-0 text-right">
						<p class="text-sm {budget.percentage >= 100 ? 'text-danger font-semibold' : budget.percentage >= 80 ? 'text-warning font-medium' : 'text-text'}">
							{formatRupiah(budget.spent)} / {formatRupiah(budget.limit)}
						</p>
						<p class="text-xs {budget.percentage >= 100 ? 'text-danger' : budget.percentage >= 80 ? 'text-warning' : 'text-gray-400'}">
							{budget.percentage}%
						</p>
					</div>
				</div>

				<!-- Progress Bar -->
				<div class="h-2 bg-gray-100 rounded-full overflow-hidden">
					<div
						class="h-full rounded-full transition-all duration-300 {getBarColor(budget.percentage)}"
						style="width: {Math.min(budget.percentage, 100)}%"
					></div>
				</div>
			</div>
		{/each}
	</div>
{/if}
