import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshInput = z.infer<typeof refreshSchema>;

/** Google Identity Services ID token (the `credential` of the GIS callback). */
export const googleLoginSchema = z.object({
  credential: z.string().min(1).max(4096),
});
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Nome precisa ter pelo menos 2 caracteres").max(120),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** currentPassword is only checked when the account already has a password
 * (a Google-only account is setting its first one). */
export const changePasswordSchema = z.object({
  currentPassword: z.string().max(72).optional(),
  newPassword: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres").max(72),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
