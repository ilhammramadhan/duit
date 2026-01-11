<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { initializeTheme } from '$lib/stores/theme';

	let { children } = $props();

	onMount(() => {
		initializeTheme();
	});
</script>

<div class="min-h-screen pb-16">
	{@render children()}
</div>

<BottomNav />

<!-- Global toast notifications -->
<Toast />
