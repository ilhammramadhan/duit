<script lang="ts">
	import {
		ChevronRight,
		Wallet,
		Download,
		Upload,
		Tags,
		Sparkles,
		Palette
	} from 'lucide-svelte';
</script>

<div class="min-h-screen bg-background pb-20">
	<!-- Header -->
	<div class="p-4 border-b border-border bg-white">
		<h1 class="text-2xl font-bold text-text">Settings</h1>
	</div>

	<!-- Settings Sections -->
	<div class="p-4 space-y-6">
		<!-- Data Section -->
		<section>
			<h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Data</h2>
			<div class="bg-white rounded-xl divide-y divide-border overflow-hidden">
				<a
					href="/settings/budgets"
					class="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
				>
					<div
						class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"
					>
						<Wallet size={20} class="text-blue-600" />
					</div>
					<div class="flex-1">
						<p class="font-medium text-text">Budgets</p>
						<p class="text-sm text-gray-500">Set monthly spending limits</p>
					</div>
					<ChevronRight size={20} class="text-gray-400" />
				</a>
				<a
					href="/settings/export"
					class="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
				>
					<div
						class="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"
					>
						<Download size={20} class="text-green-600" />
					</div>
					<div class="flex-1">
						<p class="font-medium text-text">Export Data</p>
						<p class="text-sm text-gray-500">Download backup as JSON file</p>
					</div>
					<ChevronRight size={20} class="text-gray-400" />
				</a>
				<a
					href="/settings/import"
					class="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
				>
					<div
						class="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center"
					>
						<Upload size={20} class="text-amber-600" />
					</div>
					<div class="flex-1">
						<p class="font-medium text-text">Import Data</p>
						<p class="text-sm text-gray-500">Restore from backup file</p>
					</div>
					<ChevronRight size={20} class="text-gray-400" />
				</a>
			</div>
		</section>

		<!-- Categories Section -->
		<section>
			<h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
				Categories
			</h2>
			<div class="bg-white rounded-xl divide-y divide-border overflow-hidden">
				<a
					href="/settings/categories"
					class="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
				>
					<div
						class="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center"
					>
						<Tags size={20} class="text-purple-600" />
					</div>
					<div class="flex-1">
						<p class="font-medium text-text">Manage Categories</p>
						<p class="text-sm text-gray-500">Rename category names</p>
					</div>
					<ChevronRight size={20} class="text-gray-400" />
				</a>
				<a
					href="/settings/keywords"
					class="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
				>
					<div
						class="flex-shrink-0 w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center"
					>
						<Sparkles size={20} class="text-pink-600" />
					</div>
					<div class="flex-1">
						<p class="font-medium text-text">AI Keywords</p>
						<p class="text-sm text-gray-500">View learned keyword mappings</p>
					</div>
					<ChevronRight size={20} class="text-gray-400" />
				</a>
			</div>
		</section>

		<!-- Appearance Section -->
		<section>
			<h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
				Appearance
			</h2>
			<div class="bg-white rounded-xl divide-y divide-border overflow-hidden">
				<a
					href="/settings/theme"
					class="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
				>
					<div
						class="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center"
					>
						<Palette size={20} class="text-indigo-600" />
					</div>
					<div class="flex-1">
						<p class="font-medium text-text">Theme</p>
						<p class="text-sm text-gray-500">Light, dark, or system mode</p>
					</div>
					<ChevronRight size={20} class="text-gray-400" />
				</a>
			</div>
		</section>
	</div>
</div>
