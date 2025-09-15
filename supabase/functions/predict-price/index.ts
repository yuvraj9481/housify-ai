import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const propertyData = await req.json();
    
    console.log('Received property data:', propertyData);

    // Create a detailed prompt for the AI model
    const prompt = `
You are a real estate price prediction AI expert. Analyze the following property data and provide an accurate price estimate.

Property Details:
- Type: ${propertyData.propertyType}
- Bedrooms: ${propertyData.bedrooms}
- Bathrooms: ${propertyData.bathrooms}
- Area: ${propertyData.area} sq ft
- Location: ${propertyData.city}, ${propertyData.state}
- ZIP Code: ${propertyData.zipcode || 'Not provided'}
- Year Built: ${propertyData.yearBuilt || 'Not provided'}
- Parking Spaces: ${propertyData.parkingSpaces || 'Not provided'}
- Furnished: ${propertyData.furnished ? 'Yes' : 'No'}
- Pet Friendly: ${propertyData.petFriendly ? 'Yes' : 'No'}
- Amenities: ${propertyData.amenities.join(', ') || 'None specified'}

Based on current market data and property analysis, provide:

1. Estimated market value (realistic price for current market)
2. Price range (min and max)
3. Confidence percentage (based on data completeness and market conditions)
4. Factor scores (0-100) for: location, size, bedrooms, bathrooms, amenities, market
5. 3 comparable properties with prices, distances, and similarity percentages

Respond in JSON format only:
{
  "estimatedPrice": number,
  "priceRange": {
    "min": number,
    "max": number
  },
  "confidence": number (70-95),
  "factors": {
    "location": number (0-100),
    "size": number (0-100),
    "bedrooms": number (0-100),
    "bathrooms": number (0-100),
    "amenities": number (0-100),
    "market": number (0-100)
  },
  "comparableProperties": [
    {
      "price": number,
      "distance": "X.X miles",
      "similarity": number (75-95)
    }
  ]
}

Consider current market trends, location desirability, property features, and recent sales data for similar properties.
`;

    console.log('Calling OpenAI API...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional real estate appraiser and market analyst with extensive knowledge of property valuation. Always respond with valid JSON only.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI');
    }

    const aiResponse = data.choices[0].message.content;
    console.log('AI response content:', aiResponse);

    // Parse the JSON response from AI
    let prediction;
    try {
      prediction = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('AI response was:', aiResponse);
      
      // Fallback prediction if AI doesn't return valid JSON
      const basePrice = calculateBasePriceFromArea(
        parseInt(propertyData.area), 
        propertyData.city, 
        propertyData.state,
        propertyData.propertyType
      );
      
      prediction = {
        estimatedPrice: basePrice,
        priceRange: {
          min: Math.round(basePrice * 0.85),
          max: Math.round(basePrice * 1.15)
        },
        confidence: 75,
        factors: {
          location: 80,
          size: 85,
          bedrooms: 75,
          bathrooms: 75,
          amenities: 70,
          market: 80
        },
        comparableProperties: [
          { price: Math.round(basePrice * 0.95), distance: "0.5 miles", similarity: 92 },
          { price: Math.round(basePrice * 1.08), distance: "0.8 miles", similarity: 88 },
          { price: Math.round(basePrice * 0.92), distance: "1.2 miles", similarity: 85 }
        ]
      };
    }

    // Validate the prediction structure
    if (!prediction.estimatedPrice || !prediction.priceRange || !prediction.factors) {
      throw new Error('Invalid prediction structure received from AI');
    }

    console.log('Final prediction:', prediction);

    return new Response(
      JSON.stringify({ prediction }), 
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in predict-price function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate price prediction',
        message: error.message 
      }), 
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

// Fallback price calculation function
function calculateBasePriceFromArea(
  area: number, 
  city: string, 
  state: string, 
  propertyType: string
): number {
  // Base price per sq ft by property type
  const baseRates: Record<string, number> = {
    'apartment': 200,
    'house': 250,
    'villa': 400,
    'penthouse': 500,
    'studio': 300
  };

  // City multipliers (rough estimates)
  const cityMultipliers: Record<string, number> = {
    'new york': 3.5,
    'san francisco': 3.0,
    'los angeles': 2.5,
    'seattle': 2.2,
    'boston': 2.0,
    'miami': 1.8,
    'chicago': 1.5,
    'austin': 1.4,
    'denver': 1.3,
    'atlanta': 1.2
  };

  const baseRate = baseRates[propertyType] || 250;
  const cityMultiplier = cityMultipliers[city.toLowerCase()] || 1.0;
  
  return Math.round(area * baseRate * cityMultiplier);
}