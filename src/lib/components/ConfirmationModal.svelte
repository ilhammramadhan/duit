<script lang="ts">
	import { X } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';
	import { addTransaction, updateTransaction, checkBudgetWarning, type Category, type TransactionType, type Transaction, type BudgetWarning } from '$lib/db';

	// All available categories
	const CATEGORIES: Category[] = ['food', 'transport', 'bills', 'shopping', 'entertainment', 'income', 'other'];

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

	// Props
	interface Props {
		show: boolean;
		description: string;
		amount: number;
		suggestedCategory: Category;
		isEditMode?: boolean;
		editingTransaction?: Transaction | null;
	}

	let { show = $bindable(), description, amount, suggestedCategory, isEditMode = false, editingTransaction = null }: Props = $props();

	// Local state
	let selectedCategory: Category = $state('other');
	let transactionType: TransactionType = $state('expense');
	let isSaving = $state(false);

	// Update selected category when suggested category changes or when editing
	$effect(() => {
		if (isEditMode && editingTransaction) {
			selectedCategory = editingTransaction.category;
			transactionType = editingTransaction.type;
		} else {
			selectedCategory = suggestedCategory;
			// Auto-set type to income if income category is suggested
			transactionType = suggestedCategory === 'income' ? 'income' : 'expense';
		}
	});

	const dispatch = createEventDispatcher<{ confirm: void; cancel: void; budgetWarning: BudgetWarning }>();

	/**
	 * Format amount in Indonesian Rupiah format
	 */
	function formatRupiah(value: number): string {
		return 'Rp ' + value.toLocaleString('id-ID');
	}

	/**
	 * Handle category selection
	 */
	function selectCategory(category: Category) {
		selectedCategory = category;
		// Auto-set type based on category
		if (category === 'income') {
			transactionType = 'income';
		} else if (transactionType === 'income') {
			// Switching from income category to expense category
			transactionType = 'expense';
		}
	}

	/**
	 * Toggle between expense and income type
	 */
	function toggleType() {
		transactionType = transactionType === 'expense' ? 'income' : 'expense';
		// If switching to income type, suggest income category if not already
		if (transactionType === 'income' && selectedCategory !== 'income') {
			selectedCategory = 'income';
		}
	}

	/**
	 * Save transaction to IndexedDB (add new or update existing)
	 */
	async function handleConfirm() {
		if (isSaving) return;

		isSaving = true;
		try {
			if (isEditMode && editingTransaction?.id) {
				// Update existing transaction
				await updateTransaction(editingTransaction.id, {
					description,
					amount,
					category: selectedCategory,
					type: transactionType,
					date: editingTransaction.date
				});
			} else {
				// Add new transaction
				await addTransaction({
					description,
					amount,
					category: selectedCategory,
					type: transactionType,
					date: new Date()
				});
			}

			// Check for budget warning after saving (only for expenses)
			if (transactionType === 'expense') {
				const warning = await checkBudgetWarning(selectedCategory);
				if (warning) {
					dispatch('budgetWarning', warning);
				}
			}

			dispatch('confirm');
			show = false;
		} catch (error) {
			console.error('Failed to save transaction:', error);
		} finally {
			isSaving = false;
		}
	}

	/**
	 * Cancel and close modal
	 */
	function handleCancel() {
		dispatch('cancel');
		show = false;
	}

	/**
	 * Handle backdrop click
	 */
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleCancel();
		}
	}

	/**
	 * Handle escape key
	 */
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleCancel();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if show}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
		onclick={handleBackdropClick}
		role="button"
		tabindex="-1"
	>
		<!-- Modal -->
		<div class="bg-white rounded-t-2xl w-full max-w-lg p-6 pb-8 animate-slide-up">
			<!-- Header -->
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-lg font-semibold text-text">{isEditMode ? 'Edit Transaction' : 'Confirm Transaction'}</h2>
				<button
					type="button"
					onclick={handleCancel}
					class="p-2 rounded-full hover:bg-gray-100 transition-colors"
					aria-label="Close"
				>
					<X size={20} class="text-gray-500" />
				</button>
			</div>

			<!-- Transaction details -->
			<div class="space-y-4 mb-6">
				<!-- Description -->
				<div class="bg-background rounded-lg p-4">
					<p class="text-sm text-gray-500 mb-1">Description</p>
					<p class="text-text font-medium capitalize">{description}</p>
				</div>

				<!-- Amount -->
				<div class="bg-background rounded-lg p-4">
					<p class="text-sm text-gray-500 mb-1">Amount</p>
					<p class="text-2xl font-bold text-text">{formatRupiah(amount)}</p>
				</div>
			</div>

			<!-- Type toggle -->
			<div class="mb-6">
				<p class="text-sm text-gray-500 mb-2">Type</p>
				<div class="flex bg-background rounded-lg p-1">
					<button
						type="button"
						onclick={() => (transactionType = 'expense')}
						class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all {transactionType === 'expense'
							? 'bg-white text-danger shadow-sm'
							: 'text-gray-500 hover:text-text'}"
					>
						Expense
					</button>
					<button
						type="button"
						onclick={() => (transactionType = 'income')}
						class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all {transactionType === 'income'
							? 'bg-white text-success shadow-sm'
							: 'text-gray-500 hover:text-text'}"
					>
						Income
					</button>
				</div>
			</div>

			<!-- Category selection -->
			<div class="mb-6">
				<p class="text-sm text-gray-500 mb-2">Category</p>
				<div class="flex flex-wrap gap-2">
					{#each CATEGORIES as category}
						<button
							type="button"
							onclick={() => selectCategory(category)}
							class="px-4 py-2 rounded-full text-sm font-medium transition-all {selectedCategory === category
								? 'bg-primary text-white'
								: 'bg-background text-text hover:bg-gray-200'}"
						>
							{CATEGORY_LABELS[category]}
						</button>
					{/each}
				</div>
			</div>

			<!-- Action buttons -->
			<div class="flex gap-3">
				<button
					type="button"
					onclick={handleCancel}
					class="flex-1 py-3 px-4 rounded-lg border border-border text-text font-medium hover:bg-gray-50 transition-colors"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={handleConfirm}
					disabled={isSaving}
					class="flex-1 py-3 px-4 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isSaving ? 'Saving...' : isEditMode ? 'Save' : 'Confirm'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes slide-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	.animate-slide-up {
		animation: slide-up 0.3s ease-out;
	}
</style>
