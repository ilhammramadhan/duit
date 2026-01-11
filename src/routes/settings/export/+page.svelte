<script lang="ts">
	import { ChevronLeft, Download, FileDown, CheckCircle } from 'lucide-svelte';
	import { exportAllData, type BackupData } from '$lib/db';
	import { format } from 'date-fns';

	let isExporting = $state(false);
	let showSuccess = $state(false);
	let exportStats = $state<{ transactions: number; budgets: number; mappings: number } | null>(null);

	async function handleExport() {
		isExporting = true;
		showSuccess = false;

		try {
			// Get all data from IndexedDB
			const backupData: BackupData = await exportAllData();

			// Store stats for display
			exportStats = {
				transactions: backupData.data.transactions.length,
				budgets: backupData.data.budgets.length,
				mappings: backupData.data.categoryMappings.length
			};

			// Create filename with current date
			const dateStr = format(new Date(), 'yyyy-MM-dd');
			const filename = `duit-backup-${dateStr}.json`;

			// Convert to JSON string with formatting
			const jsonString = JSON.stringify(backupData, null, 2);

			// Create blob and download link
			const blob = new Blob([jsonString], { type: 'application/json' });
			const url = URL.createObjectURL(blob);

			// Create temporary download link and trigger download
			const link = document.createElement('a');
			link.href = url;
			link.download = filename;
			document.body.appendChild(link);
			link.click();

			// Cleanup
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			// Show success state
			showSuccess = true;

			// Hide success after 5 seconds
			setTimeout(() => {
				showSuccess = false;
			}, 5000);
		} catch (error) {
			console.error('Export failed:', error);
			alert('Export failed. Please try again.');
		} finally {
			isExporting = false;
		}
	}
</script>

<div class="min-h-screen bg-background pb-20">
	<!-- Header -->
	<div class="p-4 border-b border-border bg-white flex items-center gap-3">
		<a href="/settings" class="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
			<ChevronLeft size={24} class="text-text" />
		</a>
		<h1 class="text-xl font-bold text-text">Export Data</h1>
	</div>

	<!-- Content -->
	<div class="p-4 space-y-4">
		<!-- Export Card -->
		<div class="bg-white rounded-xl p-6">
			<div class="flex flex-col items-center text-center mb-6">
				<div
					class="w-20 h-20 rounded-full flex items-center justify-center mb-4 {showSuccess
						? 'bg-green-100'
						: 'bg-blue-100'}"
				>
					{#if showSuccess}
						<CheckCircle size={40} class="text-green-600" />
					{:else if isExporting}
						<FileDown size={40} class="text-blue-600 animate-bounce" />
					{:else}
						<Download size={40} class="text-blue-600" />
					{/if}
				</div>

				{#if showSuccess}
					<h2 class="text-lg font-semibold text-text mb-2">Export Successful!</h2>
					<p class="text-gray-500 text-sm">Your backup file has been downloaded.</p>
				{:else}
					<h2 class="text-lg font-semibold text-text mb-2">Backup Your Data</h2>
					<p class="text-gray-500 text-sm">
						Export all your transactions, budgets, and category mappings as a JSON file. You can
						use this file to restore your data later.
					</p>
				{/if}
			</div>

			<!-- Export Stats (shown after successful export) -->
			{#if showSuccess && exportStats}
				<div class="bg-gray-50 rounded-lg p-4 mb-6">
					<h3 class="text-sm font-medium text-gray-700 mb-3">Exported Data</h3>
					<div class="grid grid-cols-3 gap-2 text-center">
						<div>
							<div class="text-2xl font-bold text-primary">{exportStats.transactions}</div>
							<div class="text-xs text-gray-500">Transactions</div>
						</div>
						<div>
							<div class="text-2xl font-bold text-primary">{exportStats.budgets}</div>
							<div class="text-xs text-gray-500">Budgets</div>
						</div>
						<div>
							<div class="text-2xl font-bold text-primary">{exportStats.mappings}</div>
							<div class="text-xs text-gray-500">Keywords</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Export Button -->
			<button
				onclick={handleExport}
				disabled={isExporting}
				class="w-full py-3 px-4 bg-primary text-white font-semibold rounded-xl transition-all
					{isExporting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700 active:scale-[0.98]'}"
			>
				{#if isExporting}
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
						Exporting...
					</span>
				{:else if showSuccess}
					<span class="flex items-center justify-center gap-2">
						<Download size={20} />
						Export Again
					</span>
				{:else}
					<span class="flex items-center justify-center gap-2">
						<Download size={20} />
						Export Backup
					</span>
				{/if}
			</button>
		</div>

		<!-- Info Card -->
		<div class="bg-amber-50 rounded-xl p-4 border border-amber-200">
			<div class="flex gap-3">
				<div class="text-amber-600 mt-0.5">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="16" x2="12" y2="12" />
						<line x1="12" y1="8" x2="12.01" y2="8" />
					</svg>
				</div>
				<div>
					<h3 class="text-sm font-medium text-amber-800 mb-1">Keep Your Data Safe</h3>
					<p class="text-xs text-amber-700">
						We recommend exporting your data regularly and storing the backup file in a safe
						location like cloud storage.
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
