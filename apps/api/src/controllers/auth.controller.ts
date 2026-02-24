import { Request, Response } from "express";
import { registerUser, loginUser } from "../services/auth.service";
import { registerSchema } from "../utils/validators";

export const register = async (req: Request, res: Response) => {
    try {
        const validated = registerSchema.parse(req.body);

        const user = await registerUser(validated.email, validated.password);

        res.status(201).json({ message: "User created", user });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const token = await loginUser(email, password);

        res.json({ token });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};