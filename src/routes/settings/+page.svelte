<script lang="ts">
	import { ChevronRight, Wallet } from 'lucide-svelte';
</script>

<div class="min-h-screen bg-background">
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
				<a href="/settings/budgets" class="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
					<div class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
						<Wallet size={20} class="text-blue-600" />
					</div>
					<div class="flex-1">
						<p class="font-medium text-text">Budgets</p>
						<p class="text-sm text-gray-500">Set monthly spending limits</p>
					</div>
					<ChevronRight size={20} class="text-gray-400" />
				</a>
			</div>
		</section>
	</div>
</div>
