import { ZodError } from 'zod';
import {z} from 'zod';
export const validateDTO = (schema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return res.status(400).json({ error: 'Validation Failed', details: errorMessages });
      }
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
};
