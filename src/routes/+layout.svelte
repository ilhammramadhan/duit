<script lang="ts">
	import '../app.css';
	import BottomNav from '$lib/components/BottomNav.svelte';

	let { children } = $props();
</script>

<div class="min-h-screen pb-16">
	{@render children()}
</div>

<BottomNav />
