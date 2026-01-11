<script lang="ts">
	import { liveQuery } from 'dexie';
	import MonthSelector from '$lib/components/MonthSelector.svelte';
	import MonthlySummary from '$lib/components/MonthlySummary.svelte';
	import CategoryBreakdown from '$lib/components/CategoryBreakdown.svelte';
	import AIInsightCard from '$lib/components/AIInsightCard.svelte';
	import TransactionCard from '$lib/components/TransactionCard.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import { startOfMonth, endOfMonth, format } from 'date-fns';
	import { id as idLocale } from 'date-fns/locale';
	import { db, deleteTransaction, type Category, type Transaction, type BudgetWarning } from '$lib/db';
	import { AlertTriangle, AlertCircle, X } from 'lucide-svelte';

	// Selected month state - defaults to current month
	let selectedDate = $state(startOfMonth(new Date()));

	// Transactions for selected month, grouped by date
	let transactions: Transaction[] = $state([]);

	// Subscribe to transactions for the selected month
	$effect(() => {
		const monthStart = startOfMonth(selectedDate);
		const monthEnd = endOfMonth(selectedDate);
		// Set end of day for monthEnd
		monthEnd.setHours(23, 59, 59, 999);

		const query = liveQuery(() =>
			db.transactions
				.where('date')
				.between(monthStart, monthEnd, true, true)
				.toArray()
		);

		const subscription = query.subscribe({
			next: (value) => {
				// Sort by date descending (newest first)
				transactions = value.sort((a, b) => b.date.getTime() - a.date.getTime());
			},
			error: (err) => {
				console.error('Failed to load transactions:', err);
			}
		});

		return () => subscription.unsubscribe();
	});

	// Group transactions by date
	interface TransactionGroup {
		dateKey: string;
		dateLabel: string;
		transactions: Transaction[];
	}

	let groupedTransactions = $derived.by(() => {
		const groups = new Map<string, Transaction[]>();

		for (const transaction of transactions) {
			const dateKey = format(transaction.date, 'yyyy-MM-dd');
			if (!groups.has(dateKey)) {
				groups.set(dateKey, []);
			}
			groups.get(dateKey)!.push(transaction);
		}

		// Convert to array with formatted labels
		const result: TransactionGroup[] = [];
		for (const [dateKey, txs] of groups.entries()) {
			const date = new Date(dateKey);
			const dateLabel = format(date, 'EEEE, d MMMM', { locale: idLocale });
			result.push({
				dateKey,
				dateLabel,
				transactions: txs
			});
		}

		// Sort by date descending (newest first)
		result.sort((a, b) => b.dateKey.localeCompare(a.dateKey));

		return result;
	});

	// Modal state for editing
	let showModal = $state(false);
	let parsedDescription = $state('');
	let parsedAmount = $state(0);
	let suggestedCategory = $state<Category>('other');
	let isEditMode = $state(false);
	let editingTransaction = $state<Transaction | null>(null);

	// Delete confirmation state
	let showDeleteConfirm = $state(false);
	let deletingTransaction = $state<Transaction | null>(null);

	// Swipe tracking state
	let swipeStartX = $state(0);
	let swipingTransactionId = $state<number | null>(null);
	let swipeOffset = $state(0);

	// Budget warning toast state
	let showBudgetToast = $state(false);
	let budgetToastType = $state<'warning' | 'danger'>('warning');
	let budgetToastMessage = $state('');
	let budgetToastTimeout: ReturnType<typeof setTimeout> | null = null;

	// Category labels for toast messages
	const CATEGORY_LABELS: Record<Category, string> = {
		food: 'Food',
		transport: 'Transport',
		bills: 'Bills',
		shopping: 'Shopping',
		entertainment: 'Entertainment',
		income: 'Income',
		other: 'Other'
	};

	function handleMonthChange(newDate: Date) {
		selectedDate = newDate;
	}

	function handleTransactionClick(transaction: Transaction) {
		// Open modal in edit mode
		parsedDescription = transaction.description;
		parsedAmount = transaction.amount;
		suggestedCategory = transaction.category;
		isEditMode = true;
		editingTransaction = transaction;
		showModal = true;
	}

	function handleConfirm() {
		// Transaction was saved/updated successfully
		isEditMode = false;
		editingTransaction = null;
	}

	function handleCancel() {
		// Modal was cancelled
		isEditMode = false;
		editingTransaction = null;
	}

	// Swipe handlers
	function handleTouchStart(event: TouchEvent, transaction: Transaction) {
		swipeStartX = event.touches[0].clientX;
		swipingTransactionId = transaction.id ?? null;
		swipeOffset = 0;
	}

	function handleTouchMove(event: TouchEvent) {
		if (swipingTransactionId === null) return;

		const currentX = event.touches[0].clientX;
		const diff = swipeStartX - currentX;

		// Only allow left swipe (positive diff)
		if (diff > 0) {
			swipeOffset = Math.min(diff, 100); // Cap at 100px
		} else {
			swipeOffset = 0;
		}
	}

	function handleTouchEnd() {
		if (swipingTransactionId === null) return;

		// If swiped more than 60px, show delete confirmation
		if (swipeOffset > 60) {
			const transaction = transactions.find((t) => t.id === swipingTransactionId);
			if (transaction) {
				deletingTransaction = transaction;
				showDeleteConfirm = true;
			}
		}

		// Reset swipe state
		swipingTransactionId = null;
		swipeOffset = 0;
	}

	async function confirmDelete() {
		if (!deletingTransaction?.id) return;

		try {
			await deleteTransaction(deletingTransaction.id);
		} catch (error) {
			console.error('Failed to delete transaction:', error);
		}

		showDeleteConfirm = false;
		deletingTransaction = null;
	}

	function cancelDelete() {
		showDeleteConfirm = false;
		deletingTransaction = null;
	}

	/**
	 * Format amount in Indonesian Rupiah format
	 */
	function formatRupiah(value: number): string {
		return 'Rp ' + value.toLocaleString('id-ID');
	}

	/**
	 * Handle budget warning from ConfirmationModal
	 */
	function handleBudgetWarning(event: CustomEvent<BudgetWarning>) {
		const warning = event.detail;

		// Clear any existing timeout
		if (budgetToastTimeout) {
			clearTimeout(budgetToastTimeout);
		}

		// Set toast type and message based on warning type
		if (warning.type === 'exceeded') {
			budgetToastType = 'danger';
			budgetToastMessage = `${CATEGORY_LABELS[warning.category]} budget exceeded by ${formatRupiah(warning.exceededBy || 0)}`;
		} else if (warning.type === 'approaching') {
			budgetToastType = 'warning';
			budgetToastMessage = `${CATEGORY_LABELS[warning.category]} budget at ${warning.percentage}%`;
		} else {
			return; // No warning needed
		}

		// Show toast
		showBudgetToast = true;

		// Auto-dismiss after 4 seconds
		budgetToastTimeout = setTimeout(() => {
			showBudgetToast = false;
		}, 4000);
	}

	/**
	 * Dismiss budget warning toast manually
	 */
	function dismissBudgetToast() {
		if (budgetToastTimeout) {
			clearTimeout(budgetToastTimeout);
		}
		showBudgetToast = false;
	}
