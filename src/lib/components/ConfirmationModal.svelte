<script lang="ts">
	import { X, Calendar, Trash2 } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';
	import { format } from 'date-fns';
	import { id as idLocale } from 'date-fns/locale';
	import { addTransaction, updateTransaction, deleteTransaction, checkBudgetWarning, type Category, type TransactionType, type Transaction, type BudgetWarning } from '$lib/db';
	import { getCategoryDisplayName } from '$lib/stores/categoryNames';

	// All available categories
	const CATEGORIES: Category[] = ['food', 'transport', 'bills', 'shopping', 'entertainment', 'income', 'other'];

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

	// Local state for form fields (editable)
	let editableDescription = $state('');
	let editableAmount = $state(0);
	let editableAmountString = $state(''); // For formatted input display
	let editableDate = $state<Date>(new Date());
	let selectedCategory: Category = $state('other');
	let transactionType: TransactionType = $state('expense');
	let isSaving = $state(false);
	let isDeleting = $state(false);
	let showDeleteConfirm = $state(false);

	// Update form fields when modal opens or editing transaction changes
	$effect(() => {
		if (show) {
			if (isEditMode && editingTransaction) {
				editableDescription = editingTransaction.description;
				editableAmount = editingTransaction.amount;
				editableAmountString = editingTransaction.amount.toLocaleString('id-ID');
				editableDate = editingTransaction.date;
				selectedCategory = editingTransaction.category;
				transactionType = editingTransaction.type;
			} else {
				editableDescription = description;
				editableAmount = amount;
				editableAmountString = amount.toLocaleString('id-ID');
				editableDate = new Date();
				selectedCategory = suggestedCategory;
				// Auto-set type to income if income category is suggested
				transactionType = suggestedCategory === 'income' ? 'income' : 'expense';
			}
			// Reset delete confirmation when modal opens
			showDeleteConfirm = false;
		}
	});

	const dispatch = createEventDispatcher<{ confirm: void; cancel: void; delete: void; budgetWarning: BudgetWarning }>();

	/**
	 * Format amount in Indonesian Rupiah format
	 */
	function formatRupiah(value: number): string {
		return 'Rp ' + value.toLocaleString('id-ID');
	}

	/**
	 * Parse amount string input (handles thousand separators)
	 */
	function parseAmountInput(value: string): number {
		// Remove all non-digit characters
		const digits = value.replace(/\D/g, '');
		return parseInt(digits, 10) || 0;
	}

	/**
	 * Handle amount input change
	 */
	function handleAmountInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const rawValue = target.value;

		// Parse and store the numeric value
		editableAmount = parseAmountInput(rawValue);

		// Format for display
		if (editableAmount > 0) {
			editableAmountString = editableAmount.toLocaleString('id-ID');
		} else {
			editableAmountString = '';
		}
	}

	/**
	 * Format date for date input (yyyy-MM-dd)
	 */
	function formatDateForInput(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	/**
	 * Handle date input change
	 */
	function handleDateChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.value) {
			editableDate = new Date(target.value + 'T12:00:00');
		}
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
		if (isSaving || editableAmount <= 0 || !editableDescription.trim()) return;

		isSaving = true;
		try {
			if (isEditMode && editingTransaction?.id) {
				// Update existing transaction with editable fields
				await updateTransaction(editingTransaction.id, {
					description: editableDescription.trim(),
					amount: editableAmount,
					category: selectedCategory,
					type: transactionType,
					date: editableDate
				});
			} else {
				// Add new transaction
				await addTransaction({
					description: editableDescription.trim(),
					amount: editableAmount,
					category: selectedCategory,
					type: transactionType,
					date: editableDate
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
	 * Show delete confirmation dialog
	 */
	function handleDeleteClick() {
		showDeleteConfirm = true;
	}

	/**
	 * Cancel delete and hide confirmation
	 */
	function cancelDelete() {
		showDeleteConfirm = false;
	}

	/**
	 * Confirm delete and remove transaction
	 */
	async function confirmDelete() {
		if (isDeleting || !editingTransaction?.id) return;

		isDeleting = true;
		try {
			await deleteTransaction(editingTransaction.id);
			dispatch('delete');
			show = false;
		} catch (error) {
			console.error('Failed to delete transaction:', error);
		} finally {
			isDeleting = false;
			showDeleteConfirm = false;
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
		<div class="bg-white dark:bg-gray-800 rounded-t-2xl w-full max-w-lg p-6 pb-8 animate-slide-up">
			<!-- Header -->
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-lg font-semibold text-text dark:text-gray-100">{isEditMode ? 'Edit Transaction' : 'Confirm Transaction'}</h2>
				<button
					type="button"
					onclick={handleCancel}
					class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
					aria-label="Close"
				>
					<X size={20} class="text-gray-500 dark:text-gray-400" />
				</button>
			</div>

			<!-- Transaction details -->
			<div class="space-y-4 mb-6">
				<!-- Description (editable) -->
				<div class="bg-background dark:bg-gray-700 rounded-lg p-4">
					<label for="description-input" class="text-sm text-gray-500 dark:text-gray-400 mb-1 block">Description</label>
					<input
						id="description-input"
						type="text"
						bind:value={editableDescription}
						placeholder="Enter description"
						class="w-full bg-transparent text-text dark:text-gray-100 font-medium capitalize text-base border-none outline-none focus:ring-0 p-0"
					/>
				</div>

				<!-- Amount (editable) -->
				<div class="bg-background dark:bg-gray-700 rounded-lg p-4">
					<label for="amount-input" class="text-sm text-gray-500 dark:text-gray-400 mb-1 block">Amount</label>
					<div class="flex items-center">
						<span class="text-2xl font-bold text-text dark:text-gray-100 mr-1">Rp</span>
						<input
							id="amount-input"
							type="text"
							inputmode="numeric"
							value={editableAmountString}
							oninput={handleAmountInput}
							placeholder="0"
							class="flex-1 bg-transparent text-2xl font-bold text-text dark:text-gray-100 border-none outline-none focus:ring-0 p-0"
						/>
					</div>
				</div>

				<!-- Date (editable) -->
				<div class="bg-background dark:bg-gray-700 rounded-lg p-4">
					<label for="date-input" class="text-sm text-gray-500 dark:text-gray-400 mb-1 block">Date</label>
					<div class="flex items-center gap-2">
						<Calendar size={20} class="text-gray-400 dark:text-gray-500" />
						<input
							id="date-input"
							type="date"
							value={formatDateForInput(editableDate)}
							onchange={handleDateChange}
							max={formatDateForInput(new Date())}
							class="flex-1 bg-transparent text-text dark:text-gray-100 font-medium border-none outline-none focus:ring-0 p-0"
						/>
					</div>
					<p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
						{format(editableDate, 'EEEE, d MMMM yyyy', { locale: idLocale })}
					</p>
				</div>
			</div>

			<!-- Type toggle -->
			<div class="mb-6">
				<p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Type</p>
				<div class="flex bg-background dark:bg-gray-700 rounded-lg p-1">
					<button
						type="button"
						onclick={() => (transactionType = 'expense')}
						class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all {transactionType === 'expense'
							? 'bg-white dark:bg-gray-600 text-danger shadow-sm'
							: 'text-gray-500 dark:text-gray-400 hover:text-text dark:hover:text-gray-200'}"
					>
						Expense
					</button>
					<button
						type="button"
						onclick={() => (transactionType = 'income')}
						class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all {transactionType === 'income'
							? 'bg-white dark:bg-gray-600 text-success shadow-sm'
							: 'text-gray-500 dark:text-gray-400 hover:text-text dark:hover:text-gray-200'}"
					>
						Income
					</button>
				</div>
			</div>

			<!-- Category selection -->
			<div class="mb-6">
				<p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Category</p>
				<div class="flex flex-wrap gap-2">
					{#each CATEGORIES as category}
						<button
							type="button"
							onclick={() => selectCategory(category)}
							class="px-4 py-2 rounded-full text-sm font-medium transition-all {selectedCategory === category
								? 'bg-primary text-white'
								: 'bg-background dark:bg-gray-700 text-text dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}"
						>
							{getCategoryDisplayName(category)}
						</button>
					{/each}
				</div>
			</div>

			<!-- Action buttons -->
			<div class="flex gap-3">
				{#if isEditMode}
					<!-- Delete button (only in edit mode) -->
					<button
						type="button"
						onclick={handleDeleteClick}
						class="py-3 px-4 rounded-lg border border-danger text-danger font-medium hover:bg-danger/10 transition-colors"
						aria-label="Delete transaction"
					>
						<Trash2 size={20} />
					</button>
				{/if}
				<button
					type="button"
					onclick={handleCancel}
					class="flex-1 py-3 px-4 rounded-lg border border-border dark:border-gray-600 text-text dark:text-gray-100 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={handleConfirm}
					disabled={isSaving || editableAmount <= 0 || !editableDescription.trim()}
					class="flex-1 py-3 px-4 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isSaving ? 'Saving...' : isEditMode ? 'Save' : 'Confirm'}
				</button>
			</div>
		</div>
	</div>

	<!-- Delete Confirmation Dialog (within modal) -->
	{#if showDeleteConfirm}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
			onclick={cancelDelete}
			role="button"
			tabindex="-1"
		>
			<div
				class="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm shadow-xl"
				onclick={(e) => e.stopPropagation()}
				role="dialog"
				tabindex="-1"
			>
				<h3 class="text-lg font-semibold text-text dark:text-gray-100 mb-2">Delete Transaction?</h3>
				<p class="text-gray-500 dark:text-gray-400 text-sm mb-6">
					Are you sure you want to delete "{editableDescription}"? This action cannot be undone.
				</p>
				<div class="flex gap-3">
					<button
						type="button"
						onclick={cancelDelete}
						class="flex-1 py-2.5 px-4 rounded-lg border border-border dark:border-gray-600 text-text dark:text-gray-100 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
					>
						Cancel
					</button>
					<button
						type="button"
						onclick={confirmDelete}
						disabled={isDeleting}
						class="flex-1 py-2.5 px-4 rounded-lg bg-danger text-white font-medium hover:bg-danger/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isDeleting ? 'Deleting...' : 'Delete'}
					</button>
				</div>
			</div>
		</div>
	{/if}
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
