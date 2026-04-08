import { db } from '../config/db.js';
import { products, collections } from '../models/schema.js';


export const getAllJerseys = async (_, res) => {
  try {
    const allJerseys = await db.select().from(products);
    res.status(200).json(allJerseys);
  } catch (error) {
    console.error("Error fetching jerseys:", error);
    res.status(500).json({ error: "Failed to fetch jerseys" });
  }
};

export const getCollections = async (_, res) => {
  try {
    const allCollections = await db.select().from(collections);
    res.status(200).json(allCollections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    res.status(500).json({ error: "Failed to fetch collections" });
  }
};