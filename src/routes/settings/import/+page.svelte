<script lang="ts">
	import { ChevronLeft, Upload, FileUp, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-svelte';
	import { validateBackupData, importAllData, type BackupData, type ImportValidationResult } from '$lib/db';

	// State
	let fileInput: HTMLInputElement;
	let selectedFile = $state<File | null>(null);
	let validationResult = $state<ImportValidationResult | null>(null);
	let isValidating = $state(false);
	let isImporting = $state(false);
	let showConfirmDialog = $state(false);
	let showSuccess = $state(false);
	let showError = $state(false);
	let errorMessage = $state('');

	// Handle file selection
	async function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		// Reset states
		validationResult = null;
		showSuccess = false;
		showError = false;
		errorMessage = '';
		selectedFile = file;
		isValidating = true;

		try {
			// Read and parse file
			const text = await file.text();
			let parsedData: unknown;

			try {
				parsedData = JSON.parse(text);
			} catch {
				validationResult = { valid: false, error: 'Invalid JSON file. Please select a valid backup file.' };
				isValidating = false;
				return;
			}

			// Validate the data structure
			validationResult = validateBackupData(parsedData);
		} catch (error) {
			validationResult = { valid: false, error: 'Failed to read file. Please try again.' };
		} finally {
			isValidating = false;
		}
	}

	// Handle import button click - show confirmation
	function handleImportClick() {
		showConfirmDialog = true;
	}

	// Confirm and perform import
	async function confirmImport() {
		if (!validationResult?.data) return;

		showConfirmDialog = false;
		isImporting = true;

		try {
			await importAllData(validationResult.data);
			showSuccess = true;

			// Reset file input
			if (fileInput) {
				fileInput.value = '';
			}

			// Hide success after 5 seconds
			setTimeout(() => {
				showSuccess = false;
				selectedFile = null;
				validationResult = null;
			}, 5000);
		} catch (error) {
			showError = true;
			errorMessage = error instanceof Error ? error.message : 'Import failed. Please try again.';
		} finally {
			isImporting = false;
		}
	}

	// Cancel import
	function cancelImport() {
		showConfirmDialog = false;
	}

	// Clear selected file
	function clearSelection() {
		selectedFile = null;
		validationResult = null;
		showError = false;
		errorMessage = '';
		if (fileInput) {
			fileInput.value = '';
		}
	}
</script>

