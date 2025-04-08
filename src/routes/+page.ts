import type { PageLoad } from './$types';
import pekomama from '$lib/assets/pekomama.jpg?no-inline';

const indivPtsUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vSGfxGO-A1LkFFlKSQ8JQRKIux7QJqDev2n5CP07d9MVAAAtUp9M2hvzL_jM260dHbVERd9Ku6SoDam/pub?gid=641322508&single=true&output=tsv`;
export const load: PageLoad = async ({ fetch }) => {
	const response = await fetch(indivPtsUrl);
    const sheetData = await response.text();

    type Team = {
        name: string;
        color: string;
        repImage: string;
    };
    const teams: Team[] = [
        {
            name: "Scuderia KFP",
            color: '#ff411c',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2020/07/Takanashi-Kiara_list_thumb.png',
        },
        {
            name: "Amelia's Driver Bureau",
            color: '#f8db92',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2020/07/Watson-Amelia_list_thumb.png',
        },
        {
            name: "AMG Reine's [Reidacted]",
            color: '#0f53ba',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2020/07/Pavolia-Reine_list_thumb.png',
        },
        {
            name: "GULF Poyoyo Racing",
            color: 'hsl(353, 83.3%, 57.8%)',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2020/06/Nakiri-Ayame_list_thumb.png',
        },
        {
            name: "Lamy's Land of Lawnmowers",
            color: '#6abadf',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2020/06/Yukihana-Lamy_list_thumb.png',
        },
        {
            name: "IRyS' Stage Racing",
            color: '#ff0335',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2020/07/IRyS_list_thumb.png',
        },
        {
            name: "Shiranui Flare's Elfriend F1",
            color: '#fe3d1c',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2020/06/Shiranui-Flare_list_thumb.png',
        },
        {
            name: "Nerissa's Birdgarage",
            color: 'hsl(235.3, 96.4%, 55.9%)',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2021/07/Nerissa-Ravencroft_list_thumb.png',
        },
        {
            name: "AZKi Pioneer Racing",
            color: '#fc3488',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2020/06/AZKi_list_thumb.png',
        },
        {
            name: "Mumei's Sancturacing",
            color: 'hsl(25.7, 37.5%, 78%)',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2020/07/Nanashi-Mumei_list_thumb.png',
        },
        {
            name: "Alfa Roneo Racing",
            color: 'hsl(33, 100%, 68.2%)',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2020/06/Momosuzu-Nene_list_thumb.png',
        },
        {
            name: "Nun-Nun Speedstar Racing",
            color: '#266aff',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2021/05/tokino_sora_thumb.png',
        },
        {
            name: "Shiorin Aramco Racing",
            color: 'hsl(255.7, 21.9%, 58.8%)',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2021/07/Shiori-Novella_list_thumb.png',
        },
        {
            name: "Melfriend Formula 1 Team",
            color: 'hsl(43.6, 85.2%, 65.5%)',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2020/07/Anya-Melfissa_list_thumb.png',
        },
        {
            name: "HoloMoms Racing Supremacy",
            color: 'hsl(202.7, 100%, 76.7%)',
            repImage: pekomama,
        },
        {
            name: "Rindo Chihaya's Garage",
            color: 'hsl(180, 54.4%, 47.3%)',
            repImage: 'https://hololive.hololivepro.com/wp-content/uploads/2023/09/Rindo-Chihaya_list_thumb.png',
        },
    ];

    const individuals = sheetData.split('\n').map(
        row => {
            const fields = row.split('\t');
            return {
                name: fields[0],
                points: [
                    {
                        round: 1,
                        team: fields[1],
                        roundScore: Number.parseInt(fields[2]) || 0,
                    },
                    {
                        round: 2,
                        team: fields[12 + 1],
                        roundScore: Number.parseInt(fields[12 + 2]) || 0,
                    },
                    {
                        round: 3,
                        team: fields[24 + 1],
                        roundScore: Number.parseInt(fields[24 + 2]) || 0,
                    }
                ]
            }
        }
    );
    individuals.shift();
    individuals.shift();
    individuals.shift();

    const annotatedTeams = teams.map(team => ({
            ...team,
            scorers: individuals
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
        })).map(team => ({
            ...team,
            points: team.scorers
                .map(member => member.cumulativePts)
                .reduce((a, b) => a + b, 0),
        })).sort((a, b) => {
            if (b.points === a.points) {
                return b.scorers.length - a.scorers.length;
            }
            return b.points - a.points;
        });

    const sortedPts = annotatedTeams.map(team => team.points);

    return {
        teams: annotatedTeams.map(team => ({
            rank: sortedPts.indexOf(team.points) + 1,
            ...team,
        })),
        individuals
    };
};