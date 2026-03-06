import bcrypt from "bcrypt";
// Import your configured Prisma client (adjust the path if needed based on your config file)
import { prisma } from "../config/prisma";

export const registerUser = async (userData: any) => {
    const { name, email, password } = userData;

    // 1. Check if a user with this email already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new Error("User with this email already exists");
    }

    // 2. Hash the password. Cost factor 12 makes it computationally hard for hackers to crack.
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Save the new user to the database. 
    // We assume your Prisma schema has a 'Role' enum and defaults to 'TESTER'.
    const newUser = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: "TESTER",
        },
    });

    // We don't want to send the password hash back to the frontend, so we omit it
    return {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
    };
};
// Add this import at the top with your others
import jwt from "jsonwebtoken";

// ... your existing registerUser function ...

export const loginUser = async (userData: any) => {
    const { email, password } = userData;

    // 1. Find the user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Invalid credentials");

    // 2. Check if the account is currently locked out
    if (user.lockUntil && user.lockUntil > new Date()) {
        throw new Error("Account locked. Please try again later.");
    }

    // 3. Compare the typed password with the scrambled hash in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        // 4a. WRONG PASSWORD LOGIC: Increment failed attempts
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: { increment: 1 } },
        });

        // If they hit 5 attempts, lock the account for 15 minutes
        if (updatedUser.failedLoginAttempts >= 5) {
            const lockTime = new Date(Date.now() + 15 * 60 * 1000); // Current time + 15 mins
            await prisma.user.update({
                where: { id: user.id },
                data: { lockUntil: lockTime },
            });
            throw new Error("Account locked due to too many failed attempts.");
        }

        throw new Error("Invalid credentials");
    }

    // 4b. CORRECT PASSWORD LOGIC: Reset failed attempts and lockouts
    await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockUntil: null },
    });

    // 5. Generate the JWT "Wristbands"
    // Pack id, email, role AND name so /api/auth/me always has the display name
    const payload = { id: user.id, email: user.email, role: user.role, name: user.name };

    const accessToken = jwt.sign(
        payload,
        process.env.JWT_ACCESS_SECRET as string,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY as any }
    );

    const refreshToken = jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY as any }
    );

    return {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        accessToken,
        refreshToken
    };
};
export const refreshUserToken = async (token: string) => {
    // 1. Verify the refresh token is valid and hasn't expired
    const decoded: any = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string);

    // 2. Make sure the user still exists in the database
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) throw new Error("User not found");

    // 3. Generate a new set of tokens — always include name + email for the sidebar
    const payload = { id: user.id, email: user.email, role: user.role, name: user.name };

    const newAccessToken = jwt.sign(
        payload,
        process.env.JWT_ACCESS_SECRET as string,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY as any }
    );

    const newRefreshToken = jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY as any }
    );

    return { newAccessToken, newRefreshToken };
};