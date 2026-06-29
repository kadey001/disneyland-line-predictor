import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 dark:border-white/5 glass">
            <div className="flex items-center px-4 py-3 shadow-sm">
                <div className="flex-none">
                    <Link href="/" className="transition-transform hover:scale-105 duration-300 block">
                        <Image
                            src="https://kcr90ci7l2.ufs.sh/f/qmwD8TJNhAVR6yCC5S0FLK3hqPkxOiUGzMnp9tgslfyH8C4Z"
                            alt="Disney Logo"
                            width={42}
                            height={42}
                            className="drop-shadow-md"
                        />
                    </Link>
                </div>
                <div className="grow">
                    <h1 className="text-xl md:text-2xl font-bold text-center tracking-tight">
                        <span className="text-gradient">Disneyland</span> Wait Times
                    </h1>
                </div>
                <div className="flex-none flex items-center gap-3">
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
