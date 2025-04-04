<script lang="ts">
	import type { PageProps } from './$types';
    let { data }: PageProps = $props();

    type Team = {
        rank: number;
        points: number;
        name: string;
        color: string;
        repImage: string;
    };
    const teams: Team[] = [
        {
            rank: 1,
            points: 22,
            name: "Scuderia KFP",
            color: '#ff411c',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2020/07/Takanashi-Kiara_list_thumb.png',
        },
        {
            rank: 2,
            points: 6,
            name: "Amelia's Driver Bureau",
            color: '#f8db92',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2020/07/Watson-Amelia_list_thumb.png',
        },
        {
            rank: 2,
            points: 6,
            name: "AMG Reine's [Reidacted]",
            color: '#0f53ba',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2020/07/Pavolia-Reine_list_thumb.png',
        },
        {
            rank: 2,
            points: 6,
            name: "Lamy's Land of Lawnmowers",
            color: '#6abadf',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2020/06/Yukihana-Lamy_list_thumb.png',
        },
        {
            rank: 5,
            points: 4,
            name: "IRyS' Stage Racing",
            color: '#ff0335',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2020/07/IRyS_list_thumb.png',
        },
        {
            rank: 6,
            points: 3,
            name: "Shiranui Flare's Elfriend F1",
            color: '#fe3d1c',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2020/06/Shiranui-Flare_list_thumb.png',
        },
        {
            rank: 7,
            points: 2,
            name: "Nerissa's Birdgarage",
            color: 'darkblue',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2021/07/Nerissa-Ravencroft_list_thumb.png',
        },
        {
            rank: 8,
            points: 1,
            name: "AZKi Pioneer Racing",
            color: '#fc3488',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2020/06/AZKi_list_thumb.png',
        },
        {
            rank: 8,
            points: 1,
            name: "Mumei's Sancturacing",
            color: 'brown',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2020/07/Nanashi-Mumei_list_thumb.png',
        },
        {
            rank: 8,
            points: 1,
            name: "Alfa Roneo Racing",
            color: 'orange',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2020/06/Momosuzu-Nene_list_thumb.png',
        },
        {
            rank: 11,
            points: 0,
            name: "Nun-Nun Speedstar Racing",
            color: '#266aff',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2021/05/tokino_sora_thumb.png',
        },
        {
            rank: 11,
            points: 0,
            name: "Shiorin Aramco Racing",
            color: 'grey',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2021/07/Shiori-Novella_list_thumb.png',
        },
    ];

    const annotatedTeams = $derived(
        teams.map(team => ({
            ...team,
            scorers: data.individuals
                .map(indiv => ({
                    ...indiv,
                    points: indiv.points.filter(roundRecord => roundRecord.team === team.name)
                }))
                .filter(indiv => indiv.points.length > 0)
                .map(indiv => ({
                    name: indiv.name,
                    cumulativePts: indiv.points.map(
                        pts => pts.roundScore
                    ).reduce((a, b) => a + b, 0),
                }))
                .sort((a, b) => b.cumulativePts - a.cumulativePts)
        }))
    )
</script>

<h2 class="page-header">Season 3 Standings</h2>

<ul class="team-rankings">
    {#each annotatedTeams as team (team.name)}
        <li class="team-entry" style="
            border-left-color: hsl(from {team.color} h s 50%);
            background: hsl(from {team.color} h s 80%);
            background: linear-gradient(
                to right,
                hsl(from {team.color} h s 75%),
                hsl(from {team.color} h s 85%)
            );
            color: hsl(from {team.color} h s 25%);
            box-shadow:
                0 4px 6px -1px hsl(from {team.color} h s 30%),
                0 2px 4px -2px hsl(from {team.color} h s 30%);
        ">
            <img class="team-logo" src={team.repImage} alt="{team.name} rep logo" />
            <span class="team-rank">#{team.rank}</span>
            <span class="team-name">{team.name}</span>
            <span class="team-pts">{team.points}</span>
        </li>
        <li class="team-breakdown-wrapper">
            <ul class="team-breakdown-inner">
                {#each team.scorers as scorer (scorer.name)}
                    <li class="scorer-entry" style="
                        border-top-color: hsl(from {team.color} h s 90%);
                        border-left-color: hsl(from {team.color} h s 50%);
                        background: hsl(from {team.color} h s 75%);
                        background: linear-gradient(
                            to right,
                            hsl(from {team.color} h s 70%),
                            hsl(from {team.color} h s 80%)
                        );
                        color: hsl(from {team.color} h s 25%);
                        box-shadow:
                            0 4px 6px -1px hsl(from {team.color} h s 30%),
                            0 2px 4px -2px hsl(from {team.color} h s 30%);
                    ">
                        <span class="scorer-name">{scorer.name}</span>
                        <span class="scorer-pts">{scorer.cumulativePts} pts</span>
                    </li>
                {/each}
            </ul>
        </li>
    {/each}
</ul>

<style>
    .page-header {
        font-weight: 300;
        font-size: 3rem;
        margin: .5rem;
        text-align: center;
    }
    .team-rankings {
        margin: 0;
        padding: 0 2rem 8rem;
        list-style-type: none;
        font-size: 3rem;
    }
    .team-entry {
        border-left: 2rem solid transparent;
        display: flex;
        align-items: center;
        font-weight: 300;
        padding: 1rem;
        gap: 2rem;
    }
    .team-rank {
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        width: 3rem;
        text-align: center;
    }
    .team-logo {
        max-height: 6rem;
        border-radius: 50%;
    }
    .team-name {
        flex-grow: 1;
    }
    .team-pts {
        font-variant-numeric: tabular-nums;
    }
    .team-breakdown-wrapper {
        margin: 0;
        display: flex;
        justify-content: center;
    }
    .team-breakdown-inner {
        max-width: 480px;
        padding: 0;
        list-style: none;
        font-size: 1.5rem;
    }
    .scorer-entry {
        border-left: .5rem solid transparent;
        display: flex;
        align-items: center;
        font-weight: 300;
        gap: 2rem;
    }
    .scorer-entry + .scorer-entry {
        border-top: 1px solid transparent;
    }
    .scorer-name {
        flex-grow: 1;
        padding: 0 2rem;
    }
    .scorer-pts {
        padding: 0 2rem;
        font-variant-numeric: tabular-nums;
    }
    .team-breakdown-wrapper + .team-entry {
        margin-top: 1rem;
    }
    
    @media (max-width: 640px) {
        .page-header {
            font-size: 1.75rem;
        }
        .team-rankings {
            font-size: 1.5rem;
            padding: 0;
        }
        .team-breakdown-inner {
            font-size: 1.25rem;
        }
        .team-entry {
            border-left-width: 8px;
            gap: .5rem;
        }
        .team-logo {
            max-height: 3rem;
            border-radius: 0;
        }
        .scorer-entry {
            width: 100%;
        }
    }
</style>