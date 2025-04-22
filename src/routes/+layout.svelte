<script>
	import { onMount } from 'svelte';

	export let data;
	let hasMounted = false;

	onMount(function () {
		hasMounted = true;
	});

	let navList = [
		{
			label: '🏠 Home',
			href: '/',
			active: false
		}
	];

	$: {
		const currentPath = data.route.id;
		navList = navList.map((nav) => {
			nav.active = nav.href === currentPath;
			return nav;
		});

		if (hasMounted && typeof window !== 'undefined') {
			
		}
	}

	if (typeof window !== 'undefined') {
		window.params = {};
		window.location.search
			.substr(1)
			.split('&')
			.map((i) => {
				const q = i.split('=');
				params[q[0]] = q[1];
			});
		if (params.r) {
			localStorage.setItem('chang-ref', params.r);
		}
	}

</script>

<nav class="uk-navbar-container uk-visible@m">
    <div class="uk-container">
		<div class="uk-grid">
			<div class="uk-width-2-3">
				<a class="uk-logo" href="/" aria-label="Back to Home" style="padding-top:20px">
					<img src="/logo.png" alt="" style="max-width:40px;display:inline-block">
					CBDC Escrow Service Demo
				</a>
			</div>
			<div class="uk-width-1-3">
				<div uk-navbar>
					<div class="uk-navbar-right" style="flex-direction: row-reverse;">
						<ul class="uk-navbar-nav">
							{#each navList as nav}
								<li class={nav.active ? 'uk-active' : ''}>
									<a href={nav.href}>{nav.label}</a>
								</li>
							{/each}
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
</nav>

<nav class="uk-navbar uk-navbar-container uk-hidden@m">
	<div class="uk-navbar-center">
		<ul class="uk-navbar-nav">
			{#each navList as nav}
				<li class={nav.active ? 'uk-active' : ''}>
					<a href={nav.href}>{nav.label}</a>
				</li>
			{/each}
		</ul>
	</div>
</nav>

<div class="uk-margin"></div>
<div class="uk-container">
	<slot />
</div>
<footer class="uk-padding-large uk-text-center uk-section-default">
	&copy; {new Date().getFullYear()} Tokenine.co
</footer>
