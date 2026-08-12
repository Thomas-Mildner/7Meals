import { Platform } from 'react-native';

export interface ScrapedRecipe {
    name: string;
    description: string;
    image: string | null;
    ingredients: string[];
    prepTime: number | null;
}

export const scrapeRecipe = async (url: string, onProgress?: (msg: string) => void): Promise<ScrapedRecipe> => {
    try {
        let html = '';

        if (Platform.OS !== 'web') {
            if (onProgress) onProgress("Verbindung wird aufgebaut...");
            // Mobile: No CORS restrictions
            const response = await fetch(url);
            
            if (onProgress) onProgress("Rezept-Seite wird heruntergeladen...");
            html = await response.text();
        } else {
            if (onProgress) onProgress("Verbindung wird über Proxy aufgebaut...");
            // Web: Try allorigins proxy
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Proxy failed');
            
            if (onProgress) onProgress("Rezept-Seite wird heruntergeladen...");
            const data = await response.json();
            if (data.contents) {
                html = data.contents;
            } else {
                throw new Error("No contents returned");
            }
        }

        if (onProgress) onProgress("Daten werden analysiert...");
        // Parse HTML looking for application/ld+json
        const scriptTags = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
        
        let recipeData: any = null;

        for (const tag of scriptTags) {
            try {
                // Extract inner JSON
                const jsonString = tag.replace(/<script type="application\/ld\+json"[^>]*>/i, '').replace(/<\/script>/i, '').trim();
                const json = JSON.parse(jsonString);

                // Check if it's a Recipe schema (can be an array of schemas or a single object)
                if (Array.isArray(json)) {
                    recipeData = json.find(item => item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe')));
                } else if (json['@type'] === 'Recipe' || (Array.isArray(json['@type']) && json['@type'].includes('Recipe'))) {
                    recipeData = json;
                } else if (json['@graph']) {
                    recipeData = json['@graph'].find((item: any) => item['@type'] === 'Recipe');
                }

                if (recipeData) break;
            } catch (e) {
                // Skip invalid JSON
                console.warn('Failed to parse ld+json block');
            }
        }

        if (!recipeData) {
            throw new Error('No recipe schema found on this page');
        }

        if (onProgress) onProgress("Zutaten werden sortiert...");

        // Parse fields
        const name = recipeData.name || '';
        const description = recipeData.description || '';
        
        // Image can be a string or an object or array
        let image = null;
        if (recipeData.image) {
            if (typeof recipeData.image === 'string') {
                image = recipeData.image;
            } else if (Array.isArray(recipeData.image) && recipeData.image.length > 0) {
                if (typeof recipeData.image[0] === 'string') {
                    image = recipeData.image[0];
                } else if (recipeData.image[0].url) {
                    image = recipeData.image[0].url;
                }
            } else if (recipeData.image.url) {
                image = recipeData.image.url;
            }
        }

        // Ingredients
        let ingredients: string[] = [];
        if (Array.isArray(recipeData.recipeIngredient)) {
            ingredients = recipeData.recipeIngredient;
        }

        // Total time parsing (ISO 8601 duration e.g. PT30M, PT1H30M)
        let prepTime = null;
        const parseISO8601Duration = (durationString: string) => {
            const matches = durationString.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
            if (!matches) return null;
            const hours = parseInt(matches[1] || '0', 10);
            const minutes = parseInt(matches[2] || '0', 10);
            return (hours * 60) + minutes;
        };

        if (recipeData.totalTime) {
            prepTime = parseISO8601Duration(recipeData.totalTime);
        } else if (recipeData.prepTime) {
            prepTime = parseISO8601Duration(recipeData.prepTime);
        }

        // Round prep time to nearest 15 for the UI (15, 30, 45, 60+)
        if (prepTime) {
            if (prepTime <= 15) prepTime = 15;
            else if (prepTime <= 30) prepTime = 30;
            else if (prepTime <= 45) prepTime = 45;
            else prepTime = 60;
        }

        return {
            name,
            description,
            image,
            ingredients,
            prepTime
        };

    } catch (error) {
        console.error("Error scraping recipe:", error);
        throw error;
    }
};
