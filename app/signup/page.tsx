"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/compress";
import {
  Camera,
  AlertCircle,
  CheckCircle2,
  User,
  Mail,
  Lock,
} from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be less than 2MB");
      return;
    }

    try {
      const processedFile = await compressImage(file, 512);
      setAvatarFile(processedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string);
      };
      reader.readAsDataURL(processedFile);
    } catch (err) {
      setError("Failed to compress image");
    }
  };

  const validateForm = () => {
    if (!email || !email.includes("@")) return "Invalid email address";
    if (username.length < 3) return "Username must be at least 3 characters";
    if (fullName.length < 2) return "Full name is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      // 0. Check if username is already taken
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username)
        .maybeSingle();

      if (existingUser) {
        throw new Error("Username is already taken");
      }

      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        let finalAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

        // 2. Upload avatar if selected
        if (avatarFile) {
          const fileExt = avatarFile.name.split(".").pop();
          const fileName = `${authData.user.id}-${Math.random()}.${fileExt}`;

          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("avatars")
              .upload(fileName, avatarFile, { upsert: true });

          if (uploadError) {
            console.error("Avatar upload error:", uploadError);
          } else if (uploadData) {
            const {
              data: { publicUrl },
            } = supabase.storage.from("avatars").getPublicUrl(uploadData.path);
            finalAvatar = publicUrl;
          }
        }

        // 3. Update profile with custom username and avatar
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            username: username,
            avatar_url: finalAvatar,
          })
          .eq("id", authData.user.id);

        if (profileError) {
          console.error("Profile update error:", profileError);
        }

        setSuccess("Account created successfully! Redirecting...");

        setTimeout(() => {
          router.push("/");
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans flex items-center justify-center p-4 pb-20">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-serif tracking-widest uppercase mb-4">
            R.MIX
          </h1>
          <p className="text-zinc-500 text-sm">
            Sign up to see photos and videos from your friends.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="flex flex-col items-center mb-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-zinc-700 flex items-center justify-center cursor-pointer overflow-hidden relative group"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-8 h-8 text-gray-400 group-hover:text-zinc-400 transition-colors" />
              )}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-zinc-950" />
              </div>
            </div>
            <p
              className="text-xs text-blue-500 mt-2 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              Add Profile Photo
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                required
              />
            </div>

            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                required
              />
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                @
              </span>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                required
              />
            </div>

            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                required
              />
            </div>

            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-50 hover:bg-zinc-300 text-zinc-950 font-semibold rounded-lg py-2.5 text-sm transition-colors mt-4 disabled:opacity-70"
          >
            {loading ? "Signing up..." : "Sign up"}
          </button>
        </form>

        <div className="text-center mt-6 border-t border-zinc-800 pt-6">
          <p className="text-sm text-zinc-400">
            Have an account?{" "}
            <a
              href="/login"
              className="text-blue-500 font-semibold hover:underline"
            >
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
