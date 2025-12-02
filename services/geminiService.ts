import { GoogleGenAI, Type } from "@google/genai";
import { ShapeData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Cache specific complex shapes to save API calls and ensure speed for common demos
const SHAPE_CACHE: Record<string, number[]> = {};

export const generateShapePoints = async (shapeDescription: string): Promise<number[]> => {
  // Check cache first
  if (SHAPE_CACHE[shapeDescription]) {
    return SHAPE_CACHE[shapeDescription];
  }

  try {
    const model = "gemini-2.5-flash";
    const pointCount = 1500;

    const prompt = `
      Generate a 3D point cloud for the shape of: "${shapeDescription}".
      Return a single JSON object containing a flat array of numbers representing x, y, z coordinates.
      There should be exactly ${pointCount * 3} numbers in the array (representing ${pointCount} points).
      The coordinates should be normalized roughly between -5 and 5.
      Distribute points evenly to form the volume or surface of the shape clearly.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            points: {
              type: Type.ARRAY,
              items: { type: Type.NUMBER },
              description: "Flat array of x, y, z coordinates. [x1, y1, z1, x2, y2, z2, ...]"
            }
          },
          required: ["points"]
        }
      }
    });

    const json = JSON.parse(response.text || "{}");
    
    if (json.points && Array.isArray(json.points)) {
      SHAPE_CACHE[shapeDescription] = json.points;
      return json.points;
    }
    
    throw new Error("Invalid format received from Gemini");

  } catch (error) {
    console.error("Gemini Shape Generation Failed:", error);
    // Fallback: Return a sphere if API fails
    return generateSphereFallback();
  }
};

const generateSphereFallback = (): number[] => {
  const points: number[] = [];
  for (let i = 0; i < 1500; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const r = 4;
    points.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
  }
  return points;
};
