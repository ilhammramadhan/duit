<script lang="ts">
	import { ChevronLeft, Sparkles } from 'lucide-svelte';
</script>

<div class="min-h-screen bg-background pb-20">
	<!-- Header -->
	<div class="p-4 border-b border-border bg-white flex items-center gap-3">
		<a href="/settings" class="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
			<ChevronLeft size={24} class="text-text" />
		</a>
		<h1 class="text-xl font-bold text-text">AI Keywords</h1>
	</div>

	<!-- Content -->
	<div class="p-4">
		<div class="bg-white rounded-xl p-6 text-center">
			<div
				class="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4"
			>
				<Sparkles size={32} class="text-pink-600" />
			</div>
			<p class="text-gray-500">AI keyword mappings coming soon</p>
		</div>
	</div>
</div>
