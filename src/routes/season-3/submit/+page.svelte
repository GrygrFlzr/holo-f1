<script lang="ts">
    import ogImage from "$lib/belgium.png?no-inline";
    const raceCount = 13;
    const raceName = "Belgium";
</script>

<svelte:head>
    <meta property="og:title" content="Season 3 Race {raceCount} Prediction Form" />
    <title>Season 3 Race {raceCount} Prediction Form | Holocord F1 Watchalong Prediction Championship</title>
    <meta property="og:description" content="Submit predictions for {raceName}" />
    <meta property="og:image" content={ogImage} />
    <meta property="og:image:width" content="240" />
    <meta property="og:image:height" content="180" />
    <meta property="twitter:card" content="summary" />
</svelte:head>

<div class="container">
    <h2>Race {raceCount}: {raceName}</h2>
    <iframe
        title="Season 3 Race {raceCount} Submission"
        src="https://docs.google.com/forms/d/e/1FAIpQLSea-p09aGhPCuFkBTg4uNDZ4k2ASEBOVZZCDo2EdkumO7srVA/viewform?embedded=true"
        frameborder="0"
        marginheight="0"
        marginwidth="0">
        Loading…
    </iframe
    >
</div>

<style>
    .container {
        display: flex;
        flex-direction: column;
        height: calc(100dvh);
    }
    iframe {
        flex-grow: 1;
        width: 100%;
    }
</style>