</script>

<div class="p-4 pb-20 space-y-4">
	<!-- Month Selector -->
	<MonthSelector {selectedDate} onMonthChange={handleMonthChange} />

	<!-- AI Insights Card -->
	<AIInsightCard {selectedDate} />

	<!-- Income vs Expenses Summary -->
	<MonthlySummary {selectedDate} />

	<!-- Category Breakdown -->
	<CategoryBreakdown {selectedDate} />

	<!-- Monthly Transactions List -->
	<div class="mt-6">
		<h2 class="text-lg font-semibold text-text mb-3">Transactions</h2>

		{#if transactions.length === 0}
			<!-- Empty state -->
			<div class="bg-white rounded-xl p-8 text-center">
				<p class="text-gray-400 text-sm">No transactions this month</p>
				<p class="text-gray-300 text-xs mt-1">Add transactions on the Home tab</p>
			</div>
		{:else}
			<!-- Grouped transaction list -->
			<div class="space-y-4">
				{#each groupedTransactions as group (group.dateKey)}
					<!-- Date header -->
					<div>
						<h3 class="text-sm font-medium text-gray-500 mb-2 capitalize">{group.dateLabel}</h3>
						<div class="space-y-2">
							{#each group.transactions as transaction (transaction.id)}
								<div
									class="relative overflow-hidden rounded-xl"
									ontouchstart={(e) => handleTouchStart(e, transaction)}
									ontouchmove={handleTouchMove}
									ontouchend={handleTouchEnd}
								>
									<!-- Delete indicator background -->
									<div
										class="absolute inset-y-0 right-0 bg-danger flex items-center justify-end pr-4 rounded-xl"
										style="width: {swipingTransactionId === transaction.id ? Math.max(swipeOffset, 0) : 0}px"
									>
										<span class="text-white text-sm font-medium">Delete</span>
									</div>

									<!-- Transaction card -->
									<div
										class="relative transition-transform"
										style="transform: translateX({swipingTransactionId === transaction.id ? -swipeOffset : 0}px)"
									>
										<TransactionCard
											{transaction}
											onclick={() => handleTransactionClick(transaction)}
										/>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<ConfirmationModal
	bind:show={showModal}
	description={parsedDescription}
	amount={parsedAmount}
	{suggestedCategory}
	{isEditMode}
	{editingTransaction}
	on:confirm={handleConfirm}
	on:cancel={handleCancel}
	on:budgetWarning={handleBudgetWarning}
/>

<!-- Delete Confirmation Dialog -->
{#if showDeleteConfirm}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
		onclick={cancelDelete}
		role="button"
		tabindex="-1"
	>
		<div
			class="bg-white rounded-xl p-6 w-full max-w-sm"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			tabindex="-1"
		>
			<h3 class="text-lg font-semibold text-text mb-2">Delete Transaction?</h3>
			<p class="text-gray-500 text-sm mb-6">
				Are you sure you want to delete "{deletingTransaction?.description}"? This action cannot be undone.
			</p>
			<div class="flex gap-3">
				<button
					type="button"
					onclick={cancelDelete}
					class="flex-1 py-2.5 px-4 rounded-lg border border-border text-text font-medium hover:bg-gray-50 transition-colors"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={confirmDelete}
					class="flex-1 py-2.5 px-4 rounded-lg bg-danger text-white font-medium hover:bg-danger/90 transition-colors"
				>
					Delete
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Budget Warning Toast -->
{#if showBudgetToast}
	<div class="fixed top-4 left-4 right-4 z-50 flex justify-center animate-slide-down">
		<div
			class="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg max-w-sm w-full {budgetToastType === 'danger' ? 'bg-danger' : 'bg-warning'} text-white"
		>
			{#if budgetToastType === 'danger'}
				<AlertCircle size={20} class="flex-shrink-0" />
			{:else}
				<AlertTriangle size={20} class="flex-shrink-0" />
			{/if}
			<span class="text-sm font-medium flex-1">{budgetToastMessage}</span>
			<button
				type="button"
				onclick={dismissBudgetToast}
				class="p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
				aria-label="Dismiss"
			>
				<X size={16} />
			</button>
		</div>
	</div>
{/if}

<style>
	@keyframes slide-down {
		from {
			transform: translateY(-100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.animate-slide-down {
		animation: slide-down 0.3s ease-out;
	}
</style>