<div class="min-h-screen bg-background pb-20">
	<!-- Header -->
	<div class="p-4 border-b border-border bg-white flex items-center gap-3">
		<a href="/settings" class="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
			<ChevronLeft size={24} class="text-text" />
		</a>
		<h1 class="text-xl font-bold text-text">Import Data</h1>
	</div>

	<!-- Content -->
	<div class="p-4 space-y-4">
		<!-- Import Card -->
		<div class="bg-white rounded-xl p-6">
			<div class="flex flex-col items-center text-center mb-6">
				<div
					class="w-20 h-20 rounded-full flex items-center justify-center mb-4 {showSuccess
						? 'bg-green-100'
						: showError || (validationResult && !validationResult.valid)
							? 'bg-red-100'
							: 'bg-amber-100'}"
				>
					{#if showSuccess}
						<CheckCircle size={40} class="text-green-600" />
					{:else if showError || (validationResult && !validationResult.valid)}
						<AlertCircle size={40} class="text-red-600" />
					{:else if isValidating || isImporting}
						<FileUp size={40} class="text-amber-600 animate-bounce" />
					{:else}
						<Upload size={40} class="text-amber-600" />
					{/if}
				</div>

				{#if showSuccess}
					<h2 class="text-lg font-semibold text-text mb-2">Import Successful!</h2>
					<p class="text-gray-500 text-sm">Your data has been restored from the backup file.</p>
				{:else if showError}
					<h2 class="text-lg font-semibold text-text mb-2">Import Failed</h2>
					<p class="text-red-600 text-sm">{errorMessage}</p>
				{:else}
					<h2 class="text-lg font-semibold text-text mb-2">Restore Your Data</h2>
					<p class="text-gray-500 text-sm">
						Select a backup file (.json) to restore your transactions, budgets, and category mappings.
					</p>
				{/if}
			</div>

			<!-- File Input (hidden) -->
			<input
				bind:this={fileInput}
				type="file"
				accept=".json,application/json"
				onchange={handleFileSelect}
				class="hidden"
			/>

			<!-- Selected File Info -->
			{#if selectedFile && !showSuccess}
				<div class="bg-gray-50 rounded-lg p-4 mb-4">
					<div class="flex items-center justify-between mb-2">
						<span class="text-sm font-medium text-gray-700">Selected File</span>
						<button
							onclick={clearSelection}
							class="text-xs text-gray-500 hover:text-gray-700"
						>
							Clear
						</button>
					</div>
					<p class="text-sm text-gray-600 truncate">{selectedFile.name}</p>

					<!-- Validation Status -->
					{#if isValidating}
						<div class="mt-3 flex items-center gap-2 text-gray-500">
							<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
									fill="none"
								/>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
							<span class="text-sm">Validating...</span>
						</div>
					{:else if validationResult}
						{#if validationResult.valid}
							<div class="mt-3">
								<div class="flex items-center gap-2 text-green-600 mb-2">
									<CheckCircle size={16} />
									<span class="text-sm font-medium">Valid backup file</span>
								</div>
								{#if validationResult.stats}
									<div class="grid grid-cols-3 gap-2 text-center mt-3">
										<div>
											<div class="text-xl font-bold text-primary">{validationResult.stats.transactions}</div>
											<div class="text-xs text-gray-500">Transactions</div>
										</div>
										<div>
											<div class="text-xl font-bold text-primary">{validationResult.stats.budgets}</div>
											<div class="text-xs text-gray-500">Budgets</div>
										</div>
										<div>
											<div class="text-xl font-bold text-primary">{validationResult.stats.mappings}</div>
											<div class="text-xs text-gray-500">Keywords</div>
										</div>
									</div>
								{/if}
							</div>
						{:else}
							<div class="mt-3 flex items-start gap-2 text-red-600">
								<AlertCircle size={16} class="flex-shrink-0 mt-0.5" />
								<span class="text-sm">{validationResult.error}</span>
							</div>
						{/if}
					{/if}
				</div>
			{/if}

			<!-- Import Stats (shown after successful import) -->
			{#if showSuccess && validationResult?.stats}
				<div class="bg-gray-50 rounded-lg p-4 mb-6">
					<h3 class="text-sm font-medium text-gray-700 mb-3">Imported Data</h3>
					<div class="grid grid-cols-3 gap-2 text-center">
						<div>
							<div class="text-2xl font-bold text-primary">{validationResult.stats.transactions}</div>
							<div class="text-xs text-gray-500">Transactions</div>
						</div>
						<div>
							<div class="text-2xl font-bold text-primary">{validationResult.stats.budgets}</div>
							<div class="text-xs text-gray-500">Budgets</div>
						</div>
						<div>
							<div class="text-2xl font-bold text-primary">{validationResult.stats.mappings}</div>
							<div class="text-xs text-gray-500">Keywords</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Action Buttons -->
			{#if !selectedFile || showSuccess}
				<!-- Select File Button -->
				<button
					onclick={() => fileInput.click()}
					disabled={isImporting}
					class="w-full py-3 px-4 bg-amber-500 text-white font-semibold rounded-xl transition-all
						hover:bg-amber-600 active:scale-[0.98]"
				>
					<span class="flex items-center justify-center gap-2">
						<Upload size={20} />
						{showSuccess ? 'Import Another File' : 'Select Backup File'}
					</span>
				</button>
			{:else if validationResult?.valid}
				<!-- Import Button -->
				<button
					onclick={handleImportClick}
					disabled={isImporting}
					class="w-full py-3 px-4 bg-primary text-white font-semibold rounded-xl transition-all
						{isImporting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700 active:scale-[0.98]'}"
				>
					{#if isImporting}
						<span class="flex items-center justify-center gap-2">
							<svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
									fill="none"
								/>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
							Importing...
						</span>
					{:else}
						<span class="flex items-center justify-center gap-2">
							<Upload size={20} />
							Import Data
						</span>
					{/if}
				</button>
			{:else}
				<!-- Select Different File Button (when validation failed) -->
				<button
					onclick={() => fileInput.click()}
					class="w-full py-3 px-4 bg-gray-500 text-white font-semibold rounded-xl transition-all
						hover:bg-gray-600 active:scale-[0.98]"
				>
					<span class="flex items-center justify-center gap-2">
						<Upload size={20} />
						Select Different File
					</span>
				</button>
			{/if}
		</div>

		<!-- Warning Card -->
		<div class="bg-red-50 rounded-xl p-4 border border-red-200">
			<div class="flex gap-3">
				<div class="text-red-600 mt-0.5">
					<AlertTriangle size={20} />
				</div>
				<div>
					<h3 class="text-sm font-medium text-red-800 mb-1">Important Warning</h3>
					<p class="text-xs text-red-700">
						Importing data will <strong>replace all existing data</strong> in the app. Make sure to export your current data first if you want to keep it.
					</p>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Confirmation Dialog -->
{#if showConfirmDialog}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
		onclick={cancelImport}
	>
		<div
			class="bg-white rounded-2xl p-6 max-w-sm w-full"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="flex flex-col items-center text-center mb-6">
				<div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
					<AlertTriangle size={32} class="text-red-600" />
				</div>
				<h2 class="text-lg font-semibold text-text mb-2">Replace All Data?</h2>
				<p class="text-gray-500 text-sm">
					This will <strong>permanently delete</strong> all your current transactions, budgets, and category mappings, and replace them with the data from the backup file.
				</p>
				<p class="text-gray-500 text-sm mt-2">
					This action cannot be undone.
				</p>
			</div>

			<div class="flex gap-3">
				<button
					onclick={cancelImport}
					class="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl transition-all
						hover:bg-gray-200 active:scale-[0.98]"
				>
					Cancel
				</button>
				<button
					onclick={confirmImport}
					class="flex-1 py-3 px-4 bg-red-600 text-white font-semibold rounded-xl transition-all
						hover:bg-red-700 active:scale-[0.98]"
				>
					Replace Data
				</button>
			</div>
		</div>
	</div>
{/if}
