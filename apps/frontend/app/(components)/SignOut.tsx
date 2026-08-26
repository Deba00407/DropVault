"use client";

import { useRouter } from "next/navigation";
import { signOut } from "../(utils)/auth";

function SignOut() {
    const router = useRouter();

    const handleSignOut = async () => {
        const { error } = await signOut();

        if (error) {
            console.error("Sign out failed:", error);
            return;
        }

        router.push("/getting-started/sign-in");
    };

    return (
        <button
            onClick={handleSignOut}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
        >
            Sign out
        </button>
    );
}

export {SignOut}