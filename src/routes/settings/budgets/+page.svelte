<script lang="ts">
	import { Utensils, Car, Receipt, ShoppingBag, Film, HelpCircle, ChevronLeft, Check } from 'lucide-svelte';
	import { liveQuery } from 'dexie';
	import { db, setBudget, type Category, type Budget } from '$lib/db';

	// Expense categories only (no income)
	const EXPENSE_CATEGORIES: Category[] = ['food', 'transport', 'bills', 'shopping', 'entertainment', 'other'];

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

	// Category icons mapping
	const CATEGORY_ICONS: Record<Category, typeof Utensils> = {
		food: Utensils,
		transport: Car,
		bills: Receipt,
		shopping: ShoppingBag,
		entertainment: Film,
		income: Utensils, // Not used, but needed for type
		other: HelpCircle
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

	// Local state for input values (keyed by category)
	let inputValues: Record<string, string> = $state({});

	// Load budgets from IndexedDB reactively
	let budgets: Budget[] = $state([]);

	$effect(() => {
		const subscription = liveQuery(() => db.budgets.toArray()).subscribe({
			next: (result) => {
				budgets = result;
				// Initialize input values from loaded budgets
				for (const budget of result) {
					if (budget.limit > 0) {
						inputValues[budget.category] = formatInputValue(budget.limit);
					}
				}
			},
			error: (err) => console.error('Failed to load budgets:', err)
		});

		return () => subscription.unsubscribe();
	});

	// Toast state
	let showToast = $state(false);
	let toastMessage = $state('');

	/**
	 * Format number for input display (with thousand separators)
	 */
	function formatInputValue(amount: number): string {
		if (amount === 0) return '';
		return amount.toLocaleString('id-ID');
	}

	/**
	 * Parse input string to number (remove separators)
	 */
	function parseInputValue(value: string): number {
		// Remove all non-digit characters
		const cleaned = value.replace(/[^\d]/g, '');
		return cleaned ? parseInt(cleaned, 10) : 0;
	}

	/**
	 * Handle input blur - save to database
	 */
	async function handleBlur(category: Category) {
		const value = inputValues[category] || '';
		const amount = parseInputValue(value);

		// Format the input value
		if (amount > 0) {
			inputValues[category] = formatInputValue(amount);
		} else {
			inputValues[category] = '';
		}

		// Save to IndexedDB
		await setBudget(category, amount);

		// Show toast
		if (amount > 0) {
			toastMessage = `${CATEGORY_LABELS[category]} budget set to Rp ${amount.toLocaleString('id-ID')}`;
		} else {
			toastMessage = `${CATEGORY_LABELS[category]} budget limit removed`;
		}
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 3000);
	}

	/**
	 * Handle Enter key - save to database
	 */
	function handleKeydown(event: KeyboardEvent, category: Category) {
		if (event.key === 'Enter') {
			(event.target as HTMLInputElement).blur();
		}
	}
</script>

<div class="min-h-screen bg-background">
	<!-- Header -->
	<div class="sticky top-0 bg-background border-b border-border z-10">
		<div class="flex items-center gap-3 p-4">
			<a href="/settings" class="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
				<ChevronLeft size={24} class="text-text" />
			</a>
			<h1 class="text-xl font-bold text-text">Budget Limits</h1>
		</div>
	</div>

	<!-- Description -->
	<div class="px-4 py-3 bg-blue-50 border-b border-blue-100">
		<p class="text-sm text-blue-700">
			Set monthly spending limits per category. Leave empty for no limit.
		</p>
	</div>

	<!-- Budget Items -->
	<div class="divide-y divide-border">
		{#each EXPENSE_CATEGORIES as category}
			{@const IconComponent = CATEGORY_ICONS[category]}
			<div class="flex items-center gap-4 p-4 bg-white">
				<!-- Category Icon -->
				<div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center {CATEGORY_ICON_BG[category]}">
					<IconComponent size={20} />
				</div>

				<!-- Category Name -->
				<div class="flex-1">
					<p class="font-medium text-text">{CATEGORY_LABELS[category]}</p>
				</div>

				<!-- Input Field -->
				<div class="flex items-center gap-2">
					<span class="text-gray-500 text-sm">Rp</span>
					<input
						type="text"
						inputmode="numeric"
						placeholder="0"
						class="w-28 px-3 py-2 text-right border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
						bind:value={inputValues[category]}
						onblur={() => handleBlur(category)}
						onkeydown={(e) => handleKeydown(e, category)}
					/>
				</div>
			</div>
		{/each}
	</div>

	<!-- Help Text -->
	<div class="p-4">
		<p class="text-sm text-gray-500 text-center">
			Budgets reset at the start of each month
		</p>
	</div>
</div>

<!-- Toast Notification -->
{#if showToast}
	<div class="fixed bottom-20 left-4 right-4 flex justify-center z-50">
		<div class="flex items-center gap-2 bg-success text-white px-4 py-3 rounded-lg shadow-lg">
			<Check size={18} />
			<span class="text-sm font-medium">{toastMessage}</span>
		</div>
	</div>
{/if}
