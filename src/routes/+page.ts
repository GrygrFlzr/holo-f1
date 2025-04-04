import type { PageLoad } from './$types';

const indivPtsUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vSGfxGO-A1LkFFlKSQ8JQRKIux7QJqDev2n5CP07d9MVAAAtUp9M2hvzL_jM260dHbVERd9Ku6SoDam/pub?gid=641322508&single=true&output=tsv`;
export const load: PageLoad = async ({ fetch }) => {
	const response = await fetch(indivPtsUrl);
    const sheetData = await response.text();

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
                    }
                ]
            }
        }
    );
    individuals.shift();
    individuals.shift();
    individuals.shift();

    return { individuals };
};