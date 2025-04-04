<script lang="ts">
    import "$lib/colors.css";
    import headerLogo from "$lib/header_logo.png";
	let { children } = $props();
</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
    <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@200..700&display=swap" rel="stylesheet">
</svelte:head>

<div class="everything">
    <header class="header-container">
        <img class="header-logo" src={headerLogo} alt="holocord Formula 1 logo" />
        <h1 class="header-text">holocord F1 Predictions</h1>
    </header>
    
    <div class="main-content">
        {@render children()}
    </div>
</div>

<style>
    :global(body) {
        margin: 0;
        min-height: 100vh;
        background-color: var(--f1-white);
    }
    .everything {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }
    header {
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: var(--f1-red);
        color: var(--f1-white);
        gap: .5rem;
    }
    .header-logo {
        height: 3rem;
        padding: .5rem
    }
    .header-text {
        font-weight: 400;
        text-wrap: nowrap;
        font-size: 2rem;
        line-height: 3rem;
        font-style: oblique 7deg;
    }
    .main-content {
        background-color: var(--f1-lightgrey);
        box-shadow: 0 4px 6px -1px var(--f1-lightgrey), 0 2px 4px -2px var(--f1-lightgrey);
        flex-grow: 1;
        margin: 0 auto;
        width: 100vw;
        max-width: 840px;
        color: var(--f1-black);
    }
    @media (max-width: 640px) {
        .header-text {
            display: none;
        }
    }
</style>